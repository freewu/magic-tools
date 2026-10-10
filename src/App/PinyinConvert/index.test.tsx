import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());
import PinyinConvert from './index';
import { copyTextToClipboard } from '../../lib';

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

describe('PinyinConvert 页面', () => {
  test('渲染输入与结果框', () => {
    render(<PinyinConvert />);
    expect(screen.getByPlaceholderText('请输入中文')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('点击复制内容到粘贴板')).toBeInTheDocument();
  });

  test('输入中文后输出拼音 (非空且不是原文)', () => {
    render(<PinyinConvert />);
    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '你好世界' } });
    const result = (screen.getByPlaceholderText('点击复制内容到粘贴板') as HTMLTextAreaElement).value;
    expect(result).not.toBe('');
    expect(result).not.toBe('你好世界');
    expect(result).toContain('nǐ');
  });

  test('清空输入后结果归零; 清除按钮生效', () => {
    render(<PinyinConvert />);
    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '苹果' } });
    expect((screen.getByPlaceholderText('点击复制内容到粘贴板') as HTMLTextAreaElement).value).not.toBe('');
    fireEvent.change(input, { target: { value: '' } });
    expect((screen.getByPlaceholderText('点击复制内容到粘贴板') as HTMLTextAreaElement).value).toBe('');
  });

  // 切换结果展示方式 (拼音注音 / 拼音文本)
  const switchMode = (container :HTMLElement, label :string) => {
    const item = Array.from(container.querySelectorAll('.ant-segmented-item')).find((el) => el.textContent === label);
    expect(item).toBeTruthy();
    fireEvent.click(item as Element);
  };

  test('拼音注音排版: 默认展示, 汉字为基字, 拼音在 rt 中显示在汉字上方', () => {
    const { container } = render(<PinyinConvert />);
    // 未输入时展示提示文案
    expect(container.querySelector('.pinyin-ruby-box')).toBeInTheDocument();
    expect(container.querySelector('.pinyin-ruby-empty')).toBeInTheDocument();
    expect(container.querySelectorAll('.pinyin-ruby-box ruby').length).toBe(0);

    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '你好世界' } });

    const rubies = Array.from(container.querySelectorAll('.pinyin-ruby-box ruby'));
    expect(rubies.length).toBe(4);
    // ruby 的基字是汉字本身, rt 是注音
    expect(rubies.map((el) => el.childNodes[0]?.textContent)).toEqual(['你', '好', '世', '界']);
    expect(rubies.map((el) => el.querySelector('rt')?.textContent)).toEqual(['nǐ', 'hǎo', 'shì', 'jiè']);
    // 注音排版不会显示原文之外的内容 (非汉字项原样展示)
    expect(container.querySelector('.pinyin-ruby-box')?.textContent).toBe('你nǐ好hǎo世shì界jiè');
  });

  test('拼音注音排版: 非汉字内容与换行原样保留', () => {
    const { container } = render(<PinyinConvert />);
    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '中文abc 123\n第二行' } });

    const box = container.querySelector('.pinyin-ruby-box') as HTMLElement;
    const rubies = Array.from(box.querySelectorAll('ruby'));
    expect(rubies.map((el) => el.childNodes[0]?.textContent)).toEqual(['中', '文', '第', '二', '行']);
    // 英文/数字/空格原样保留, 换行渲染成 <br />
    expect(box.textContent).toContain('abc 123');
    expect(box.querySelectorAll('br').length).toBe(1);
    // 多音字结合上下文 (第二行 -> háng)
    expect(rubies[4].querySelector('rt')?.textContent).toBe('háng');
  });

  test('输入不含汉字时不显示注音, 只显示提示', () => {
    const { container } = render(<PinyinConvert />);
    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'hello 123' } });
    expect(container.querySelectorAll('.pinyin-ruby-box ruby').length).toBe(0);
    expect(container.querySelector('.pinyin-ruby-empty')).toBeInTheDocument();
  });

  test('切换为拼音文本后隐藏注音排版, 结果文本仍正常', () => {
    const { container } = render(<PinyinConvert />);
    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '你好' } });
    expect(container.querySelector('.pinyin-ruby-box')).toBeInTheDocument();

    switchMode(container, '拼音文本');
    expect(container.querySelector('.pinyin-ruby-box')).toBeNull();
    expect(container.querySelectorAll('ruby').length).toBe(0);
    expect((screen.getByPlaceholderText('点击复制内容到粘贴板') as HTMLTextAreaElement).value).toContain('nǐ');

    // 切回注音排版
    switchMode(container, '拼音注音');
    expect(container.querySelectorAll('.pinyin-ruby-box ruby').length).toBe(2);
  });

  test('点击注音排版区复制拼音文本', () => {
    const { container } = render(<PinyinConvert />);
    const input = screen.getByPlaceholderText('请输入中文') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '苹果' } });
    fireEvent.click(container.querySelector('.pinyin-ruby-box') as Element);
    expect(copyTextToClipboard).toHaveBeenCalled();
  });
});
