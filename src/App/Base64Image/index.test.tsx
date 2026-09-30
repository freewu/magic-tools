import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import Base64Image from './index';

afterEach(() => cleanup());

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
  debounce: (op: Function) => op,
}));

type Container = HTMLElement;
const norm = (s: string) => s.replace(/\s+/g, '');
const resultBox = (c: Container) => c.querySelector('textarea') as HTMLTextAreaElement;
const btn = (c: Container, name: string) => {
  const hit = Array.from(c.querySelectorAll('button')).find((b) => norm(b.textContent ?? '') === norm(name));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};
/** 拖入一张 PNG 文件, 等待 FileReader 异步完成 */
const dropFile = async (c: Container) => {
  const file = new File([ 'hello' ], 'pixel.png', { type: 'image/png' });
  fireEvent.drop(resultBox(c), { dataTransfer: { files: [ file ] } });
  await new Promise((r) => setTimeout(r, 120));
};

describe('Base64Image 页面', () => {
  test('渲染场景选项 (img/css/base64) 与清除按钮', () => {
    const { container } = render(<Base64Image />);
    expect(btn(container, '清除')).toBeInTheDocument();
    expect(norm(container.textContent ?? '')).toContain('IMG标签');
    expect(norm(container.textContent ?? '')).toContain('Base64');
  });

  test('拖入图片后按 img 场景生成 <img> 标签', async () => {
    const { container } = render(<Base64Image />);
    await dropFile(container);
    const value = resultBox(container).value;
    expect(value).toContain('<img');
    expect(value).toContain('src="data:image/png;base64,');
  });

  test('切到 CSS 场景: 输出 url("...")', async () => {
    const { container } = render(<Base64Image />);
    await dropFile(container);
    // 选择第 2 个 radio (CSS)
    const radios = Array.from(container.querySelectorAll('label input[type=radio]')) as HTMLInputElement[];
    fireEvent.click(radios[1]);
    await new Promise((r) => setTimeout(r, 60));
    expect(resultBox(container).value).toContain('url("');
  });

  test('清除按钮清空结果', async () => {
    const { container } = render(<Base64Image />);
    await dropFile(container);
    expect(resultBox(container).value).not.toBe('');
    fireEvent.click(btn(container, '清除'));
    expect(resultBox(container).value).toBe('');
  });
});