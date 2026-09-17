import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { TeleprompterSetting } from './setting';
import { DEFAULTS_STORAGE_KEY } from './data';
import { DEFAULT_OPTIONS, getDefaultOptions } from './lib';

/** 面板里的滑块手柄 (速度 / 字号 / 行距 三个) */
const handles = () => Array.from(document.querySelectorAll('.ant-slider-handle')) as HTMLElement[];
/** 面板里的开关 (淡入淡出 / 逐行高亮 两个) */
const switches = () => screen.getAllByRole('switch') as HTMLButtonElement[];

describe('TeleprompterSetting 默认设置', () => {
  beforeEach(() => localStorage.clear());

  test('渲染 3 个滑块 + 2 个开关, 初始值即内置默认值', () => {
    render(<TeleprompterSetting />);

    expect(screen.getByText('提词器')).toBeInTheDocument();
    expect(screen.getByText('默认滚动速度')).toBeInTheDocument();
    expect(screen.getByText('默认字号')).toBeInTheDocument();
    expect(screen.getByText('默认行距')).toBeInTheDocument();

    expect(handles()).toHaveLength(3);
    expect(screen.getByText(`${DEFAULT_OPTIONS.speed} px/s`)).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_OPTIONS.fontSize} px`)).toBeInTheDocument();
    expect(screen.getByText(`${DEFAULT_OPTIONS.lineHeight.toFixed(1)} x`)).toBeInTheDocument();

    const sw = switches();
    expect(sw).toHaveLength(2);
    // 淡入淡出与逐行高亮都默认开启
    expect(sw[0]).toBeChecked();
    expect(sw[1]).toBeChecked();
    expect(localStorage.getItem(DEFAULTS_STORAGE_KEY)).toBeNull();
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

    // 关掉两个开关: 其余已存字段保持不变
    fireEvent.click(switches()[0]);
    fireEvent.click(switches()[1]);
    expect(getDefaultOptions()).toEqual({
      speed: DEFAULT_OPTIONS.speed + 5,
      fontSize: DEFAULT_OPTIONS.fontSize + 1,
      lineHeight: 1.9,
      fade: false,
      focus: false,
    });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string).fade).toBe(false);
  });

  test('已保存的默认设置会回显 (与工具页「保存为默认设置」共用同一份)', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({
      speed: 150, fontSize: 64, lineHeight: 2.4, fade: false, focus: false,
    }));
    render(<TeleprompterSetting />);

    expect(screen.getByText('150 px/s')).toBeInTheDocument();
    expect(screen.getByText('64 px')).toBeInTheDocument();
    expect(screen.getByText('2.4 x')).toBeInTheDocument();
    const sw = switches();
    expect(sw[0]).not.toBeChecked();
    expect(sw[1]).not.toBeChecked();
  });

  test('已保存内容损坏时回显内置默认值 (不抛异常)', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{ not json');
    render(<TeleprompterSetting />);

    expect(screen.getByText(`${DEFAULT_OPTIONS.speed} px/s`)).toBeInTheDocument();
    expect(switches()[0]).toBeChecked();
    expect(switches()[1]).toBeChecked();
  });
});
