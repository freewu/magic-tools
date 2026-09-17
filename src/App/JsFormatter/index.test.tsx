import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import JsFormatter from './index';
import { SAMPLE_JS } from './data';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveTextFile as jest.Mock;

/** 代码输入框 */
const codeBox = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText(/输入 JavaScript 代码/) as HTMLTextAreaElement;
/** 当前激活的页签面板 */
const pane = (): HTMLElement => document.querySelector('.ant-tabs-tabpane-active') as HTMLElement;
/** 页签按钮 */
const tab = (name: RegExp | string) => screen.getByRole('tab', { name });
/** 结果面板里的 <pre> */
const resultPre = (): HTMLElement => document.querySelector('pre.hljs') as HTMLElement;
/** 结果文本 (未高亮的纯文本) */
const resultText = (): string => resultPre()?.textContent ?? '';
/** 提示信息 */
const noticeText = (): string => document.querySelector('.ant-message')?.textContent ?? '';
/** 中文按钮名 (antd 会在恰好两个汉字间插入空格) */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.length === 2 ? name.split('').join('\\s*') : name) });

const type = (v: string) => fireEvent.change(codeBox(), { target: { value: v } });

const openMode = (label: string) => fireEvent.click(tab(new RegExp(label)));

const pickFile = (name: string, content = 'var a = 1;') => {
  const input = document.querySelector('#jsFileInput') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [ new File([ content ], name, { type: 'text/javascript' }) ] } });
};

/** 选择缩进下拉项 */
const pickIndent = (label: string) => {
  fireEvent.mouseDown(pane().querySelector('.ant-select-selector') as HTMLElement);
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error(`未找到下拉项: ${label}`);
  fireEvent.click(option);
};

describe('JsFormatter 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('默认展示「说明」页签, 四个功能页签齐全', () => {
    render(<JsFormatter />);
    expect(tab('说明')).toHaveAttribute('aria-selected', 'true');
    expect(tab(/代码美化/)).toBeInTheDocument();
    expect(tab(/代码压缩/)).toBeInTheDocument();
    expect(tab(/混淆加密/)).toBeInTheDocument();
    expect(tab(/解密还原/)).toBeInTheDocument();
    expect(pane().textContent).toContain('JavaScript 格式化 / 压缩 / 混淆 / 解密');
    expect(document.querySelector('pre.hljs')).toBeNull();
  });

  test('未输入代码时各功能按钮给出提示', () => {
    render(<JsFormatter />);
    openMode('代码美化');
    fireEvent.click(btn('美化'));
    expect(noticeText()).toContain('请先输入 JavaScript 代码');

    openMode('代码压缩');
    fireEvent.click(btn('压缩'));
    expect(noticeText()).toContain('请先输入 JavaScript 代码');

    openMode('混淆加密');
    fireEvent.click(btn('加密'));
    expect(noticeText()).toContain('请先输入 JavaScript 代码');

    openMode('解密还原');
    fireEvent.click(btn('解密'));
    expect(noticeText()).toContain('请先输入 JavaScript 代码');
    expect(document.querySelector('pre.hljs')).toBeNull();
  });

  test('美化: 缩进换行 + 运算符空格, 并显示「语义未变」与字符数', () => {
    render(<JsFormatter />);
    openMode('代码美化');
    type('function add(a,b){if(a>b){return a+b}else{return a-b}}');
    fireEvent.click(btn('美化'));

    expect(resultText()).toContain('function add(a, b) {');
    expect(resultText()).toContain('\n  if (a > b) {\n    return a + b\n');
    expect(document.body.textContent).toContain('语义未变 (token 指纹一致)');
    expect(document.body.textContent).toContain(`字符数: ${resultText().length}`);
  });

  test('美化: 可切换缩进为 Tab', () => {
    render(<JsFormatter />);
    openMode('代码美化');
    type('if(a){b}');
    fireEvent.click(btn('美化'));
    expect(resultText()).toContain('\n  b\n');

    pickIndent('Tab');
    fireEvent.click(btn('美化'));
    expect(resultText()).toContain('\n\tb\n');
  });

  test('美化: 关闭「保留空行」后空行被删除', () => {
    render(<JsFormatter />);
    openMode('代码美化');
    type('a; // one\n\n\nb;');
    fireEvent.click(btn('美化'));
    expect(resultText()).toBe('a; // one\n\nb;\n');

    const keep = pane().querySelector('.ant-switch') as HTMLElement;
    fireEvent.click(keep);
    fireEvent.click(btn('美化'));
    expect(resultText()).toBe('a; // one\nb;\n');
  });

  test('压缩: 默认移除注释并压成单行', () => {
    render(<JsFormatter />);
    openMode('代码压缩');
    type('const a = 1; // 注释\nconst b = 2;\n\nfunction f() {\n  return a + b;\n}');
    fireEvent.click(btn('压缩'));
    expect(resultText()).toBe('const a=1;const b=2;function f(){return a+b;}');
    expect(document.body.textContent).toContain('语义未变 (token 指纹一致)');
  });

  test('压缩: 关闭「单行输出」保留换行, 关闭「移除注释」保留注释', () => {
    render(<JsFormatter />);
    openMode('代码压缩');
    type('const a = 1;\nconst b = 2;');
    fireEvent.click(btn('压缩'));
    expect(resultText()).toBe('const a=1;const b=2;');

    const switches = pane().querySelectorAll('.ant-switch');
    fireEvent.click(switches[1]); // 单行输出 -> 关
    fireEvent.click(btn('压缩'));
    expect(resultText()).toBe('const a=1;\nconst b=2;');

    fireEvent.click(switches[0]); // 移除注释 -> 关
    type('a = 1; // 注释');
    fireEvent.click(btn('压缩'));
    expect(resultText()).toContain('// 注释');
  });

  test('混淆加密: 默认词表打包, 结果可被「解密还原」还原', () => {
    render(<JsFormatter />);
    const src = "function f(a){return a + '中文'}";
    openMode('混淆加密');
    type(src);
    fireEvent.click(btn('加密'));
    const packed = resultText();
    expect(packed.startsWith('eval(function(m,d){')).toBe(true);
    expect(/^[\x20-\x7e]*$/.test(packed)).toBe(true);

    fireEvent.change(codeBox(), { target: { value: packed } });
    openMode('解密还原');
    fireEvent.click(btn('解密'));
    expect(resultText()).toBe(src);
    expect(document.body.textContent).toContain('已还原: 1 层');
    expect(document.body.textContent).toContain('词表打包');
  });

  test('混淆加密: 切到字符串转义模式后只转义字符串内容', () => {
    render(<JsFormatter />);
    openMode('混淆加密');
    type("const s = 'ab中文';");
    const radios = document.querySelectorAll('.ant-radio-button-wrapper input');
    expect(radios.length).toBe(3);
    // 第二个单选项: 仅字符串转义 (\xNN)
    fireEvent.click(radios[1]);
    fireEvent.click(btn('加密'));
    expect(resultText()).toBe("const s = '\\x61\\x62\\u4e2d\\u6587';");

    // 第三个单选项: 仅非 ASCII 转义 (\uNNNN)
    fireEvent.click(radios[2]);
    fireEvent.click(btn('加密'));
    expect(resultText()).toBe("const s = 'ab\\u4e2d\\u6587';");
  });

  test('解密还原: 无混淆特征时提示原样返回', () => {
    render(<JsFormatter />);
    openMode('解密还原');
    type('var a = 1;');
    fireEvent.click(btn('解密'));
    expect(noticeText()).toContain('未检测到可还原的混淆特征, 已原样返回');
    expect(resultText()).toBe('var a = 1;');
  });

  test('结果面板带语法高亮, 但复制出去的是纯文本', () => {
    render(<JsFormatter />);
    openMode('代码美化');
    type('const n = 1;');
    fireEvent.click(btn('美化'));
    const pre = resultPre();
    expect(pre.querySelectorAll('[class^="hljs-"]').length).toBeGreaterThan(0);

    fireEvent.click(btn('复制结果'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const n = 1;\n');
    expect(noticeText()).toContain('复制到粘贴板成功！！！');
  });

  test('点击结果面板可复制结果', () => {
    render(<JsFormatter />);
    openMode('代码压缩');
    type('const n = 1;');
    fireEvent.click(btn('压缩'));
    fireEvent.click(resultPre());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const n=1;');
  });

  test('保存为 .js 会带上结果内容与文件名', async () => {
    render(<JsFormatter />);
    openMode('代码压缩');
    type('const n = 1;');
    fireEvent.click(btn('压缩'));
    fireEvent.click(btn('保存为 .js'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockSave.mock.calls[0][0]).toBe('formatted.js');
    expect(mockSave.mock.calls[0][1]).toBe('const n=1;');
    await waitFor(() => expect(noticeText()).toContain('已保存 JavaScript 文件'));
  });

  test('未压缩/美化时点保存给出提示', () => {
    render(<JsFormatter />);
    fireEvent.click(btn('保存为 .js'));
    expect(noticeText()).toContain('请先输入 JavaScript 代码');
    expect(mockSave).not.toHaveBeenCalled();
  });

  test('示例按钮填入示例代码, 清除按钮清空输入与结果', () => {
    render(<JsFormatter />);
    fireEvent.click(btn('示例'));
    expect(codeBox().value).toBe(SAMPLE_JS);
    expect(codeBox().value).toContain('function greet(name, lang)');

    openMode('代码美化');
    fireEvent.click(btn('美化'));
    expect(document.querySelector('pre.hljs')).toBeTruthy();

    fireEvent.click(btn('清除'));
    expect(codeBox().value).toBe('');
    expect(document.querySelector('pre.hljs')).toBeNull();
  });

  test('打开文件: 扩展名不符时提示, 合法 .js 文件读入输入框', async () => {
    render(<JsFormatter />);
    pickFile('a.png');
    expect(noticeText()).toContain('请选择 .js / .mjs / .cjs / .txt 文件');
    expect(codeBox().value).toBe('');

    pickFile('demo.js', 'const x = 1;');
    await waitFor(() => expect(codeBox().value).toBe('const x = 1;'));
  });

  test('正则字面量 / 模板字符串美化后 token 指纹依然一致', () => {
    render(<JsFormatter />);
    openMode('代码美化');
    type('const re=/a\\d+/g;const t=`x${1+2}`;');
    fireEvent.click(btn('美化'));
    expect(document.body.textContent).toContain('语义未变 (token 指纹一致)');
    expect(resultText()).toContain('const re = /a\\d+/g;');
    // 模板字符串整体作为一个 token 保留原样 (含其中的表达式)
    expect(resultText()).toContain('const t = `x${1+2}`;');

    // 混淆 / 解密结果不做指纹标记
    openMode('混淆加密');
    fireEvent.click(btn('加密'));
    expect(document.body.textContent).not.toContain('语义未变 (token 指纹一致)');
  });
});
