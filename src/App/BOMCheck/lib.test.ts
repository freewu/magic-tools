import {
  BOM_KEYS, BOM_LIST, MAX_FILE_SIZE, addBom, bomBytes, bomSize, decodeBytes, detectBom, detectBoms,
  formatBytes, getDefaultBom, guessEncoding, hexPreview, isValidUtf8, previewText, setDefaultBom,
  stripBom, stripBomAs,
} from './lib';

const u8 = (...bytes: number[]) => new Uint8Array(bytes);
const utf8 = (s: string) => new TextEncoder().encode(s);
/** 拼接字节数组 (用 Array.from 兼容跨 realm 的 TypedArray) */
const cat = (...parts: (number[] | Uint8Array)[]) =>
  new Uint8Array(([] as number[]).concat(...parts.map((p) => Array.from(p))));

const UTF8_BOM = [ 0xEF, 0xBB, 0xBF ];
const UTF16LE_BOM = [ 0xFF, 0xFE ];
const UTF16BE_BOM = [ 0xFE, 0xFF ];
const UTF32LE_BOM = [ 0xFF, 0xFE, 0x00, 0x00 ];
const UTF32BE_BOM = [ 0x00, 0x00, 0xFE, 0xFF ];

describe('BOM 识别', () => {
  test('识别五种 BOM', () => {
    expect(detectBom(cat(UTF8_BOM, utf8('hi')))).toBe('utf8');
    expect(detectBom(cat(UTF16LE_BOM, [ 0x41, 0x00 ]))).toBe('utf16le');
    expect(detectBom(cat(UTF16BE_BOM, [ 0x00, 0x41 ]))).toBe('utf16be');
    expect(detectBom(cat(UTF32LE_BOM, [ 0x41, 0x00, 0x00, 0x00 ]))).toBe('utf32le');
    expect(detectBom(cat(UTF32BE_BOM, [ 0x00, 0x00, 0x00, 0x41 ]))).toBe('utf32be');
  });

  test('无 BOM 返回 null, 过短内容不误判', () => {
    expect(detectBom(utf8('hello'))).toBeNull();
    expect(detectBom(u8(0xEF, 0xBB))).toBeNull();
    expect(detectBom(u8(0xEF, 0xBB, 0xBE))).toBeNull();
    expect(detectBom(new Uint8Array())).toBeNull();
  });

  test('FF FE 00 00 同时命中 UTF-32 LE 与 UTF-16 LE, 默认取更长的 UTF-32 LE', () => {
    const bytes = cat(UTF32LE_BOM, [ 0x41, 0x00, 0x00, 0x00 ]);
    expect(detectBoms(bytes)).toEqual([ 'utf32le', 'utf16le' ]);
    expect(detectBom(bytes)).toBe('utf32le');
  });

  test('BOM 表 / 取值辅助函数', () => {
    expect(BOM_KEYS).toEqual([ 'utf8', 'utf16le', 'utf16be', 'utf32le', 'utf32be' ]);
    expect(BOM_LIST.map((i) => i.key)).toContain('utf32be');
    expect(bomBytes('utf8')).toEqual(UTF8_BOM);
    expect(bomSize('utf32be')).toBe(4);
    expect(bomSize(null)).toBe(0);
    expect(MAX_FILE_SIZE).toBeGreaterThan(0);
  });
});

describe('去除 / 添加 BOM', () => {
  test('stripBom 去除开头 BOM 并保留其余字节', () => {
    expect(Array.from(stripBom(cat(UTF8_BOM, utf8('abc'))))).toEqual(Array.from(utf8('abc')));
    expect(Array.from(stripBom(cat(UTF32LE_BOM, [ 0x41, 0x00, 0x00, 0x00 ])))).toEqual([ 0x41, 0x00, 0x00, 0x00 ]);
  });

  test('stripBom 无 BOM 时返回内容拷贝, 不修改原数组', () => {
    const src = utf8('abc');
    const out = stripBom(src);
    expect(Array.from(out)).toEqual(Array.from(src));
    expect(out).not.toBe(src);
    // 只在开头匹配, 中间出现 EF BB BF 不受影响
    const mid = cat(utf8('a'), UTF8_BOM);
    expect(Array.from(stripBom(mid))).toEqual(Array.from(mid));
  });

  test('stripBomAs 按指定类型剥离, 类型不匹配时原样返回', () => {
    const bytes = cat(UTF32LE_BOM, [ 0x41, 0x00, 0x00, 0x00 ]);
    // 指定 UTF-16 LE 时只去掉 2 字节 (FF FE), 其余 6 字节原样保留
    expect(Array.from(stripBomAs(bytes, 'utf16le'))).toEqual([ 0x00, 0x00, 0x41, 0x00, 0x00, 0x00 ]);
    expect(Array.from(stripBomAs(bytes, 'utf32le'))).toEqual([ 0x41, 0x00, 0x00, 0x00 ]);
    // 文件里没有 UTF-8 BOM 时不做任何删减
    expect(Array.from(stripBomAs(bytes, 'utf8'))).toEqual(Array.from(bytes));
  });

  test('addBom 给无 BOM 文件添加 BOM', () => {
    const body = utf8('abc');
    expect(Array.from(addBom(body, 'utf8'))).toEqual([ ...UTF8_BOM, ...Array.from(body) ]);
    expect(Array.from(addBom(body, 'utf16le'))).toEqual([ ...UTF16LE_BOM, ...Array.from(body) ]);
  });

  test('addBom 替换已有 BOM (不会出现双重 BOM)', () => {
    const bytes = cat(UTF8_BOM, utf8('abc'));
    const out = addBom(bytes, 'utf16be');
    expect(Array.from(out)).toEqual([ ...UTF16BE_BOM, ...Array.from(utf8('abc')) ]);
    expect(detectBom(out)).toBe('utf16be');
    expect(detectBoms(out)).toEqual([ 'utf16be' ]);
  });

  test('addBom 先按目标类型剥离 (UTF-16 LE / UTF-32 LE 歧义)', () => {
    const bytes = cat(UTF32LE_BOM, [ 0x41, 0x00, 0x00, 0x00 ]);
    // 目标类型 UTF-16 LE: 只剥离 2 字节 BOM 后再加上 2 字节
    expect(Array.from(addBom(bytes, 'utf16le'))).toEqual([ ...UTF16LE_BOM, 0x00, 0x00, 0x41, 0x00, 0x00, 0x00 ]);
  });

  test('去除后再添加可还原 BOM', () => {
    const bytes = cat(UTF8_BOM, utf8('中文'));
    expect(Array.from(addBom(stripBom(bytes), 'utf8'))).toEqual(Array.from(bytes));
  });
});

describe('UTF-8 校验与编码推测', () => {
  test('isValidUtf8: 合法序列', () => {
    expect(isValidUtf8(new Uint8Array())).toBe(true);
    expect(isValidUtf8(utf8('hello 中文 emoji 😀'))).toBe(true);
    expect(isValidUtf8(utf8('é'))).toBe(true);
  });

  test('isValidUtf8: 非法序列', () => {
    expect(isValidUtf8(u8(0x80))).toBe(false);              // 孤立续字节
    expect(isValidUtf8(u8(0xC0, 0xAF))).toBe(false);        // 过长编码
    expect(isValidUtf8(u8(0xE0, 0x80, 0xAF))).toBe(false);  // 过长编码
    expect(isValidUtf8(u8(0xED, 0xA0, 0x80))).toBe(false);  // 代理区 U+D800
    expect(isValidUtf8(u8(0xF5, 0x80, 0x80, 0x80))).toBe(false); // 超出 U+10FFFF
    expect(isValidUtf8(u8(0xE4, 0xB8))).toBe(false);        // 截断
  });

  test('guessEncoding: UTF-16 LE / BE (无 BOM 的 0 字节分布)', () => {
    expect(guessEncoding(cat([ 0x41, 0x00, 0x42, 0x00, 0x43, 0x00 ]))).toBe('utf16le');
    expect(guessEncoding(cat([ 0x00, 0x41, 0x00, 0x42, 0x00, 0x43 ]))).toBe('utf16be');
  });

  test('guessEncoding: UTF-8 / GBK / 二进制', () => {
    expect(guessEncoding(utf8('hello'))).toBe('utf8');
    expect(guessEncoding(utf8('中文内容'))).toBe('utf8');
    // GBK '中文' = D6 D0 CE C4 (不是合法 UTF-8, 且无 0 字节)
    expect(guessEncoding(u8(0xD6, 0xD0, 0xCE, 0xC4))).toBe('gbk');
    // 含 0 字节且不满足 UTF-16 特征 -> 二进制
    expect(guessEncoding(u8(0x89, 0x50, 0x4E, 0x47, 0x00, 0x01, 0x02, 0x03))).toBe('binary');
    expect(guessEncoding(new Uint8Array())).toBe('utf8');
  });
});

describe('文本解码与展示辅助', () => {
  test('decodeBytes 按编码解码 (自动去掉 BOM)', () => {
    expect(decodeBytes(cat(UTF8_BOM, utf8('abc')), 'utf8')).toBe('abc');
    expect(decodeBytes(cat(UTF16LE_BOM, [ 0x41, 0x00, 0x42, 0x00 ]), 'utf16le')).toBe('AB');
    expect(decodeBytes(cat(UTF16BE_BOM, [ 0x00, 0x41, 0x00, 0x42 ]), 'utf16be')).toBe('AB');
    // UTF-32 由工具自行解码 (TextDecoder 不支持)
    expect(decodeBytes(cat(UTF32LE_BOM, [ 0x41, 0x00, 0x00, 0x00 ]), 'utf32le')).toBe('A');
    expect(decodeBytes(cat(UTF32BE_BOM, [ 0x00, 0x00, 0x00, 0x41 ]), 'utf32be')).toBe('A');
    expect(decodeBytes(u8(0xD6, 0xD0, 0xCE, 0xC4), 'gbk')).toBe('中文');
  });

  test('decodeBytes: 非法 UTF-32 码点降级为替换字符', () => {
    // 超出 U+10FFFF (0x00110000)
    expect(decodeBytes(u8(0x00, 0x11, 0x00, 0x00), 'utf32be')).toBe('\uFFFD');
    // 代理区 U+D800
    expect(decodeBytes(u8(0x00, 0x00, 0xD8, 0x00), 'utf32be')).toBe('\uFFFD');
  });

  test('previewText 截断超长文本', () => {
    const bytes = utf8('a'.repeat(50));
    expect(previewText(bytes, 'utf8', 10)).toBe('a'.repeat(10));
    expect(previewText(bytes, 'utf8')).toBe('a'.repeat(50));
  });

  test('hexPreview 输出大写 HEX', () => {
    expect(hexPreview(cat(UTF8_BOM, utf8('A')))).toBe('EF BB BF 41');
    expect(hexPreview(utf8('abcdefghij'), 4)).toBe('61 62 63 64');
  });

  test('formatBytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
  });

  test('默认 BOM 类型: 读 / 写 localStorage, 非法值回退 UTF-8', () => {
    localStorage.clear();
    expect(getDefaultBom()).toBe('utf8');
    setDefaultBom('utf16be');
    expect(getDefaultBom()).toBe('utf16be');
    localStorage.setItem('bom-check:default-bom', 'not-a-bom');
    expect(getDefaultBom()).toBe('utf8');
  });
});
