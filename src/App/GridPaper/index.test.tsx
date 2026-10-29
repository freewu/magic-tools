import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import GridPaper from './index';

type PrintArgs = [ string, { title: string; css: string } ];
const mockPrint = jest.fn<boolean, PrintArgs>(() => true);
jest.mock('../../lib/print', () => ({
  printHtml: (body: string, opts: { title: string; css: string }) => mockPrint(body, opts),
}));

/** 预览里的页面 SVG (data-page 由 lib 打出; antd 图标的 svg 没有该属性) */
const pageSvgs = (container: HTMLElement): SVGElement[] =>
  Array.from(container.querySelectorAll('svg[data-page]')) as unknown as SVGElement[];

const firstPage = (container: HTMLElement): SVGElement => pageSvgs(container)[0];

/** 数字输入框顺序: 格子大小 / 页边距 / 线宽 / 页数 / 加粗间隔 */
const numberInputs = (container: HTMLElement): HTMLInputElement[] =>
  Array.from(container.querySelectorAll('input[role="spinbutton"]')) as HTMLInputElement[];

/** 点击 Segmented 选项 (页面下方的说明文档里也含同名文字, 必须限定在选项标签上) */
const clickOption = (text: string) => {
  const el = Array.from(document.querySelectorAll('.ant-segmented-item-label'))
    .find((e) => (e.textContent ?? '') === text);
  if (!el) throw new Error(`分段选项未找到: ${text}`);
  fireEvent.click(el);
};

const clickPrint = () => fireEvent.click(screen.getByRole('button', { name: /打印 A4/ }));

describe('GridPaper 交互', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPrint.mockClear();
    mockPrint.mockReturnValue(true);
  });

  test('默认为 A4 纵向方格纸: 38 × 55 格', () => {
    const { container } = render(<GridPaper />);
    const svg = firstPage(container);
    expect(svg.getAttribute('data-paper')).toBe('A4');
    expect(svg.getAttribute('data-orientation')).toBe('portrait');
    expect(svg.getAttribute('data-pattern')).toBe('grid');
    expect(svg.getAttribute('data-cols')).toBe('38');
    expect(svg.getAttribute('data-rows')).toBe('55');
    expect(container.textContent).toContain('A4 (210×297mm)');
    expect(container.textContent).toContain('格子 5mm · 每页 38 × 55 = 2090 格');
    expect(numberInputs(container)[0].value).toBe('5.0'); // step = 0.5
    expect(numberInputs(container)[1].value).toBe('10');
  });

  test('四种纸张都能选: B5 变 31 × 46, A3 变 55 × 79', () => {
    const { container } = render(<GridPaper />);

    clickOption('B5 (176×250mm)');
    expect(firstPage(container).getAttribute('data-paper')).toBe('B5');
    expect(firstPage(container).getAttribute('data-cols')).toBe('31');
    expect(firstPage(container).getAttribute('data-rows')).toBe('46');

    clickOption('A3 (297×420mm)');
    expect(firstPage(container).getAttribute('data-paper')).toBe('A3');
    expect(firstPage(container).getAttribute('data-cols')).toBe('55');
    expect(firstPage(container).getAttribute('data-rows')).toBe('80'); // (420 - 20) / 5

    clickOption('B6 (125×176mm)');
    expect(firstPage(container).getAttribute('data-cols')).toBe('21');
    expect(firstPage(container).getAttribute('data-rows')).toBe('31');
  });

  test('切换横向后列数行数互换', () => {
    const { container } = render(<GridPaper />);
    clickOption('横向');
    expect(firstPage(container).getAttribute('data-orientation')).toBe('landscape');
    expect(firstPage(container).getAttribute('data-cols')).toBe('55');
    expect(firstPage(container).getAttribute('data-rows')).toBe('38');
  });

  test('格型切换: 点阵用 pattern, 横线无竖线', () => {
    const { container } = render(<GridPaper />);

    clickOption('点阵');
    expect(firstPage(container).getAttribute('data-pattern')).toBe('dots');
    expect(firstPage(container).innerHTML).toContain('<pattern');

    clickOption('横线');
    expect(firstPage(container).getAttribute('data-pattern')).toBe('lines');
    const d = firstPage(container).querySelector('path')?.getAttribute('d') ?? '';
    expect(d).toContain('H');
    expect(d).not.toContain('V');
  });

  test('改格子大小为 10mm 后行列数同步变化', () => {
    const { container } = render(<GridPaper />);
    fireEvent.change(numberInputs(container)[0], { target: { value: '10' } });
    expect(firstPage(container).getAttribute('data-cols')).toBe('19');
    expect(firstPage(container).getAttribute('data-rows')).toBe('27');
    expect(container.textContent).toContain('每页 19 × 27 = 513 格');
  });

  test('页数决定预览页数, 且记住上次参数', () => {
    const { container } = render(<GridPaper />);
    expect(pageSvgs(container)).toHaveLength(1);

    fireEvent.change(numberInputs(container)[3], { target: { value: '3' } });
    expect(pageSvgs(container)).toHaveLength(3);
    expect(pageSvgs(container)[2].getAttribute('data-page')).toBe('3');

    clickOption('B5 (176×250mm)');
    expect(localStorage.getItem('grid-paper.paper')).toBe('B5');
    expect(localStorage.getItem('grid-paper.pages')).toBe('3');
  });

  test('加粗间隔产生第二条加粗路径', () => {
    const { container } = render(<GridPaper />);
    expect(firstPage(container).querySelectorAll('path')).toHaveLength(1);

    fireEvent.change(numberInputs(container)[4], { target: { value: '5' } });
    const paths = firstPage(container).querySelectorAll('path');
    expect(paths).toHaveLength(2);
    expect(paths[1].getAttribute('stroke-width')).toBe('0.38'); // 0.2 × 1.9
  });

  test('打印: 传入与所选纸张一致的 @page 尺寸', () => {
    render(<GridPaper />);
    clickPrint();

    expect(mockPrint).toHaveBeenCalledTimes(1);
    const [ body, opts ] = mockPrint.mock.calls[0];
    expect(body).toContain('<div class="pg">');
    expect(opts.css).toContain('@page { size: 210mm 297mm; margin: 0; }');
    expect(opts.title).toBe('格子纸 A4 5mm');
  });

  test('打印失败时不会抛错 (提示由 message 负责)', () => {
    mockPrint.mockReturnValue(false);
    render(<GridPaper />);
    expect(() => clickPrint()).not.toThrow();
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });
});
