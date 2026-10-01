import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { TeleprompterSetting } from './setting';
import { COUNTDOWN_DEFAULT, DEFAULTS_STORAGE_KEY, GUIDE_COLOR_DEFAULT } from './data';
import { DEFAULT_OPTIONS, getDefaultOptions } from './lib';

/** 面板里的滑块手柄 (速度 / 字号 / 行距 / 基准线位置 四个) */
const handles = () => Array.from(document.querySelectorAll('.ant-slider-handle')) as HTMLElement[];
/** 面板里的开关 (淡入淡出 / 逐行高亮 / 基准线 三个) */
const switches = () => screen.getAllByRole('switch') as HTMLButtonElement[];
/** 面板里唯一的取色器 (基准线颜色) */
const picker = () => document.querySelector('.ant-color-picker-trigger') as HTMLElement;

describe('TeleprompterSetting 默认设置', () => {
  beforeEach(() => localStorage.clear());

  test('渲染 4 个滑块 + 3 个开关 + 基准线取色器 + 倒计时分段, 初始值即内置默认值', () => {
    render(<TeleprompterSetting />);

    expect(screen.getByText('提词器')).toBeInTheDocument();
    expect(screen.getByText('默认滚动速度')).toBeInTheDocument();
    expect(screen.getByText('默认字号')).toBeInTheDocument();
    expect(screen.getByText('默认行距')).toBeInTheDocument();
    expect(screen.getByText('默认基准线')).toBeInTheDocument();
    expect(screen.getByText('默认基准线位置')).toBeInTheDocument();
    expect(screen.getByText('默认基准线颜色')).toBeInTheDocument();
    expect(screen.getByText('默认倒计时')).toBeInTheDocument();

    expect(handles()).toHaveLength(4);
    expect(screen.getByText(`${DEFAULT_OPTIONS.speed} px/s`)).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_OPTIONS.fontSize} px`)).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_OPTIONS.lineHeight.toFixed(1)} x`)).toBeInTheDocument();
    // 基准线位置默认 42%
    expect(screen.getByText(`${Math.round(DEFAULT_OPTIONS.guideRatio * 100)}%`)).toBeInTheDocument();

    const sw = switches();
    expect(sw).toHaveLength(3);
    // 淡入淡出 / 逐行高亮 / 基准线都默认开启
    expect(sw[0]).toBeChecked();
    expect(sw[1]).toBeChecked();
    expect(sw[2]).toBeChecked();
    // 基准线颜色默认蓝
    expect(picker()).toBeInTheDocument();
    // 倒计时默认档位: 3 秒被选中
    const selected = document.querySelector('.ant-segmented-item-selected');
    expect(selected?.textContent?.replace(/\s+/g, '')).toBe(`${COUNTDOWN_DEFAULT}秒`);
    expect(localStorage.getItem(DEFAULTS_STORAGE_KEY)).toBeNull();
  });

  test('修改默认倒计时立即写入默认设置', () => {
    render(<TeleprompterSetting />);

    expect(getDefaultOptions().countdown).toBe(COUNTDOWN_DEFAULT);
    // 点「5 秒」档位 (antd Segmented 需要点内部的 radio)
    const label = Array.from(document.querySelectorAll('label.ant-segmented-item'))
      .find((el) => (el.textContent ?? '').replace(/\s+/g, '') === '5秒');
    if (!label) throw new Error('未找到「5 秒」档位');
    fireEvent.click(label.querySelector('input') ?? label);

    expect(getDefaultOptions().countdown).toBe(5);
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string).countdown).toBe(5);
  });

  test('滑块拖动 (键盘微调) 与开关都会立即写入默认设置', () => {
    render(<TeleprompterSetting />);

    // rc-slider 读的是 which / keyCode, 单给 key 不会触发
    fireEvent.keyDown(handles()[0], { key: 'ArrowUp', keyCode: 38, which: 38 });
    expect(getDefaultOptions().speed).toBe(DEFAULT_OPTIONS.speed + 5);
    expect(screen.getByText(`${DEFAULT_OPTIONS.speed + 5} px/s`)).toBeInTheDocument();

    fireEvent.keyDown(handles()[1], { key: 'ArrowUp', keyCode: 38, which: 38 });
    expect(getDefaultOptions().fontSize).toBe(DEFAULT_OPTIONS.fontSize + 1);

    fireEvent.keyDown(handles()[2], { key: 'ArrowUp', keyCode: 38, which: 38 });
    // 1.8 → 1.9 (行距保留一位小数)
    expect(getDefaultOptions().lineHeight).toBe(1.9);

    // 基准线位置: 42% → 43%
    fireEvent.keyDown(handles()[3], { key: 'ArrowUp', keyCode: 38, which: 38 });
    expect(getDefaultOptions().guideRatio).toBe(0.43);

    // 关掉三个开关: 其余已存字段保持不变
    fireEvent.click(switches()[0]);
    fireEvent.click(switches()[1]);
    fireEvent.click(switches()[2]);
    expect(getDefaultOptions()).toEqual({
      speed: DEFAULT_OPTIONS.speed + 5,
      fontSize: DEFAULT_OPTIONS.fontSize + 1,
      lineHeight: 1.9,
      fade: false,
      focus: false,
      guide: false,
      guideColor: GUIDE_COLOR_DEFAULT,
      guideRatio: 0.43,
      countdown: COUNTDOWN_DEFAULT,
    });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string).fade).toBe(false);
  });

  test('已保存的默认设置会回显 (与工具页「保存为默认设置」共用同一份)', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({
      speed: 150, fontSize: 64, lineHeight: 2.4, fade: false, focus: false,
      guide: false, guideColor: '#123456',
    }));
    render(<TeleprompterSetting />);

    expect(screen.getByText('150 px/s')).toBeInTheDocument();
    expect(screen.getByText('64 px')).toBeInTheDocument();
    expect(screen.getByText('2.4 x')).toBeInTheDocument();
    const sw = switches();
    expect(sw[0]).not.toBeChecked();
    expect(sw[1]).not.toBeChecked();
    expect(sw[2]).not.toBeChecked();
    // 关掉基准线时取色器置灰, 颜色回显为已存值; 位置非法 (未存) 时回退默认 42%
    expect(picker()).toHaveClass('ant-color-picker-trigger-disabled');
    expect(screen.getByText(`${Math.round(DEFAULT_OPTIONS.guideRatio * 100)}%`)).toBeInTheDocument();
  });

  test('改基准线颜色立即写入默认设置 (十六进制输入)', () => {
    render(<TeleprompterSetting />);

    expect(getDefaultOptions().guideColor).toBe(GUIDE_COLOR_DEFAULT);
    fireEvent.click(picker());
    const wrap = document.querySelector('.ant-color-picker-hex-input');
    const input = (wrap?.tagName === 'INPUT' ? wrap : wrap?.querySelector('input')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abcdef' } });

    expect(getDefaultOptions().guideColor).toBe('#abcdef');
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string).guideColor).toBe('#abcdef');
    // 其余字段不受影响
    expect(getDefaultOptions().guide).toBe(true);

    // 关掉基准线开关同样立刻落盘
    fireEvent.click(switches()[2]);
    expect(getDefaultOptions().guide).toBe(false);
  });

  test('基准线位置滑到边界会夹取到 15% ~ 85%', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ guideRatio: 0.99 }));
    render(<TeleprompterSetting />);

    // 存储里的越界值先被规整到上限 85%
    expect(getDefaultOptions().guideRatio).toBe(0.85);
    expect(screen.getByText('85%')).toBeInTheDocument();

    const arrowDown = { key: 'ArrowDown', keyCode: 40, which: 40 };
    fireEvent.keyDown(handles()[3], arrowDown);
    expect(getDefaultOptions().guideRatio).toBe(0.84);
    // 滑块提示气泡与读数都会回显 84%
    expect(screen.getAllByText('84%').length).toBeGreaterThan(0);
  });

  test('已保存内容损坏时回显内置默认值 (不抛异常)', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{ not json');
    render(<TeleprompterSetting />);

    expect(screen.getByText(`${DEFAULT_OPTIONS.speed} px/s`)).toBeInTheDocument();
    expect(switches()[0]).toBeChecked();
    expect(switches()[1]).toBeChecked();
  });
});
