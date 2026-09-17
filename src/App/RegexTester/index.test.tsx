import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RegexTester from './index';

/** 正则输入框 */
const patternInput = (): HTMLInputElement =>
  screen.getByPlaceholderText('输入正则表达式, 例如 ^1[3-9]\\d{9}$') as HTMLInputElement;
/** 多行内容输入框 */
const contentInput = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText(/在此输入多行内容/) as HTMLTextAreaElement;
/** 当前激活的页签面板 */
const pane = (): HTMLElement => document.querySelector('.ant-tabs-tabpane-active') as HTMLElement;
/** 代码块文本 */
const codeText = (): string => pane().querySelector('pre')?.textContent ?? '';
const tab = (name: RegExp) => screen.getByRole('tab', { name });

const typePattern = (v: string) => fireEvent.change(patternInput(), { target: { value: v } });
const clickCopy = (name: string) =>
  fireEvent.click(within(pane()).getByRole('button', { name: new RegExp(name.split('').join('\\s*')) }));

/** 切换语言下拉框 (先展开, 再输入过滤, 最后点选项) */
const selectLang = (label: string) => {
  fireEvent.mouseDown(pane().querySelector('.ant-select-selector') as HTMLElement);
  const input = pane().querySelector('.ant-select-selection-search-input') as HTMLInputElement;
  fireEvent.change(input, { target: { value: label } });
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error(`未找到语言选项: ${label}`);
  fireEvent.click(option);
};

describe('RegexTester 说明 / 代码生成 页签', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('底部有「说明」与「代码生成」两个页签, 默认展示说明的内容', () => {
    render(<RegexTester />);
    expect(tab(/^说明$/)).toBeInTheDocument();
    expect(tab(/代码生成/)).toBeInTheDocument();
    expect(tab(/^说明$/)).toHaveAttribute('aria-selected', 'true');
    // 说明页签默认渲染正则说明 (元字符速查), 代码块尚未渲染
    expect(pane().textContent).toContain('常用元字符速查');
    expect(pane().querySelector('pre')).toBeNull();
  });

  test('切到代码生成: 未输入正则时给出提示, 输入后按默认语言 Python 生成调用代码', () => {
    render(<RegexTester />);
    fireEvent.click(tab(/代码生成/));
    expect(pane().textContent).toContain('请先在上方输入正则表达式, 这里会生成对应语言的调用代码');
    expect(pane().querySelector('pre')).toBeNull();

    typePattern('^1[3-9]\\d{9}$');
    const code = codeText();
    expect(code).toContain('import re');
    expect(code).toContain('pattern = re.compile(r"^1[3-9]\\d{9}$")');
    expect(code).toContain('for m in pattern.finditer(text):');
    expect(pane().textContent).not.toContain('请先在上方输入正则表达式');
  });

  test('勾选 i 标志位后生成代码同步带上忽略大小写选项', () => {
    render(<RegexTester />);
    fireEvent.click(tab(/代码生成/));
    typePattern('^abc$');
    expect(codeText()).not.toContain('re.IGNORECASE');
    fireEvent.click(screen.getByRole('checkbox', { name: /忽略大小写/ }));
    expect(codeText()).toContain('re.compile(r"^abc$", re.IGNORECASE)');
  });

  test('可切换语言, 代码随语言变化 (JavaScript / Rust)', () => {
    render(<RegexTester />);
    fireEvent.click(tab(/代码生成/));
    typePattern('^1[3-9]\\d{9}$');

    selectLang('JavaScript');
    expect(codeText()).toContain('const re = /^1[3-9]\\d{9}$/g;');
    expect(codeText()).toContain('text.matchAll(re)');

    selectLang('Rust');
    expect(codeText()).toContain('Regex::new(r"^1[3-9]\\d{9}$").unwrap()');
  });

  test('复制代码按钮把生成结果写入粘贴板', () => {
    render(<RegexTester />);
    fireEvent.click(tab(/代码生成/));
    typePattern('^a$');
    clickCopy('复制代码');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('re.compile(r"^a$")'));
  });

  test('示例文本取自上方的输入内容, 超过上限时给出截取提示', () => {
    render(<RegexTester />);
    fireEvent.click(tab(/代码生成/));
    typePattern('^a$');
    expect(pane().textContent).toContain('可选的示例文本取自上方的输入内容');
    expect(codeText()).toContain('example text 123'); // 未输入内容时的占位示例

    fireEvent.change(contentInput(), { target: { value: 'l1\nl2' } });
    expect(codeText()).toContain('"""l1\nl2"""');
    expect(pane().textContent).toContain('可选的示例文本取自上方的输入内容'); // 未超上限时保持原提示

    fireEvent.change(contentInput(), { target: { value: 'l1\nl2\nl3\nl4\nl5\nl6\nl7\nl8' } });
    expect(pane().textContent).toContain('示例文本取自上方的输入内容, 最多前 6 行');
    expect(codeText()).toContain('l6');
    expect(codeText()).not.toContain('l7');
  });

  test('切回说明页签后正则说明仍在, 且代码页签内容保留', () => {
    render(<RegexTester />);
    fireEvent.click(tab(/代码生成/));
    typePattern('^a$');
    fireEvent.click(tab(/^说明$/));
    expect(pane().textContent).toContain('常用元字符速查');
    expect(document.body.textContent).toContain('re.compile(r"^a$")'); // 已访问过的页签保持挂载
  });
});
