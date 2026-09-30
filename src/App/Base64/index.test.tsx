import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());
import Base64 from './index';

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

const norm = (s: string) => s.replace(/\s+/g, '');
const textareas = () => screen.getAllByRole('textbox') as HTMLTextAreaElement[];
const btn = (name: string) => {
  const target = norm(name);
  const hit = screen.getAllByRole('button').find((b) => norm(b.textContent ?? '') === target || norm(b.textContent ?? '').includes(target));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};

describe('Base64 页面', () => {
  test('渲染编码/解码/清除按钮', () => {
    render(<Base64 />);
    expect(btn('Base64 编码')).toBeInTheDocument();
    expect(btn('Base64 解码')).toBeInTheDocument();
    expect(btn('清除')).toBeInTheDocument();
  });

  test('输入文本点编码 → 结果框输出 Base64; 再解码还原', () => {
    render(<Base64 />);
    fireEvent.change(textareas()[0], { target: { value: 'hello' } });
    fireEvent.click(btn('编码'));
    expect(textareas()[1].value).toBe('aGVsbG8=');

    fireEvent.click(btn('解码'));
    expect(textareas()[0].value).toBe('hello');
  });

  test('中文编码解码往返', () => {
    render(<Base64 />);
    fireEvent.change(textareas()[0], { target: { value: '你好世界' } });
    fireEvent.click(btn('编码'));
    const encoded = textareas()[1].value;
    expect(encoded).not.toBe('');

    fireEvent.change(textareas()[1], { target: { value: encoded } });
    fireEvent.click(btn('解码'));
    expect(textareas()[0].value).toBe('你好世界');
  });

  test('解码非法 Base64 不崩溃', () => {
    render(<Base64 />);
    fireEvent.change(textareas()[1], { target: { value: '!!!not-base64!!!' } });
    expect(() => fireEvent.click(btn('解码'))).not.toThrow();
  });
});
