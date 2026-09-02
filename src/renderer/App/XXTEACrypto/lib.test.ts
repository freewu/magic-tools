import { xxteaEncrypt, xxteaDecrypt, xxteaEncryptText, xxteaDecryptText } from "./lib";
import { hexToBytes, bytesToHex, bytesToUtf8, utf8ToBytes } from "../../lib/codec";

// 以 HEX 形式传递密文做互逆校验 (与页面编码输出/输入的行为一致)
const expectRoundTrip = (text :string, key :string) => {
  const cipher = xxteaEncryptText(text, key);
  const plain = bytesToUtf8(xxteaDecrypt(hexToBytes(bytesToHex(cipher)), utf8ToBytes(key)));
  expect(plain).toBe(text);
}

describe('XXTEA 加解密 (lib)', () => {

  it('与官方 xxtea-js 参考向量一致', () => {
    expect(bytesToHex(xxteaEncryptText('a', '1234567890123456'))).toBe('b304ba428f3bd32a');
    expect(bytesToHex(xxteaEncryptText('Hello', '1234567890123456'))).toBe('398f33aa046bc98af9f7da1c');
    expect(bytesToHex(xxteaEncryptText('Hello, world!', '1234567890123456'))).toBe('3ed2629e7ccd69945a434891d74506d93170d892');
    expect(bytesToHex(xxteaEncryptText('Hello, 世界! 你好世界', '1234567890123456'))).toBe('7ad44f30909dac2bd7e4a9bb6126c4305f5b96d6932393fb38afe4dce3852a52');
    expect(bytesToHex(xxteaEncryptText('1234', 'How are you doing?'))).toBe('75f7dc5f7badfbbc');
  });

  it('与官方 xxtea-js 参考向量一致 (超长密钥只取前 16 字节)', () => {
    // 参考实现的密钥为 19 个字符, 实际仅前 16 字节参与运算
    const longKey = 'key1234567890123456789';
    expect(bytesToHex(xxteaEncryptText('1234567890123456abcdefghijklmnop', longKey))).toBe('a4b4f3c8cf92143333fcf280595be3f1a5bb157337334741e6c09e5fea0898fec9257e58');
  });

  it('加解密互逆 (字符串/多分组/中文)', () => {
    const samples = [
      'a',
      'Hello',
      'Hello, world!',
      'Hello, 世界! 你好世界',
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      '这是一个较长的中文测试字符串，用来验证 XXTEA 不定长分组加解密是否正确。'
    ];
    for(const text of samples) {
      expectRoundTrip(text, '1234567890123456');
    }
  });

  it('1 ~ 40 字节明文逐一遍历互逆', () => {
    let text = '';
    for(let i = 1; i <= 40; i++) {
      text += String.fromCharCode(97 + ((i - 1) % 26));
      expectRoundTrip(text, 'abcdefghijklmnop');
    }
  });

  it('空密钥与非空明文时按补零密钥处理并保持互逆', () => {
    expectRoundTrip('hello-empty-key', '');
  });

  it('密文长度小于 8 字节时解密抛异常', () => {
    expect(() => xxteaDecrypt(hexToBytes('00112233'), utf8ToBytes('1234567890123456'))).toThrow();
  });

  it('篡改过的密文解密抛异常或得到非原文', () => {
    const cipher = bytesToHex(xxteaEncryptText('tamper-test-内容', '1234567890123456'));
    const tampered = cipher.substr(0, cipher.length - 1) + (cipher.charCodeAt(cipher.length - 1) === 48? '1' : '0');
    try {
      const out = bytesToUtf8(xxteaDecrypt(hexToBytes(tampered), utf8ToBytes('1234567890123456')));
      expect(out).not.toBe('tamper-test-内容');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

});
