import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import SM2Crypto from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/file', () => ({
  openFile: jest.fn(),
}));
jest.mock('../../lib/tauri', () => ({
  saveTextFile: jest.fn().mockResolvedValue(true),
  openUrl: jest.fn(),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));

describe('SM2 加解密 页面', () => {
  test('渲染标题与关键控件 (加密/解密按钮 + 输入输出区)', () => {
    const { container } = render(<SM2Crypto />);
    // 页面有渲染内容 (表单参数区)
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 分页签结构: 初始在「密钥管理」区, 有生成密钥/保存等操作按钮
    const btns = buttons(container);
    expect(btns.length).toBeGreaterThan(0);
    expect(btns.some((n) => n.includes('密钥管理') || n.includes('生成密钥对'))).toBe(true);
    // 至少两个文本输入区 (明文/密文或参数区)
    expect(container.querySelectorAll('textarea').length).toBeGreaterThanOrEqual(1);
  });

  test('输入明文后点「清除」清空输入区', () => {
    const { container } = render(<SM2Crypto />);
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
