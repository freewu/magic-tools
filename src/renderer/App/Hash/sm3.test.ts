import { sm3, sm3Bytes } from "./sm3";

// 参考向量来自 GB/T 32905-2016 标准示例 与 OpenSSL 3.0 (openssl dgst -sm3)
describe("SM3 摘要计算", () => {

  it("空字符串", () => {
    expect(sm3('')).toBe('1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b');
  });

  it("标准向量 abc", () => {
    expect(sm3('abc')).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
  });

  it("标准向量 abcd 重复 16 次 (恰好 64 字节一块)", () => {
    expect(sm3('abcd'.repeat(16))).toBe('debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
  });

  it("跨分块边界 (65 字节)", () => {
    expect(sm3('b'.repeat(65))).toBe('ce28fa7f099169b0ba9ef57177992ca36469cb2fa2ff77608dcb4ccb446dee30');
  });

  it("标准向量 100 万个 a (多分块长消息)", () => {
    expect(sm3('a'.repeat(1000000))).toBe('c8aaf89429554029e231941a2acc0ad61ff2a5acd8fadd25847a3a732b3b02c3');
  });

  it("UTF-8 中文内容", () => {
    expect(sm3('中文测试abc123')).toBe('e7e1806595083bec01f9966a7842aa84a1a659470050246f900bf8d73dfff0fd');
  });

  it("任意字节输入 (0..126)", () => {
    const bytes = new Uint8Array(Array.from({ length: 127 }, (_, i) => i));
    expect(sm3Bytes(bytes)).toBe('bca3436d828517a6a6893a9e309e06e7b7b29c6e3f78b4814b23efe149962980');
  });

  it("输出恒为 64 位十六进制字符", () => {
    const out = sm3('任意内容');
    expect(out).toMatch(/^[0-9a-f]{64}$/);
  });
});
