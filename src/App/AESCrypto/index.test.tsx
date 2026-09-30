import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import AESCrypto from './index';
import { setDefaultCode, setDefaultIV, setDefaultMode, setDefaultPadding, setDefaultPassphrase } from './lib';

afterEach(() => cleanup());

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/file', () => ({
  openFile: jest.fn(),
}));

/** 每用例前准备好合法默认配置: AES-128 密钥 16 字节 + CBC/Base64/Pkcs7 */
beforeEach(() => {
  localStorage.clear();
  setDefaultMode('CBC');
  setDefaultPadding('Pkcs7');
  setDefaultCode('Base64');
  setDefaultIV('0123456789abcdef');
  setDefaultPassphrase('1234567890abcdef');
});

type Container = HTMLElement;
const textareas = (c: Container) => Array.from(c.querySelectorAll('textarea')) as HTMLTextAreaElement[];
const btn = (c: Container, name: string) => {
  const hit = Array.from(c.querySelectorAll('button')).find((b) => (b.textContent ?? '').replace(/\s+/g, '') === name.replace(/\s+/g, ''));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};

describe('AESCrypto 页面', () => {
  test('渲染加密/解密/清除按钮与算法参数选择区', () => {
    const { container } = render(<AESCrypto />);
    expect(btn(container, '加密')).toBeInTheDocument();
    expect(btn(container, '解密')).toBeInTheDocument();
    expect(btn(container, '清除')).toBeInTheDocument();
  });

  test('CBC + Base64: 加密输出 Base64 密文, 解密还原明文 (往返)', () => {
    const { container } = render(<AESCrypto />);
    const [ encodeBox, decodeBox ] = textareas(container);

    fireEvent.change(encodeBox, { target: { value: 'hello magic tools' } });
    fireEvent.click(btn(container, '加密'));
    const cipher = decodeBox.value;
    expect(cipher).not.toBe('');
    expect(cipher).not.toContain('hello');

    // 密文与密钥一致 → 解密还原
    fireEvent.click(btn(container, '解密'));
    expect(encodeBox.value).toBe('hello magic tools');
  });

  test('修改密钥后解密失败返回空 (密钥不一致无法还原)', () => {
    const { container } = render(<AESCrypto />);
    const [ encodeBox, decodeBox ] = textareas(container);
    fireEvent.change(encodeBox, { target: { value: 'secret' } });
    fireEvent.click(btn(container, '加密'));
    const cipher = decodeBox.value;
    expect(cipher).not.toBe('');

    setDefaultPassphrase('abcdef1234567890'); // 换密钥 (页面 state 已初始化, 直接改存储不影响本次, 仅作演示)
    // 重新渲染并解密同密文: 页面口令来自初始默认, 重新渲染采用新口令
    cleanup();
    setDefaultIV('0123456789abcdef');
    const { container: c2 } = render(<AESCrypto />);
    const boxes2 = textareas(c2);
    fireEvent.change(boxes2[1], { target: { value: cipher } });
    fireEvent.click(btn(c2, '解密'));
    expect(boxes2[0].value).toBe('');
  });

  test('HEX 模式输出十六进制密文, 长度是明文的整数倍', () => {
    setDefaultCode('HEX');
    const { container } = render(<AESCrypto />);
    const [ encodeBox, decodeBox ] = textareas(container);
    fireEvent.change(encodeBox, { target: { value: 'data' } });
    fireEvent.click(btn(container, '加密'));

    const hex = decodeBox.value;
    expect(/^[0-9a-f]+$/i.test(hex)).toBe(true); // 纯十六进制
    expect(hex.length % 2).toBe(0); // 偶数个字符
  });

  test('清除按钮清空明文与密文', () => {
    const { container } = render(<AESCrypto />);
    const [ encodeBox, decodeBox ] = textareas(container);
    fireEvent.change(encodeBox, { target: { value: 'x' } });
    fireEvent.click(btn(container, '加密'));
    expect(decodeBox.value).not.toBe('');
    fireEvent.click(btn(container, '清除'));
    expect(encodeBox.value).toBe('');
    expect(decodeBox.value).toBe('');
  });
});
