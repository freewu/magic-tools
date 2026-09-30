import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import Hash from './index';

afterEach(() => cleanup());

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

type Container = HTMLElement;
const inputBox = (c: Container) => c.querySelector('textarea') as HTMLTextAreaElement;
const resultValue = (c: Container, label: string): string => {
  // 结果区: Form.Item label 与其 Input 同名同列, 取该行 input 的值
  const labels = Array.from(c.querySelectorAll('.ant-form-item-label'));
  const hit = labels.find((el) => (el.textContent ?? '').replace(/\s+/g, '') === label.replace(/\s+/g, ''));
  if (!hit) throw new Error(`未找到结果项: ${label}`);
  const row = hit.closest('.ant-form-item');
  return (row?.querySelector('input') as HTMLInputElement)?.value ?? '';
};

// 已知向量 (RFC 1321 / FIPS 180 标准测试向量, 小写十六进制)
const MD5_ABC = '900150983cd24fb0d6963f7d28e17f72'; // md5('abc')
const MD5_16_ABC = '3cd24fb0d6963f7d'; // 实现取第 9-24 位 (index 8..24)
const SHA1_ABC = 'a9993e364706816aba3e25717850c26c9cd0d89d';
const SHA256_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('Hash 页面', () => {
  test('输入文本自动计算全部算法摘要 (MD5/SHA1/SHA256 已知向量)', () => {
    const { container } = render(<Hash />);
    fireEvent.change(inputBox(container), { target: { value: 'abc' } });

    expect(resultValue(container, 'MD5 (32位)')).toBe(MD5_ABC);
    expect(resultValue(container, 'MD5 (16位)')).toBe(MD5_16_ABC);
    expect(resultValue(container, 'SHA1')).toBe(SHA1_ABC);
    expect(resultValue(container, 'SHA256')).toBe(SHA256_ABC);
  });

  test('勾选「结果大写字符展示」后摘要转大写, 取消还原小写', () => {
    const { container } = render(<Hash />);
    fireEvent.change(inputBox(container), { target: { value: 'abc' } });
    expect(resultValue(container, 'MD5 (32位)')).toBe(MD5_ABC);

    fireEvent.click(container.querySelector('label.ant-checkbox-wrapper') as HTMLElement);
    expect(resultValue(container, 'MD5 (32位)')).toBe(MD5_ABC.toUpperCase());
    expect(resultValue(container, 'SHA256')).toBe(SHA256_ABC.toUpperCase());

    fireEvent.click(container.querySelector('label.ant-checkbox-wrapper') as HTMLElement);
    expect(resultValue(container, 'MD5 (32位)')).toBe(MD5_ABC);
  });

  test('清空输入后结果归零; 清除按钮清空', () => {
    const { container } = render(<Hash />);
    fireEvent.change(inputBox(container), { target: { value: 'abc' } });
    expect(resultValue(container, 'MD5 (32位)')).toBe(MD5_ABC);

    fireEvent.change(inputBox(container), { target: { value: '' } });
    expect(resultValue(container, 'MD5 (32位)')).toBe('');
    expect(resultValue(container, 'SHA256')).toBe('');

    // 再输入并点「清除」
    fireEvent.change(inputBox(container), { target: { value: 'abc' } });
    const clearBtn = Array.from(container.querySelectorAll('button')).find((b) => (b.textContent ?? '').replace(/\s+/g, '') === '清除');
    fireEvent.click(clearBtn as HTMLButtonElement);
    expect(resultValue(container, 'MD5 (32位)')).toBe('');
  });

  test('常用密码列表 Tag 可点击触发计算', () => {
    const { container } = render(<Hash />);
    const tag = Array.from(container.querySelectorAll('.ant-tag')).find((t) => (t.textContent ?? '') === 'admin');
    expect(tag).toBeDefined();
    fireEvent.click(tag as HTMLElement);
    const md5Admin = resultValue(container, 'MD5 (32位)');
    expect(md5Admin).not.toBe('');
    expect(md5Admin).toHaveLength(32);
  });
});
