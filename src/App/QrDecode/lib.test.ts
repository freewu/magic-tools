import jsQR from 'jsqr';
import {
  chunkRows, cornersOf, decodePixels, decodeSizeOf, DEFAULT_SETTINGS, getSettings, hexOf,
  historyTitle, isOpenableUrl, normalizeHistoryMax, normalizeInversion, normalizeMaxEdge,
  normalizeSettings, parsePayload, patchSettings, polygonPoints, pushHistory, resultFileName,
  setSettings, splitUnescaped, textBytes,
} from './lib';
import {
  DEFAULTS_STORAGE_KEY, HISTORY_MAX_DEFAULT, INVERSION_DEFAULT, MAX_EDGE_DEFAULT,
} from './data';

jest.mock('jsqr', () => ({ __esModule: true, default: jest.fn() }));

const mockJsQR = jsQR as unknown as jest.Mock;

/** 造一个 jsQR 返回结构 */
const qrCode = (over: Record<string, unknown> = {}) => ({
  data: 'https://example.com',
  binaryData: [ 104, 105 ],
  chunks: [ { type: 'byte', bytes: [ 104, 105 ], text: 'hi' } ],
  version: 3,
  location: {
    topLeftCorner: { x: 1, y: 2 },
    topRightCorner: { x: 21, y: 2 },
    bottomRightCorner: { x: 21, y: 22 },
    bottomLeftCorner: { x: 1, y: 22 },
  },
  ...over,
});

const pixels = (w: number, h: number) => new Uint8ClampedArray(w * h * 4);

beforeEach(() => {
  mockJsQR.mockReset();
  localStorage.clear();
});

describe('normalizeInversion', () => {
  test('合法值原样返回', () => {
    expect(normalizeInversion('dontInvert')).toBe('dontInvert');
    expect(normalizeInversion('onlyInvert')).toBe('onlyInvert');
    expect(normalizeInversion('invertFirst')).toBe('invertFirst');
    expect(normalizeInversion('attemptBoth')).toBe('attemptBoth');
  });

  test('非法值回退默认 (自动尝试反色)', () => {
    expect(normalizeInversion(undefined)).toBe(INVERSION_DEFAULT);
    expect(normalizeInversion(null)).toBe(INVERSION_DEFAULT);
    expect(normalizeInversion('invert')).toBe(INVERSION_DEFAULT);
    expect(normalizeInversion(3)).toBe(INVERSION_DEFAULT);
  });
});

describe('normalizeMaxEdge', () => {
  test('取候选列表里最接近的值', () => {
    expect(normalizeMaxEdge(0)).toBe(0);
    expect(normalizeMaxEdge(780)).toBe(800);
    expect(normalizeMaxEdge(1600)).toBe(1600);
    expect(normalizeMaxEdge(2000)).toBe(1600);
    expect(normalizeMaxEdge('2400')).toBe(2400);
  });

  test('非法值回退默认', () => {
    expect(normalizeMaxEdge(undefined)).toBe(MAX_EDGE_DEFAULT);
    expect(normalizeMaxEdge(-10)).toBe(MAX_EDGE_DEFAULT);
    expect(normalizeMaxEdge('abc')).toBe(MAX_EDGE_DEFAULT);
    expect(normalizeMaxEdge(Number.NaN)).toBe(MAX_EDGE_DEFAULT);
  });
});

describe('normalizeHistoryMax', () => {
  test('取候选列表里最接近的值, 非法值回退默认', () => {
    expect(normalizeHistoryMax(5)).toBe(5);
    expect(normalizeHistoryMax(30)).toBe(20);
    expect(normalizeHistoryMax('50')).toBe(50);
    expect(normalizeHistoryMax(0)).toBe(HISTORY_MAX_DEFAULT);
    expect(normalizeHistoryMax(undefined)).toBe(HISTORY_MAX_DEFAULT);
    expect(normalizeHistoryMax('x')).toBe(HISTORY_MAX_DEFAULT);
  });
});

describe('decodeSizeOf', () => {
  test('未超过上限时原样返回', () => {
    expect(decodeSizeOf({ width: 800, height: 600 }, 1600)).toEqual({ width: 800, height: 600 });
  });

  test('超过上限时等比缩小, 长边贴合上限', () => {
    expect(decodeSizeOf({ width: 4000, height: 3000 }, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(decodeSizeOf({ width: 3000, height: 4000 }, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  test('0 表示不缩放', () => {
    expect(decodeSizeOf({ width: 5000, height: 100 }, 0)).toEqual({ width: 5000, height: 100 });
  });

  test('非法尺寸至少为 1px, 非法上限回退默认', () => {
    expect(decodeSizeOf({ width: 0, height: -3 }, 1200)).toEqual({ width: 1, height: 1 });
    expect(decodeSizeOf({ width: Number.NaN, height: 10 }, 1200)).toEqual({ width: 1, height: 10 });
    expect(decodeSizeOf({ width: 4000, height: 2000 }, 'oops')).toEqual({ width: 1600, height: 800 });
  });
});

describe('decodePixels', () => {
  test('把 jsQR 的结果整理成解析结果', () => {
    mockJsQR.mockReturnValue(qrCode());
    const out = decodePixels(pixels(4, 4), { width: 4, height: 4 });
    expect(out).not.toBeNull();
    expect(out?.text).toBe('https://example.com');
    expect(out?.bytes).toEqual([ 104, 105 ]);
    expect(out?.version).toBe(3);
    expect(out?.chunks).toHaveLength(1);
    expect(out?.corners?.bottomRight).toEqual({ x: 21, y: 22 });
  });

  test('按参数传入反色策略 (非法值归一化)', () => {
    mockJsQR.mockReturnValue(qrCode());
    decodePixels(pixels(4, 4), { width: 4, height: 4 }, 'onlyInvert');
    expect(mockJsQR).toHaveBeenLastCalledWith(expect.any(Uint8ClampedArray), 4, 4, { inversionAttempts: 'onlyInvert' });
    decodePixels(pixels(4, 4), { width: 4, height: 4 }, 'bad' as never);
    expect(mockJsQR).toHaveBeenLastCalledWith(expect.any(Uint8ClampedArray), 4, 4, { inversionAttempts: INVERSION_DEFAULT });
  });

  test('没有二维码时返回 null', () => {
    mockJsQR.mockReturnValue(null);
    expect(decodePixels(pixels(4, 4), { width: 4, height: 4 })).toBeNull();
  });

  test('尺寸非法 / 像素数不足 / jsQR 抛错时返回 null', () => {
    mockJsQR.mockReturnValue(qrCode());
    expect(decodePixels(pixels(4, 4), { width: 0, height: 4 })).toBeNull();
    expect(decodePixels(pixels(4, 4), { width: Number.NaN, height: Number.NaN })).toBeNull();
    expect(decodePixels(pixels(2, 2), { width: 4, height: 4 })).toBeNull();
    mockJsQR.mockImplementation(() => { throw new Error('boom'); });
    expect(decodePixels(pixels(4, 4), { width: 4, height: 4 })).toBeNull();
  });

  test('jsQR 结果字段缺失时给出安全默认值', () => {
    mockJsQR.mockReturnValue({ data: undefined, binaryData: undefined, chunks: undefined, version: undefined, location: undefined });
    const out = decodePixels(pixels(4, 4), { width: 4, height: 4 });
    expect(out).toEqual({ text: '', bytes: [], version: 0, chunks: [], corners: null });
  });
});

describe('chunkRows', () => {
  test('文本段给出字符数, 字节段给出 HEX 与字节数', () => {
    expect(chunkRows([
      { type: 'numeric', text: '12345' },
      { type: 'alphanumeric', text: 'AB-1' },
      { type: 'byte', bytes: [ 65, 66 ], text: 'AB' },
      { type: 'kanji', bytes: [ 0x93, 0xfa ], text: '日本' },
    ])).toEqual([
      { kind: 'numeric', text: '12345', length: 5 },
      { kind: 'alphanumeric', text: 'AB-1', length: 4 },
      { kind: 'byte', text: '41 42', length: 2 },
      { kind: 'kanji', text: '93 FA', length: 2 },
    ]);
  });

  test('ECI 段显示赋值号, 未知类型归入 other, 非数组返回空', () => {
    expect(chunkRows([ { type: 'eci', assignmentNumber: 26 } ])).toEqual([ { kind: 'eci', text: '#26', length: 0 } ]);
    expect(chunkRows([ { type: 'mystery', text: 'x' } ])).toEqual([ { kind: 'unknown', text: 'x', length: 1 } ]);
    expect(chunkRows(undefined)).toEqual([]);
    expect(chunkRows({} as never)).toEqual([]);
  });

  test('多字节字符按字符数计算长度', () => {
    expect(chunkRows([ { type: 'byte', bytes: [ 0xe4, 0xb8, 0xad ], text: '中' } ])[0].length).toBe(3);
    expect(chunkRows([ { type: 'numeric', text: '123' } ])[0].length).toBe(3);
  });
});

describe('cornersOf', () => {
  test('四角齐全时返回坐标', () => {
    const out = cornersOf(qrCode().location);
    expect(out?.topLeft).toEqual({ x: 1, y: 2 });
    expect(out?.bottomLeft).toEqual({ x: 1, y: 22 });
  });

  test('缺角 / 坐标非数值 / 空值时返回 null', () => {
    const { topLeftCorner } = qrCode().location;
    expect(cornersOf({ topLeftCorner })).toBeNull();
    expect(cornersOf({ ...qrCode().location, bottomRightCorner: { x: Number.NaN, y: 1 } })).toBeNull();
    expect(cornersOf(undefined)).toBeNull();
  });
});

describe('parsePayload', () => {
  test('网址', () => {
    const out = parsePayload('  https://example.com/a?b=1  ');
    expect(out.kind).toBe('url');
    expect(out.fields).toEqual([ { key: 'url', value: 'https://example.com/a?b=1' } ]);
  });

  test('ftp 也算网址, 其它协议不算', () => {
    expect(parsePayload('ftp://example.com/x').kind).toBe('url');
    expect(parsePayload('httpx://example.com').kind).toBe('text');
  });

  test('WiFi 配网: 拆分字段并还原转义字符', () => {
    const out = parsePayload('WIFI:T:WPA;S:My\\;Net;P:p\\:wd;H:true;;');
    expect(out.kind).toBe('wifi');
    expect(out.fields).toEqual([
      { key: 'T', value: 'WPA' },
      { key: 'S', value: 'My;Net' },
      { key: 'P', value: 'p:wd' },
      { key: 'H', value: 'true' },
    ]);
  });

  test('vCard: 摘出字段, 去掉 itemN. 前缀与分组后缀', () => {
    const out = parsePayload([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:张三',
      'item1.TEL:+86 138 0000 0000',
      'EMAIL;TYPE=WORK:a@b.com',
      'ORG:ACME;研发部',
      'END:VCARD',
    ].join('\n'));
    expect(out.kind).toBe('vcard');
    expect(out.fields).toEqual([
      { key: 'VERSION', value: '3.0' },
      { key: 'FN', value: '张三' },
      { key: 'TEL', value: '+86 138 0000 0000' },
      { key: 'EMAIL', value: 'a@b.com' },
      { key: 'ORG', value: 'ACME' },
    ]);
  });

  test('MECARD', () => {
    const out = parsePayload('MECARD:N:李四;TEL:13900000000;EMAIL:l@b.com;;');
    expect(out.kind).toBe('mecard');
    expect(out.fields[0]).toEqual({ key: 'N', value: '李四' });
    expect(out.fields).toHaveLength(3);
  });

  test('mailto: 地址 + 查询参数', () => {
    const out = parsePayload('mailto:a@b.com?subject=Hello%20World&body=x%2By');
    expect(out.kind).toBe('mailto');
    expect(out.fields).toEqual([
      { key: 'address', value: 'a@b.com' },
      { key: 'subject', value: 'Hello World' },
      { key: 'body', value: 'x+y' },
    ]);
    const bare = parsePayload('mailto:a@b.com');
    expect(bare.fields).toEqual([ { key: 'address', value: 'a@b.com' } ]);
  });

  test('tel / SMSTO', () => {
    expect(parsePayload('TEL:+8613800138000')).toEqual({ kind: 'tel', fields: [ { key: 'number', value: '+8613800138000' } ] });
    expect(parsePayload('tel:')).toEqual({ kind: 'tel', fields: [] });
    expect(parsePayload('SMSTO:10086:余额 查询')).toEqual({
      kind: 'sms',
      fields: [ { key: 'number', value: '10086' }, { key: 'body', value: '余额 查询' } ],
    });
  });

  test('geo: 坐标 + 查询参数', () => {
    const out = parsePayload('geo:39.9087,116.3975,50?z=15&q=天安门');
    expect(out.kind).toBe('geo');
    expect(out.fields).toEqual([
      { key: 'lat', value: '39.9087' },
      { key: 'lng', value: '116.3975' },
      { key: 'alt', value: '50' },
      { key: 'z', value: '15' },
      { key: 'q', value: '天安门' },
    ]);
  });

  test('otpauth: 类型 / 签发方 / 账号 / 参数', () => {
    const out = parsePayload('otpauth://totp/ACME%20Co:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME&digits=6&period=30');
    expect(out.kind).toBe('otpauth');
    expect(out.fields[0]).toEqual({ key: 'type', value: 'TOTP' });
    expect(out.fields).toContainEqual({ key: 'issuer', value: 'ACME Co' });
    expect(out.fields).toContainEqual({ key: 'account', value: 'alice@example.com' });
    expect(out.fields).toContainEqual({ key: 'secret', value: 'JBSWY3DPEHPK3PXP' });
    expect(out.fields).toContainEqual({ key: 'period', value: '30' });
  });

  test('纯文本 / 空内容', () => {
    expect(parsePayload('随便一段文字')).toEqual({ kind: 'text', fields: [] });
    expect(parsePayload('')).toEqual({ kind: 'text', fields: [] });
    expect(parsePayload(undefined)).toEqual({ kind: 'text', fields: [] });
    expect(parsePayload(123 as never)).toEqual({ kind: 'text', fields: [] });
  });
});

describe('splitUnescaped', () => {
  test('按未转义的分隔符切分并还原转义', () => {
    expect(splitUnescaped('a;b;c')).toEqual([ 'a', 'b', 'c' ]);
    expect(splitUnescaped('a\\;b;c')).toEqual([ 'a;b', 'c' ]);
    expect(splitUnescaped('a\\\\b;c')).toEqual([ 'a\\b', 'c' ]);
    expect(splitUnescaped('a\\xb')).toEqual([ 'a\\xb' ]);
    expect(splitUnescaped('', ',')).toEqual([ '' ]);
  });
});

describe('isOpenableUrl', () => {
  test('http(s) / ftp / mailto 可打开, 其它不行', () => {
    expect(isOpenableUrl('https://a.com')).toBe(true);
    expect(isOpenableUrl(' http://a.com ')).toBe(true);
    expect(isOpenableUrl('mailto:a@b.com')).toBe(true);
    expect(isOpenableUrl('WIFI:T:WPA;;')).toBe(false);
    expect(isOpenableUrl('')).toBe(false);
    expect(isOpenableUrl(undefined as never)).toBe(false);
  });
});

describe('historyTitle / pushHistory', () => {
  test('标题单行化并按长度截断', () => {
    expect(historyTitle('a\n b\tc')).toBe('a b c');
    expect(historyTitle('123456', 3)).toBe('123…');
    expect(historyTitle(undefined as never)).toBe('');
  });

  test('新记录排最前', () => {
    const a = { text: 'a', at: 1, kind: 'text' as const };
    const b = { text: 'b', at: 2, kind: 'text' as const };
    const c = { text: 'c', at: 3, kind: 'text' as const };
    expect(pushHistory([ a, b ], c, 5).map((e) => e.text)).toEqual([ 'c', 'a', 'b' ]);
  });

  test('内容重复时只把旧记录提到最前, 不新增条目', () => {
    const a = { text: 'a', at: 1, kind: 'text' as const };
    const b = { text: 'b', at: 2, kind: 'text' as const };
    const out = pushHistory([ a, b ], { text: 'a', at: 9, kind: 'text' }, 5);
    expect(out.map((e) => e.text)).toEqual([ 'a', 'b' ]);
    expect(out[0].at).toBe(9);
  });

  test('超过上限时丢弃最旧的记录, 且不改动原数组', () => {
    const list = [ 1, 2, 3, 4, 5 ].map((n) => ({ text: `t${n}`, at: n, kind: 'text' as const }));
    const out = pushHistory(list, { text: 'new', at: 9, kind: 'text' }, 5);
    expect(out.map((e) => e.text)).toEqual([ 'new', 't1', 't2', 't3', 't4' ]);
    expect(list).toHaveLength(5);
  });

  test('非法入参容错 (上限非法时回退默认, 原列表非数组按空处理)', () => {
    const a = { text: 'a', at: 1, kind: 'text' as const };
    expect(pushHistory([ a ], { text: 'b', at: 2, kind: 'text' }, 0)).toHaveLength(2);
    expect(pushHistory(undefined as never, a, 10)).toEqual([ a ]);
  });
});

describe('hexOf / textBytes', () => {
  test('HEX 输出大写两字符, 支持截断并容错非法字节', () => {
    expect(hexOf([ 0, 15, 255 ])).toBe('00 0F FF');
    expect(hexOf([ 1, 2, 3 ], 2)).toBe('01 02');
    expect(hexOf([ 300, -1, Number.NaN ])).toBe('FF 00 00');
    expect(hexOf(undefined as never)).toBe('');
  });

  test('textBytes 按 UTF-8 计算', () => {
    expect(textBytes('abc')).toBe(3);
    expect(textBytes('中文')).toBe(6);
    expect(textBytes(undefined as never)).toBe(0);
  });
});

describe('resultFileName', () => {
  test('带时间戳的 txt 文件名', () => {
    const d = new Date(2026, 8, 26, 15, 30, 12);
    expect(resultFileName(d)).toBe('qrcode-20260926-153012.txt');
    expect(resultFileName()).toMatch(/^qrcode-\d{8}-\d{6}\.txt$/);
  });
});

describe('polygonPoints', () => {
  test('四角拼成 polygon 坐标串, 无定位点返回 null', () => {
    expect(polygonPoints({
      topLeft: { x: 1, y: 2 },
      topRight: { x: 21, y: 2 },
      bottomRight: { x: 21, y: 22 },
      bottomLeft: { x: 1, y: 22 },
    })).toBe('1,2 21,2 21,22 1,22');
    expect(polygonPoints(null)).toBeNull();
  });
});

describe('默认设置 (设置中心 <-> 工具页)', () => {
  test('无存储时用默认值', () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ inversion: 'attemptBoth', maxEdge: MAX_EDGE_DEFAULT, historyMax: HISTORY_MAX_DEFAULT, autoCopy: false });
  });

  test('写入后可读回, 非法值被归一化', () => {
    setSettings({ inversion: 'onlyInvert', maxEdge: 0, historyMax: 50, autoCopy: true });
    expect(getSettings()).toEqual({ inversion: 'onlyInvert', maxEdge: 0, historyMax: 50, autoCopy: true });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string).inversion).toBe('onlyInvert');
    expect(setSettings({ inversion: 'bad' as never, maxEdge: -1, historyMax: 0, autoCopy: 'yes' as never })).toEqual(DEFAULT_SETTINGS);
  });

  test('patchSettings 保留未提供的字段', () => {
    setSettings({ inversion: 'dontInvert', maxEdge: 800, historyMax: 20, autoCopy: false });
    expect(patchSettings({ autoCopy: true })).toEqual({ inversion: 'dontInvert', maxEdge: 800, historyMax: 20, autoCopy: true });
    expect(getSettings().autoCopy).toBe(true);
  });

  test('存储内容损坏时回退默认', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{oops');
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '"str"');
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test('normalizeSettings 对空值 / 部分字段容错', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ maxEdge: 2400 })).toEqual({ ...DEFAULT_SETTINGS, maxEdge: 2400 });
  });
});
