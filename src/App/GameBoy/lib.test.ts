import {
  DEFAULT_OPTIONS, EMPTY_ROM_INFO, NINTENDO_LOGO, clearQuickSave, clearSram, cloneKeys, decodeSaveState,
  encodeSaveState, formatRomSize, frameIntervalMs, gamepadButtonOf, getDefaultOptions, getRecentRoms, getSramEntries,
  globalChecksum, hasNintendoLogo, headerChecksum, hotkeyOf, isRomFileName, isSameOptions, isTypingTarget, keyDisplayName,
  keyLabel, keyToPadButton, normalizeKeys, normalizeOptions, normalizeSpeed, normalizeVolume, parseRomHeader,
  patchDefaultOptions, pushRecentRom, readQuickSave, readSram, rebindKey, romBaseName, saveRecentRoms, screenshotFileName,
  setDefaultOptions, stateFileName, timestampSuffix, volumeToGain, writeQuickSave, writeRgba, writeSram, SRAM_LIMIT,
} from './lib';
import { DEFAULT_KEYS, PAD_BUTTONS, SETTINGS_STORAGE_KEY } from './data';

/** 构造一个头部合法的合成卡带 */
const makeRom = (opts: {
  title?: string;
  cgb?: number;
  cartType?: number;
  romSizeCode?: number;
  ramSizeCode?: number;
  version?: number;
  size?: number;
  logo?: boolean;
  badGlobal?: boolean;
} = {}): Uint8Array => {
  const size = opts.size ?? 0x8000;
  const bytes = new Uint8Array(size);
  if (opts.logo !== false) NINTENDO_LOGO.forEach((v, i) => { bytes[0x104 + i] = v; });
  const title = opts.title ?? 'TESTGAME';
  for (let i = 0; i < title.length && i < 16; i++) bytes[0x134 + i] = title.charCodeAt(i);
  bytes[0x143] = opts.cgb ?? 0;
  bytes[0x146] = 0;
  bytes[0x147] = opts.cartType ?? 0x00;
  bytes[0x148] = opts.romSizeCode ?? 0x00;
  bytes[0x149] = opts.ramSizeCode ?? 0x00;
  bytes[0x14c] = opts.version ?? 0;
  bytes[0x14d] = headerChecksum(bytes);
  const sum = globalChecksum(bytes) + (opts.badGlobal ? 1 : 0);
  bytes[0x14e] = (sum >> 8) & 0xff;
  bytes[0x14f] = sum & 0xff;
  return bytes;
};

beforeEach(() => {
  localStorage.clear();
});

describe('卡带头解析', () => {
  test('合法卡带解析出标题 / 类型 / 容量', () => {
    const info = parseRomHeader(makeRom({ title: 'TETRIS', cartType: 0x1b, romSizeCode: 0x03, ramSizeCode: 0x02 }));
    expect(info.valid).toBe(true);
    expect(info.error).toBeUndefined();
    expect(info.title).toBe('TETRIS');
    expect(info.cartType).toBe(0x1b);
    expect(info.cartTypeName).toBe('MBC5 + RAM + 电池');
    expect(info.romSizeKB).toBe(256);
    expect(info.ramSizeKB).toBe(8);
    expect(info.battery).toBe(true);
    expect(info.headerChecksumOk).toBe(true);
    expect(info.globalChecksumOk).toBe(true);
    expect(info.fileSize).toBe(0x8000);
  });

  test('文件太小 / 非卡带文件被判为无效', () => {
    const tooShort = parseRomHeader(new Uint8Array(64));
    expect(tooShort.valid).toBe(false);
    expect(tooShort.error).toBe('tooShort');
    expect(tooShort.fileSize).toBe(64);

    const noLogo = parseRomHeader(new Uint8Array(0x8000));
    expect(noLogo.valid).toBe(false);
    expect(noLogo.error).toBe('badLogo');

    expect(parseRomHeader(null)).toEqual({ ...EMPTY_ROM_INFO, error: 'tooShort', fileSize: 0 });
  });

  test('缺 Logo 但两个校验和正确时仍然可用 (改版 ROM 常见)', () => {
    const info = parseRomHeader(makeRom({ logo: false }));
    expect(info.valid).toBe(true);
    expect(info.headerChecksumOk).toBe(true);
    expect(info.globalChecksumOk).toBe(true);
  });

  test('校验和只作为提示: Logo 正确的仍可运行, Logo 也不对才算坏文件', () => {
    const rom = makeRom();
    rom[0x14d] = (rom[0x14d] + 1) & 0xff;
    const info = parseRomHeader(rom);
    expect(info.headerChecksumOk).toBe(false);
    expect(info.valid).toBe(true);

    const broken = makeRom({ logo: false });
    broken[0x14d] = (broken[0x14d] + 1) & 0xff;
    const brokenInfo = parseRomHeader(broken);
    expect(brokenInfo.valid).toBe(false);
    expect(brokenInfo.error).toBe('badLogo');

    const bad = parseRomHeader(makeRom({ badGlobal: true }));
    expect(bad.globalChecksumOk).toBe(false);
  });

  test('CGB 标记决定运行模式', () => {
    expect(parseRomHeader(makeRom({ cgb: 0 })).cartMode).toBe('dmg');
    expect(parseRomHeader(makeRom({ cgb: 0x80 })).cartMode).toBe('compatible');
    expect(parseRomHeader(makeRom({ cgb: 0xc0 })).cartMode).toBe('only');
  });

  test('SGB 标记 / 版本号 / 无电池卡带', () => {
    const rom = makeRom({ cartType: 0x01, version: 3 });
    rom[0x146] = 0x03;
    const info = parseRomHeader(rom);
    expect(info.sgb).toBe(true);
    expect(info.version).toBe(3);
    expect(info.battery).toBe(false);
    expect(info.romSizeKB).toBe(32);
    expect(info.ramSizeKB).toBe(0);
  });

  test('未知卡带类型退化为十六进制描述', () => {
    expect(parseRomHeader(makeRom({ cartType: 0x42 })).cartTypeName).toBe('0x42');
  });

  test('头部校验和 / 全局校验和 / Logo 判断可单独复用', () => {
    const rom = makeRom();
    expect(headerChecksum(rom)).toBe(rom[0x14d]);
    expect(globalChecksum(rom)).toBe(((rom[0x14e] << 8) | rom[0x14f]));
    expect(hasNintendoLogo(rom)).toBe(true);
    expect(hasNintendoLogo(new Uint8Array(16))).toBe(false);
  });
});

describe('文件名 / 格式化', () => {
  test('formatRomSize 分级', () => {
    expect(formatRomSize(0)).toBe('0 B');
    expect(formatRomSize(512)).toBe('512 B');
    expect(formatRomSize(64 * 1024)).toBe('64 KB');
    expect(formatRomSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  test('romBaseName / 存档名 / 截屏名', () => {
    expect(romBaseName('/tmp/Pokemon.gb')).toBe('Pokemon');
    expect(romBaseName('C:\\roms\\a.gbc')).toBe('a');
    expect(romBaseName('noext')).toBe('noext');
    expect(romBaseName('')).toBe('rom');
    expect(stateFileName('a.gb')).toBe('a.gbstate');
    const stamp = new Date(2024, 0, 31, 23, 59, 59);
    expect(timestampSuffix(stamp)).toBe('20240131-235959');
    expect(screenshotFileName('a.gbc', stamp)).toBe('a-20240131-235959.png');
  });

  test('isRomFileName 只认 gb / gbc / bin', () => {
    expect(isRomFileName('a.gb')).toBe(true);
    expect(isRomFileName('a.GB')).toBe(true);
    expect(isRomFileName('a.gbc')).toBe(true);
    expect(isRomFileName('a.bin')).toBe(true);
    expect(isRomFileName('a.nes')).toBe(false);
    expect(isRomFileName('')).toBe(false);
  });

  test('isTypingTarget 识别输入框', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
  });
});

describe('键位映射', () => {
  test('默认键位覆盖全部手柄按键, 且没有重复绑定', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    expect(Object.keys(keys).sort()).toEqual([ ...PAD_BUTTONS ].sort());
    const all = PAD_BUTTONS.flatMap((b) => keys[b]);
    expect(new Set(all).size).toBe(all.length);
    expect(keyToPadButton(keys, 'ArrowUp')).toBe('Up');
    expect(keyToPadButton(keys, 'z')).toBe('A');
    expect(keyToPadButton(keys, 'x')).toBe('B');
    expect(keyToPadButton(keys, 'Enter')).toBe('Start');
    expect(keyToPadButton(keys, 'nope')).toBeNull();
  });

  test('非法输入回退默认键位', () => {
    expect(normalizeKeys(DEFAULT_KEYS).Up).toEqual([ 'ArrowUp', 'w', 'W' ]);
    // 完全缺失时每个手柄键只补一个默认键, 保证可用
    const empty = normalizeKeys(undefined);
    expect(empty.Up).toEqual([ 'ArrowUp' ]);
    expect(PAD_BUTTONS.every((b) => empty[b].length === 1)).toBe(true);
    expect(normalizeKeys({ Up: 'x' }).Up).toEqual([ 'ArrowUp' ]);
    // 同一个键不会同时绑到两个手柄按键
    const dup = normalizeKeys({ Up: [ 'z' ], A: [ 'z' ], B: [ 'z' ] });
    expect(dup.Up).toEqual([ 'z' ]);
    expect(dup.A).not.toContain('z');
    expect(dup.B).not.toContain('z');
  });

  test('rebindKey 把按键从其它手柄键上摘除', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    const next = rebindKey(keys, 'A', 'ArrowUp');
    expect(next.A).toEqual([ 'ArrowUp' ]);
    expect(next.Up).not.toContain('ArrowUp');
    // 原对象不被修改
    expect(keys.A).toEqual([ 'z', 'Z', 'j', 'J' ]);
    expect(cloneKeys(keys).A).toEqual(keys.A);
  });

  test('keyLabel / keyDisplayName / gamepadButtonOf / hotkeyOf', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    expect(keyLabel(keys, 'Start')).toBe('Enter');
    expect(keyLabel({ ...keys, Start: [] }, 'Start')).toBe('—');
    expect(keyDisplayName('ArrowLeft')).toBe('←');
    expect(keyDisplayName('KeyQ')).toBe('KeyQ');
    expect(gamepadButtonOf(0)).toBe('A');
    expect(gamepadButtonOf(12)).toBe('Up');
    expect(gamepadButtonOf(4)).toBeNull();
    expect(hotkeyOf('F5')).toBe('quickSave');
    expect(hotkeyOf('F11')).toBe('fullscreen');
    expect(hotkeyOf('F2')).toBeNull();
  });
});

describe('倍速 / 音量', () => {
  test('normalizeSpeed 取最接近的档位', () => {
    expect(normalizeSpeed(1)).toBe(1);
    expect(normalizeSpeed(0.55)).toBe(0.5);
    expect(normalizeSpeed(2)).toBe(2);
    expect(normalizeSpeed(9)).toBe(2);
    expect(normalizeSpeed('abc')).toBe(1);
  });

  test('frameIntervalMs 与倍速成反比', () => {
    const one = frameIntervalMs(1);
    expect(one).toBeGreaterThan(16);
    expect(one).toBeLessThan(17);
    expect(frameIntervalMs(2)).toBeCloseTo(one / 2);
  });

  test('normalizeVolume / volumeToGain', () => {
    expect(normalizeVolume(undefined)).toBe(70);
    expect(normalizeVolume(-5)).toBe(0);
    expect(normalizeVolume(150)).toBe(100);
    expect(normalizeVolume(33.6)).toBe(34);
    expect(volumeToGain(50)).toBeCloseTo(0.5);
  });
});

describe('画面转换', () => {
  test('writeRgba 把 RGB 展开成 RGBA', () => {
    const rgb = new Uint8Array([ 1, 2, 3, 4, 5, 6 ]);
    const out = new Uint8ClampedArray(8);
    writeRgba(rgb, out);
    expect(Array.from(out)).toEqual([ 1, 2, 3, 255, 4, 5, 6, 255 ]);
  });

  test('数据不足时只写能写的像素, 不越界', () => {
    const out = new Uint8ClampedArray(8);
    writeRgba(new Uint8Array([ 9, 9, 9 ]), out);
    expect(Array.from(out)).toEqual([ 9, 9, 9, 255, 0, 0, 0, 0 ]);
    expect(() => writeRgba(null, out)).not.toThrow();
  });
});

describe('默认设置', () => {
  test('未保存时返回默认值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('写入后可读回, 非法值被归一化', () => {
    setDefaultOptions({ volume: 500, speed: 3, showFps: false, smooth: true });
    const opts = getDefaultOptions();
    expect(opts.volume).toBe(100);
    expect(opts.speed).toBe(2);
    expect(opts.showFps).toBe(false);
    expect(opts.smooth).toBe(true);
    expect(opts.keys.Up).toEqual([ 'ArrowUp', 'w', 'W' ]);
  });

  test('存储内容损坏时回退默认值', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{ bad json');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('patchDefaultOptions 只改传入字段', () => {
    setDefaultOptions({ volume: 20, showFps: false });
    const next = patchDefaultOptions({ volume: 55 });
    expect(next.volume).toBe(55);
    expect(next.showFps).toBe(false);
    expect(getDefaultOptions().volume).toBe(55);
  });

  test('isSameOptions 比较全部字段 (含键位)', () => {
    const a = normalizeOptions({ volume: 10 });
    expect(isSameOptions(a, normalizeOptions({ volume: 10 }))).toBe(true);
    expect(isSameOptions(a, normalizeOptions({ volume: 11 }))).toBe(false);
    const b = normalizeOptions({ volume: 10, keys: rebindKey(a.keys, 'A', 'q') });
    expect(isSameOptions(a, b)).toBe(false);
  });

  test('normalizeOptions 接受 undefined', () => {
    expect(normalizeOptions(null)).toEqual(DEFAULT_OPTIONS);
  });
});

describe('存档编解码', () => {
  test('往返一致', () => {
    const bytes = new Uint8Array([ 0, 1, 2, 250, 255 ]);
    const text = encodeSaveState(bytes);
    expect(text.startsWith('GBSTATE1\n')).toBe(true);
    expect(Array.from(decodeSaveState(text))).toEqual([ 0, 1, 2, 250, 255 ]);
  });

  test('没有头部也接受 (纯 Base64)', () => {
    const text = encodeSaveState(new Uint8Array([ 7, 7 ])).split('\n')[1];
    expect(Array.from(decodeSaveState(text))).toEqual([ 7, 7 ]);
  });

  test('空内容 / 空文本抛错', () => {
    expect(() => decodeSaveState('')).toThrow();
    expect(() => decodeSaveState('   ')).toThrow();
  });

  test('快速存档: 写入 / 读取 / 清除', () => {
    expect(readQuickSave()).toBeNull();
    expect(writeQuickSave('GBSTATE1\nAAA')).toBe(true);
    expect(readQuickSave()).toBe('GBSTATE1\nAAA');
    clearQuickSave();
    expect(readQuickSave()).toBeNull();
  });
});

describe('卡带电池存档 (SRAM)', () => {
  test('按 ROM 名分别保存并可读回', () => {
    expect(writeSram('a.gb', new Uint8Array([ 1, 2, 3 ]))).toBe(true);
    expect(writeSram('b.gbc', new Uint8Array([ 4, 5 ]))).toBe(true);
    expect(Array.from(readSram('a.gb') ?? [])).toEqual([ 1, 2, 3 ]);
    expect(Array.from(readSram('b') ?? [])).toEqual([ 4, 5 ]);
    expect(readSram('c.gb')).toBeNull();
    // 同名再写会覆盖而不是追加
    writeSram('a.gb', new Uint8Array([ 9 ]));
    expect(Array.from(readSram('a.gb') ?? [])).toEqual([ 9 ]);
    expect(getSramEntries()).toHaveLength(2);
  });

  test('空数据等同清除, 单项 / 全部清除', () => {
    writeSram('a.gb', new Uint8Array([ 1 ]));
    writeSram('b.gb', new Uint8Array([ 2 ]));
    expect(writeSram('a.gb', new Uint8Array(0))).toBe(false);
    expect(readSram('a.gb')).toBeNull();
    clearSram('b');
    expect(getSramEntries()).toHaveLength(0);
    writeSram('c.gb', new Uint8Array([ 3 ]));
    clearSram();
    expect(getSramEntries()).toHaveLength(0);
  });

  test('条目数量有上限', () => {
    for (let i = 0; i < SRAM_LIMIT + 3; i++) writeSram(`r${i}.gb`, new Uint8Array([ i ]));
    expect(getSramEntries().length).toBe(SRAM_LIMIT);
    // 最新的排在最前
    expect(getSramEntries()[0].name).toBe('r8');
  });

  test('存储内容损坏时返回空 / null', () => {
    localStorage.setItem('magic-tools-gameboy-sram', 'not json');
    expect(getSramEntries()).toEqual([]);
    expect(readSram('a.gb')).toBeNull();
  });
});

describe('最近打开', () => {
  test('新记录提到最前且同名不重复', () => {
    const base = getRecentRoms();
    expect(base).toEqual([]);
    const a = { name: 'a', mode: 'dmg' as const, size: 100, at: 1 };
    const b = { name: 'b', mode: 'only' as const, size: 200, at: 2 };
    const list = pushRecentRom(pushRecentRom([], a), b);
    expect(list.map((it) => it.name)).toEqual([ 'b', 'a' ]);
    const again = pushRecentRom(list, { ...a, at: 3 });
    expect(again.map((it) => it.name)).toEqual([ 'a', 'b' ]);
    expect(again[0].at).toBe(3);
  });

  test('保存 / 读取, 过滤非法项', () => {
    saveRecentRoms([ { name: 'x', mode: 'compatible', size: 32, at: 5 } ]);
    expect(getRecentRoms()).toEqual([ { name: 'x', mode: 'compatible', size: 32, at: 5 } ]);
    localStorage.setItem('magic-tools-gameboy-recent', JSON.stringify([ { name: '' }, { name: 'y', mode: '?' } ]));
    expect(getRecentRoms()).toEqual([ { name: 'y', mode: 'dmg', size: 0, at: 0 } ]);
    localStorage.setItem('magic-tools-gameboy-recent', 'oops');
    expect(getRecentRoms()).toEqual([]);
  });
});
