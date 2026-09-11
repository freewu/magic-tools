import { dataUrlToBytes, getDefaultSize, pngToIco, setDefaultSize } from './lib';

// 一段有效 PNG 的最小字节 (magic + 若干 payload)
const pngBytes = (extra = 10): Uint8Array => {
  const b = new Uint8Array(8 + extra);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  for (let i = 8; i < b.length; i++) b[i] = i;
  return b;
};

describe('ICO 生成', () => {
  it('默认尺寸为 32', () => {
    localStorage.clear();
    expect(getDefaultSize()).toBe(32);
  });

  it('默认尺寸设置持久化', () => {
    localStorage.clear();
    setDefaultSize(48);
    expect(getDefaultSize()).toBe(48);
    setDefaultSize(64);
    expect(getDefaultSize()).toBe(64);
    localStorage.clear();
    expect(getDefaultSize()).toBe(32);
  });

  it('非法持久化值回退默认 32', () => {
    localStorage.clear();
    localStorage.setItem('ico:default-size', '999');
    expect(getDefaultSize()).toBe(32);
    localStorage.clear();
  });

  it('pngToIco: ICONDIR 头与条目字段 (16x16)', () => {
    const png = pngBytes();
    const ico = pngToIco(png, 16);
    expect(ico.length).toBe(22 + png.length);
    const v = new DataView(ico.buffer);
    // ICONDIR: reserved=0 type=1 count=1
    expect(v.getUint16(0, true)).toBe(0);
    expect(v.getUint16(2, true)).toBe(1);
    expect(v.getUint16(4, true)).toBe(1);
    // entry: width=16 height=16
    expect(ico[6]).toBe(16);
    expect(ico[7]).toBe(16);
    expect(ico[8]).toBe(0); // colorCount
    expect(ico[9]).toBe(0); // reserved
    expect(v.getUint16(10, true)).toBe(1); // planes
    expect(v.getUint16(12, true)).toBe(32); // bitCount
    expect(v.getUint32(14, true)).toBe(png.length); // bytesInRes
    expect(v.getUint32(18, true)).toBe(22); // imageOffset
  });

  it('pngToIco: 64x64 尺寸字面量写入且内容原样保留', () => {
    const png = pngBytes(30);
    const ico = pngToIco(png, 64);
    expect(ico[6]).toBe(64);
    expect(ico[7]).toBe(64);
    // PNG 数据完整附加在 offset 22
    for (let i = 0; i < png.length; i++) expect(ico[22 + i]).toBe(png[i]);
    // PNG magic 出现在 ico 数据区开头
    expect(ico[22]).toBe(0x89);
    expect(ico[23]).toBe(0x50);
    expect(ico[24]).toBe(0x4e);
  });

  it('pngToIco: 6 种尺寸均可生成', () => {
    const png = pngBytes();
    for (const sz of [16, 24, 32, 48, 64, 128]) {
      const ico = pngToIco(png, sz);
      expect(ico[6]).toBe(sz);
      expect(ico.length).toBe(22 + png.length);
    }
  });

  it('pngToIco: 非法尺寸 / 非 PNG 数据抛错', () => {
    const png = pngBytes();
    expect(() => pngToIco(png, 256)).toThrow(/尺寸/);
    expect(() => pngToIco(png, 0)).toThrow(/尺寸/);
    const fake = new Uint8Array(20); // 全 0, 无 PNG magic
    expect(() => pngToIco(fake, 32)).toThrow(/PNG/);
  });

  it('dataUrlToBytes: base64 dataURL 还原字节', () => {
    const bytes = dataUrlToBytes('data:image/png;base64,iVBORw0KGgo=');
    // iVBORw0KGgo= 解码为 PNG magic 前 8 字节
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it('dataUrlToBytes -> pngToIco 链路可用', () => {
    const png = dataUrlToBytes('data:image/png;base64,iVBORw0KGgo=');
    const ico = pngToIco(png, 32);
    expect(ico[6]).toBe(32);
  });
});
