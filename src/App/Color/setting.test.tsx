import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ColorSetting } from './setting';
import { LocaleProvider } from '../../hook/locale-context';
import { getDefaultColorType } from './lib';

/** antd 文案里的 CJK 空格: 比较时去掉所有空白 */
const flat = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, '');

/** 打开第 i 个 antd Select 并选中某一项 */
const selectOption = (index: number, text: string) => {
  fireEvent.mouseDown(document.querySelectorAll('.ant-select-selector')[index] as Element);
  const item = screen.getAllByText(text).find((el) => el.closest('.ant-select-item'));
  expect(item).toBeTruthy();
  fireEvent.click(item as Element);
};

describe('ColorSetting 默认设置', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('渲染出设置项, 默认颜色类型为 #HEX', () => {
    render(<ColorSetting />);
    for (const label of ['默认颜色类型', '默认展示配色板', '默认透明度', '默认开启批量取色', '默认最大批量取色个数']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // 第一个下拉 = 默认颜色类型, 第二个 = 默认展示配色板
    expect(flat(document.querySelector('.ant-select-selection-item'))).toContain('#HEX');
  });

  test('切换默认颜色类型后写入 localStorage', () => {
    render(<ColorSetting />);
    selectOption(0, 'RGBA');
    expect(getDefaultColorType()).toBe('RGBA');
  });

  test('已保存的默认颜色类型会回显', () => {
    localStorage.setItem('color:default-color-type', 'CMYK');
    render(<ColorSetting />);
    expect(flat(document.querySelector('.ant-select-selection-item'))).toContain('CMYK');
  });

  test('滑块容器用 flex 擑开 (避免被 Space 挤得很短)', () => {
    render(<ColorSetting />);
    // 默认透明度 / 默认最大批量取色个数 两行的外层容器
    const rows = Array.from(document.querySelectorAll('.ant-form-item-control-input-content > div'))
      .filter((el) => (el as HTMLElement).style.display === 'flex' && (el as HTMLElement).style.maxWidth === '520px') as HTMLElement[];
    expect(rows.length).toBe(2);
    for (const row of rows) {
      const slider = row.querySelector('.ant-slider') as HTMLElement;
      expect(slider).toBeTruthy();
      // Slider 占满剩余宽度 (flex: 1 + minWidth: 0)
      expect(slider.style.flexGrow).toBe('1');
      expect(slider.style.minWidth).toBe('0');
    }
  });

  test('英文环境下展示英文行级文案 (取自 Setting/rows-lang)', () => {
    localStorage.setItem('app-locale', 'en');
    render(<LocaleProvider><ColorSetting /></LocaleProvider>);
    expect(screen.getByText('Default color type')).toBeInTheDocument();
    expect(screen.getByText('Default opacity')).toBeInTheDocument();
  });
});
