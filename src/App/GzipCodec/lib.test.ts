import {
  base64ToBytes, bytesToBase64, bytesToHex, hexToBytes, isGzip,
  parseGzipBytes, getFormat, setFormat, formatGzipBytes,
  compressText, decompressToText, GZIP_FORMAT_KEY,
} from './lib';

describe('Gzip 编解码', () => {
  it('hex 转换: roundtrip 与大小写/空白容忍', () => {
    const bytes = new Uint8Array([ 0x1f, 0x8b, 0x08, 0x00, 0xff, 0x00, 0x7f, 0x80 ]);
    const hex = bytesToHex(bytes);
    expect(hex).toBe('1f8b0800ff007f80');
    expect(hexToBytes(hex)).toEqual(bytes);
    expect(hexToBytes('1F 8B 08 00 FF 00 7F 80')).toEqual(bytes); // 大写 + 空白
  });

  it('hex 转换: 非法输入抛错', () => {
    expect(() => hexToBytes('1f8')).toThrow('偶数');
    expect(() => hexToBytes('1g8b')).toThrow('非法字符');
  });

  it('base64 转换: roundtrip (含空与超大块)', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
    const big = new Uint8Array(200000);
    for (let i = 0; i < big.length; i++) big[i] = (i * 31) % 256;
    expect(base64ToBytes(bytesToBase64(big))).toEqual(big); // 分块编码无栈溢出
    const hello = bytesToBase64(new TextEncoder().encode('Hello, gzip!'));
    expect(hello).toBe(btoa('Hello, gzip!'));
  });

  it('base64 转换: 兼容 URL 安全字符与缺失补位', () => {
    const bytes = new Uint8Array([ 97, 62, 63 ]); // 'a>?' 二进制含 +/ = 情形
    const b64 = bytesToBase64(bytes);
    const safe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(base64ToBytes(safe)).toEqual(bytes); // URL-safe 无填充也能解
    expect(() => base64ToBytes('!!!not-base64!!!')).toThrow('解析失败');
  });

  it('isGzip: 识别 1F 8B 魔数', () => {
    expect(isGzip(new Uint8Array([ 0x1f, 0x8b, 1, 2, 3 ]))).toBe(true);
    expect(isGzip(new Uint8Array([ 0x1f, 0x8a, 1, 2 ]))).toBe(false);
    expect(isGzip(new Uint8Array([ 0x1f ]))).toBe(false);
    expect(isGzip(new Uint8Array(0))).toBe(false);
  });

  it('parseGzipBytes: 按主格式解析 + 交叉回退', () => {
    const gz = new Uint8Array([ 0x1f, 0x8b, 0x08, 0x00, 0xaa, 0xbb, 0xcc ]);
    const hex = bytesToHex(gz);
    const b64 = bytesToBase64(gz);
    expect(parseGzipBytes(hex, 'hex')).toEqual(gz);
    expect(parseGzipBytes(b64, 'base64')).toEqual(gz);
    // 展示格式设 base64 却贴了 hex, 或反之, 均自动回退识别
    expect(parseGzipBytes(hex, 'base64')).toEqual(gz);
    expect(parseGzipBytes(b64, 'hex')).toEqual(gz);
    expect(parseGzipBytes(hex.toUpperCase(), 'base64')).toEqual(gz);
  });

  it('parseGzipBytes: 非 gzip 数据报错提示 1F 8B', () => {
    expect(() => parseGzipBytes('48656c6c6f', 'hex')).toThrow('1F 8B');      // 'Hello' 无 gzip 头
    expect(() => parseGzipBytes('not gzip at all!!', 'base64')).toThrow();
    expect(() => parseGzipBytes('', 'base64')).toThrow();
  });

  it('默认展示格式: base64, 可切换并持久化', () => {
    localStorage.removeItem(GZIP_FORMAT_KEY);
    expect(getFormat()).toBe('base64');
    setFormat('hex');
    expect(getFormat()).toBe('hex');
    localStorage.setItem(GZIP_FORMAT_KEY, 'junk'); // 脏值回退
    expect(getFormat()).toBe('base64');
    localStorage.setItem(GZIP_FORMAT_KEY, 'base64');
  });

  it('formatGzipBytes: 按格式输出', () => {
    const gz = new Uint8Array([ 0x1f, 0x8b ]);
    expect(formatGzipBytes(gz, 'hex')).toBe('1f8b');
    expect(formatGzipBytes(gz, 'base64')).toBe('H4s=');
  });

  it('压缩解压: 文本往返 (CompressionStream; 环境不支持时报错)', async () => {
    if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') {
      await expect(compressText('x')).rejects.toThrow('CompressionStream');
      return;
    }
    const text = 'magic-tools gzip 编解码测试 '.repeat(100);
    const gz = await compressText(text);
    expect(isGzip(gz)).toBe(true);
    expect(gz.length).toBeLessThan(new TextEncoder().encode(text).length); // 重复文本有压缩收益
    expect(await decompressToText(gz)).toBe(text);
    // 中文与多行
    const zh = '你好，世界\n第二行🎉';
    expect(await decompressToText(await compressText(zh))).toBe(zh);
  });
});
