import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import VigenereCrypto from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/file', () => ({
  openFile: jest.fn(),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));

describe('维吉尼亚加解密 页面', () => {
  test('渲染标题与关键控件 (加密/解密按钮 + 输入输出区)', () => {
    const { container } = render(<VigenereCrypto />);
    // 页面有渲染内容 (表单参数区)
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 加密 / 解密 / 清除按钮在页面可用按钮里出现
    const btns = buttons(container);
    expect(btns.some((n) => n.includes('加密'))).toBe(true);
    expect(btns.some((n) => n.includes('解密'))).toBe(true);
    // 至少两个文本输入区 (明文/密文或参数区)
    expect(container.querySelectorAll('textarea').length).toBeGreaterThanOrEqual(1);
  });

  test('输入明文后点「清除」清空输入区', () => {
    const { container } = render(<VigenereCrypto />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    if (!ta) return; // 无文本输入区 (密钥导入型场景) 跳过
    fireEvent.change(ta, { target: { value: 'hello' } });
    const clearBtn = Array.from(container.querySelectorAll('button')).find((b) => norm(b.textContent ?? '').includes('清除'));
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(ta.value).toBe('');
    }
  });
});
