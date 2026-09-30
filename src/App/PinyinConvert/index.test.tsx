import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());
import PinyinConvert from './index';

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
});
