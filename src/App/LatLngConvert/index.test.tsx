import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import LatLngConvert from './index';
import { LocaleProvider } from '../../hook/locale-context';

const renderPage = () => render(
  <LocaleProvider>
    <LatLngConvert />
  </LocaleProvider>
);

// 结果区的只读输入框 (4 行 × 纬度/经度)
const resultInputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('input[readonly]')) as HTMLInputElement[];

describe('经纬度格式转换 页面', () => {
  beforeEach(() => localStorage.clear());

  it('输入十进制后展示四种格式结果', () => {
    const { container } = renderPage();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '39.20567, 116.12345' } });

    expect(screen.getByDisplayValue('39.20567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('116.12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('39°12′20.41″N')).toBeInTheDocument();
    expect(screen.getByDisplayValue('39°12.3402′N')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3912.3402N')).toBeInTheDocument();
  });

  it('非法输入给出提示', () => {
    const { container } = renderPage();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '100, 116' } });
    expect(screen.getByText(/纬度超出范围/)).toBeInTheDocument();
  });

  it('点击示例标签可载入并转换', () => {
    renderPage();
    fireEvent.click(screen.getByText('度分秒'));
    expect(screen.getByDisplayValue('39.908722')).toBeInTheDocument();
    expect(screen.getByDisplayValue('116.3975')).toBeInTheDocument();
    expect(screen.getByDisplayValue('39°54′31.4″N')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3954.5233N')).toBeInTheDocument();
  });

  it('清除按钮清空结果', () => {
    const { container } = renderPage();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '39.20567, 116.12345' } });
    fireEvent.click(screen.getByRole('button', { name: /清\s*除/ }));
    expect(container.querySelector('textarea')?.value).toBe('');
    expect(screen.queryByDisplayValue('39.20567')).not.toBeInTheDocument();
    // 清空后结果区仍在 (空值 + 灰色占位)
    expect(screen.getByText('转换结果')).toBeInTheDocument();
    const inputs = resultInputs(container);
    expect(inputs.length).toBe(8);
    inputs.forEach((i) => expect(i.value).toBe(''));
  });

  it('空输入时仍展示转换结果区 (空值 + 灰色占位示例)', () => {
    const { container } = renderPage();
    expect(screen.getByText('转换结果')).toBeInTheDocument();
    // 四种格式的行标题都在 (行内标签, 非顶部的格式选择)
    const rowLabels = Array.from(container.querySelectorAll('.latlng-row-label')).map((e) => (e.textContent || '').trim());
    expect(rowLabels).toEqual([ '十进制 (DD)', '度分秒 (DMS)', '度分 (DM)', '国家标准 (DDMM.mm)' ]);
    const inputs = resultInputs(container);
    expect(inputs.length).toBe(8);                        // 4 行 × (纬度 / 经度)
    inputs.forEach((i) => expect(i.value).toBe(''));      // 值为空
    expect(inputs[0].placeholder).toBe('39.908722');      // 灰色占位 = 首个示例的转换结果
    expect(inputs[1].placeholder).toBe('116.3975');
    expect(inputs[2].placeholder).toBe('39°54′31.4″N');
    expect(inputs[3].placeholder).toBe('116°23′51″E');
  });

  it('示例为彩色标签置顶, 且不再显示「示例」「输入格式」文字', () => {
    const { container } = renderPage();
    expect(screen.queryByText('示例')).not.toBeInTheDocument();
    expect(screen.queryByText('输入格式')).not.toBeInTheDocument();
    expect(screen.getByText('书写顺序')).toBeInTheDocument();

    const tags = Array.from(container.querySelectorAll('.ant-tag')) as HTMLElement[];
    expect(tags.map((e) => (e.textContent || '').trim())).toEqual(
      [ '十进制', '度分秒', '度分', '国家标准', '经度在前', '南纬 / 西经' ],
    );
    // 每个标签带颜色 class
    [ 'ant-tag-blue', 'ant-tag-cyan', 'ant-tag-purple', 'ant-tag-green', 'ant-tag-gold', 'ant-tag-magenta' ]
      .forEach((cls, i) => expect(tags[i].className).toContain(cls));
    // 标签行在最上面 (位于格式选择行之前), 且单独一行
    const firstTag = tags[0];
    const radios = container.querySelector('.ant-radio-group') as HTMLElement;
    expect(firstTag.compareDocumentPosition(radios) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstTag.closest('.ant-space') === container.querySelector('.ant-radio-group')!.closest('.ant-space')).toBe(false);
  });
});
