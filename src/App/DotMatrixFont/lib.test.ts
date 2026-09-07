import {
  rowsToBytes, formatCArray, matrixToText, hexByte, SPECS, specLabel,
} from './lib';

describe('规格表', () => {
  it('内置 6 种规格且互异', () => {
    expect(SPECS).toHaveLength(6);
    expect(SPECS.map(specLabel)).toEqual(['5x7', '5x8', '6x12', '8x16', '12x12', '16x16']);
  });
});

describe('取模编码 rowsToBytes', () => {
  // 5x7 人造矩阵: 只有第 2 行 (行号1) 前 5 格为 10110
  const w = 5, h = 7;
  const mat = new Uint8Array(w * h);
  [1, 0, 1, 1, 0].forEach((v, c) => { mat[1 * w + c] = v; });

  it('逐行式 + MSB: 每行 1 字节, 位 7..3 对应列 0..4', () => {
    const bytes = rowsToBytes(mat, w, h, 'row', 'msb');
    expect(bytes).toHaveLength(h);
    expect(bytes[0]).toBe(0x00);
    expect(bytes[1]).toBe(0xb0); // 10110 << 3
    expect(bytes[2]).toBe(0x00);
  });

  it('逐行式 + LSB: 列 0..4 -> 位 0..4', () => {
    const bytes = rowsToBytes(mat, w, h, 'row', 'lsb');
    expect(bytes[1]).toBe(0x0d); // 0b01101
  });

  it('逐列式: 每列 1 字节 (7 行), MSB 行0 -> 位 7', () => {
    const bytes = rowsToBytes(mat, w, h, 'col', 'msb');
    expect(bytes).toHaveLength(w);
    // 列0: 只有行1有墨 -> bit6 = 0x40
    expect(bytes[0]).toBe(0x40);
    // 列2: 只有行1 -> bit6 = 0x40
    expect(bytes[2]).toBe(0x40);
    expect(bytes[4]).toBe(0);
  });

  it('逐列式 + LSB: 行0 -> 位 0', () => {
    const bytes = rowsToBytes(mat, w, h, 'col', 'lsb');
    expect(bytes[0]).toBe(0x02); // 行1 -> bit1
  });

  it('16x16 矩阵: 逐行式每行 2 字节 (MSB 前 8 列进字节1)', () => {
    const w16 = 16, h16 = 16;
    const m = new Uint8Array(w16 * h16);
    // 行0: 第 0 与第 15 列墨 -> 字节1 = 0x80, 字节2 = 0x01
    m[0] = 1; m[15] = 1;
    const bytes = rowsToBytes(m, w16, h16, 'row', 'msb');
    expect(bytes).toHaveLength(16 * 2);
    expect(bytes[0]).toBe(0x80);
    expect(bytes[1]).toBe(0x01);
  });

  it('16x16 逐列式: 每列 2 字节, 上半 8 行 -> 字节1', () => {
    const w16 = 16, h16 = 16;
    const m = new Uint8Array(w16 * h16);
    // 列3: 行0 与 行15 墨
    m[0 * w16 + 3] = 1;
    m[15 * w16 + 3] = 1;
    const bytes = rowsToBytes(m, w16, h16, 'col', 'msb');
    // 每列 2 字节: 第 4 列 (index 3) -> bytes[3*2]=字节1(行0..7), 行0->bit7
    expect(bytes).toHaveLength(16 * 2);
    expect(bytes[3 * 2]).toBe(0x80);
    expect(bytes[3 * 2 + 1]).toBe(0x01); // 行15 -> 下半字节 bit7
  });
});

describe('hexByte / matrixToText', () => {
  it('hexByte 大写补零', () => {
    expect(hexByte(0)).toBe('0x00');
    expect(hexByte(0xb)).toBe('0x0B');
    expect(hexByte(255)).toBe('0xFF');
  });

  it('matrixToText 按行输出 0/1', () => {
    const m = new Uint8Array(10);
    m[0] = 1; m[4] = 1; m[9] = 1; // 2x5
    expect(matrixToText(m, 5, 2)).toBe('10001\n00001');
  });
});

describe('formatCArray', () => {
  it('生成带注释的 C 数组文本', () => {
    const out = formatCArray({
      chars: ['A', '中'],
      chunks: [[0x3e, 0x51], [0xff]],
      spec: SPECS[0],
      mode: 'row',
      order: 'msb',
    });
    expect(out).toContain('const unsigned char font_5x7[] = {');
    expect(out).toContain("// 'A'");
    expect(out).toContain("// '中'");
    expect(out).toContain('0x3E, 0x51,');
    expect(out).toContain('// 规格 5x7 点; 方式: 逐行式 (每行取模); 位序: 高位在前 (MSB)');
    expect(out.trimEnd().endsWith('};')).toBe(true);
  });
});
