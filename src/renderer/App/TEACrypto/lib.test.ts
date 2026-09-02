import { teaEncrypt, teaDecrypt, teaEncryptText, teaDecryptText } from "./lib";
import { hexToBytes, bytesToHex, bytesToUtf8, utf8ToBytes } from "../../lib/codec";

// 以 HEX 形式传递密文做互逆校验 (与页面编码输出/输入的行为一致)
const expectRoundTrip = (text :string, key :string, cycles :number) => {
  const cipher = teaEncryptText(text, key, cycles);
  const plain = bytesToUtf8(teaDecrypt(hexToBytes(bytesToHex(cipher)), utf8ToBytes(key), cycles));
  expect(plain).toBe(text);
}

describe('TEA 加解密 (lib)', () => {

  it('32 轮分组向量与 Python 参考实现一致', () => {
    // 明文 8 字节 + PKCS7 补 8 字节 -> 两个分组
    const cipher = teaEncrypt(hexToBytes('0123456789abcdef'), hexToBytes('00112233445566778899aabbccddeeff'), 32);
    expect(bytesToHex(cipher)).toBe('126c6b92c0653a3e83234447e5d31fc1');
  });

  it('64 轮分组向量与 Python 参考实现一致', () => {
    const cipher = teaEncrypt(hexToBytes('0123456789abcdef'), hexToBytes('00112233445566778899aabbccddeeff'), 64);
    expect(bytesToHex(cipher)).toBe('5b9940ac74a2984847c0d87f1a37eac6');
  });

  it('全零密钥著名向量 (41ea3a0a94baa940)', () => {
    const key = new Uint8Array(16);
    const data = new Uint8Array(8);
    const cipher = teaEncrypt(data, key, 32);
    // 第二个分组是 PKCS7 补的 8 个 0x08 字节
    expect(bytesToHex(cipher)).toBe('41ea3a0a94baa9403d020d08524ef0c8');
  });

  it('加解密互逆 (字符串/多分组/中文)', () => {
    const samples = [
      'a',
      'Hello',
      'Hello, world!',
      '0123456789abcdef0123456789abcdef',
      '中文测试hello世界',
      '这是一个较长的中文测试字符串，用来验证多分组加解密是否正确。'
    ];
    for(const text of samples) {
      expectRoundTrip(text, '1234567890123456', 32);
    }
  });

  it('不同循环次数互逆', () => {
    expectRoundTrip('hello magic-tools', '0000111122223333', 1);
    expectRoundTrip('hello magic-tools', '0000111122223333', 999);
  });

  it('密文长度不是 8 的倍数时解密抛异常', () => {
    expect(() => teaDecrypt(hexToBytes('0011223344'), new Uint8Array(16), 32)).toThrow();
  });

  it('密钥不足 16 字节时按补零处理并保持互逆', () => {
    expectRoundTrip('short-key-test', '1234', 32);
  });

  it('密钥超过 16 字节时取前 16 字节并保持互逆', () => {
    expectRoundTrip('long-key-test-中文', '0123456789abcdef0123456789abcdef', 32);
  });

});
