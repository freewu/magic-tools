import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatGeneratorSetting } from './setting';
import { LocaleProvider } from '../../hook/locale-context';
import { KEY_PLATFORM, KEY_SCALE, KEY_SHOW_INPUT, KEY_SHOW_NAMES, KEY_TITLE } from './data';
import { DEFAULT_KEYS, getDefaultPlatform, getDefaultScale, getDefaultShowInputBar, getDefaultShowNames, getDefaultTitle } from './lib';

/** antd Button / 文案里的 CJK 空格: 比较时去掉所有空白 */
const flat = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, '');

/** 打开第 i 个 antd Select 并选中某一项 */
const selectOption = (index: number, text: string) => {
  fireEvent.mouseDown(document.querySelectorAll('.ant-select-selector')[index] as Element);
  const item = screen.getAllByText(text).find((el) => el.closest('.ant-select-item'));
  expect(item).toBeTruthy();
  fireEvent.click(item as Element);
};

describe('ChatGeneratorSetting 默认设置', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('渲染出 5 个设置项, 初始值为内置默认值', () => {
    render(<ChatGeneratorSetting />);
    expect(screen.getByText('聊天生成器')).toBeInTheDocument();
    for (const label of [ '默认平台', '默认聊天标题', '默认导出倍率', '默认显示底部输入栏', '默认显示昵称' ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // 平台下拉显示内置默认 (微信), 倍率显示 2x
    expect(flat(document.querySelector('.ant-select-selection-item'))).toContain('微信');
    expect(flat(document.querySelectorAll('.ant-select-selection-item')[1])).toContain('2x');
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toBeChecked(); // 默认显示底部输入栏: 开
    expect(switches[1]).not.toBeChecked(); // 默认显示昵称: 关
    expect((screen.getByDisplayValue('文件传输助手') as HTMLInputElement).value).toBe('文件传输助手');
  });

  test('修改平台 / 倍率 / 开关后写入 localStorage', () => {
    render(<ChatGeneratorSetting />);
    selectOption(0, 'Discord');
    expect(getDefaultPlatform()).toBe('discord');

    selectOption(1, '3x');
    expect(getDefaultScale()).toBe(3);

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);
    expect(getDefaultShowInputBar()).toBe(false);
    expect(getDefaultShowNames()).toBe(true);
  });

  test('聊天标题输入即持久化, 并截断到长度上限', () => {
    render(<ChatGeneratorSetting />);
    const input = screen.getByDisplayValue('文件传输助手') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '项目群' } });
    expect(getDefaultTitle()).toBe('项目群');
    // antd maxLength 会截断键入, 这里直接验证写入口径的长度上限
    fireEvent.change(input, { target: { value: '标'.repeat(40) } });
    expect(getDefaultTitle().length).toBe(30);
  });

  test('已保存的默认值会回显 (含平台 / 倍率 / 开关 / 标题)', () => {
    localStorage.setItem(KEY_PLATFORM, 'line');
    localStorage.setItem(KEY_SCALE, '3');
    localStorage.setItem(KEY_TITLE, '已存标题');
    localStorage.setItem(KEY_SHOW_INPUT, '0');
    localStorage.setItem(KEY_SHOW_NAMES, '1');
    render(<ChatGeneratorSetting />);

    expect(flat(document.querySelector('.ant-select-selection-item'))).toContain('LINE');
    expect(flat(document.querySelectorAll('.ant-select-selection-item')[1])).toContain('3x');
    expect((screen.getByDisplayValue('已存标题') as HTMLInputElement).value).toBe('已存标题');
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).not.toBeChecked();
    expect(switches[1]).toBeChecked();
  });

  test('非法存储值不会污染设置面板', () => {
    for (const key of DEFAULT_KEYS) localStorage.setItem(key, 'not-valid');
    render(<ChatGeneratorSetting />);
    // 平台回退微信, 倍率回退 2x, 开关回退默认
    expect(flat(document.querySelector('.ant-select-selection-item'))).toContain('微信');
    expect(flat(document.querySelectorAll('.ant-select-selection-item')[1])).toContain('2x');
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked();
    expect(switches[1]).not.toBeChecked();
  });

  test('英文环境下展示英文标签 (行级文案取自 Setting/rows-lang)', () => {
    localStorage.setItem('app-locale', 'en');
    render(<LocaleProvider><ChatGeneratorSetting /></LocaleProvider>);
    expect(screen.getByText('Chat Generator')).toBeInTheDocument();
    expect(screen.getByText('Default platform')).toBeInTheDocument();
    expect(screen.getByText('Default export scale')).toBeInTheDocument();
  });
});
