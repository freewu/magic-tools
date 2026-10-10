import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());
import URLTool from './index';

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

const norm = (s: string) => s.replace(/\s+/g, '');
const textAreas = () => screen.getAllByRole('textbox') as HTMLTextAreaElement[];
const btn = (name: string) => {
  const target = norm(name);
  const hit = screen.getAllByRole('button').find((b) => norm(b.textContent ?? '') === target);
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};

describe('URL 页面', () => {
  test('操作按钮包裹在同一个 Space 容器内 (按钮之间有间隔)', () => {
    const { container } = render(<URLTool />);
    const btns = Array.from(container.querySelectorAll('button'));
    expect(btns.length).toBe(5);
    const space = btns[0].closest('.ant-space');
    expect(space).not.toBeNull();
    // 所有按钮必须是同一个 Space 的子项, 由 Space 统一提供间距
    btns.forEach((b) => expect(b.closest('.ant-space')).toBe(space));
  });

  test('渲染四个编码/解码按钮', () => {
    render(<URLTool />);
    expect(btn('encodeURIComponent')).toBeInTheDocument();
    expect(btn('decodeURIComponent')).toBeInTheDocument();
    expect(btn('encodeURI')).toBeInTheDocument();
    expect(btn('decodeURI')).toBeInTheDocument();
  });

  test('encodeURIComponent 编码中文与保留字', () => {
    render(<URLTool />);
    fireEvent.change(textAreas()[0], { target: { value: '你好 world?' } });
    fireEvent.click(btn('encodeURIComponent'));
    expect(textAreas()[1].value).toBe('%E4%BD%A0%E5%A5%BD%20world%3F');
  });

  test('decodeURIComponent 解码还原', () => {
    render(<URLTool />);
    fireEvent.change(textAreas()[1], { target: { value: '%E4%BD%A0%E5%A5%BD%20world%3F' } });
    fireEvent.click(btn('decodeURIComponent'));
    expect(textAreas()[0].value).toBe('你好 world?');
  });

  test('encodeURI 保留 # 与 / (不转义保留字符)', () => {
    render(<URLTool />);
    fireEvent.change(textAreas()[0], { target: { value: 'a#b/ c' } });
    fireEvent.click(btn('encodeURI'));
    expect(textAreas()[1].value).toBe('a#b/%20c');
  });

  test('清除按钮清空两侧', () => {
    render(<URLTool />);
    fireEvent.change(textAreas()[0], { target: { value: 'x' } });
    fireEvent.click(btn('encodeURIComponent'));
    fireEvent.click(btn('清除'));
    expect(textAreas()[0].value).toBe('');
    expect(textAreas()[1].value).toBe('');
  });
});
