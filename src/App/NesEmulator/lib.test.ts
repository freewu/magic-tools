import '@testing-library/jest-dom';
import {
  DEFAULT_OPTIONS, buildKeyLookup, cloneKeys, decodeSaveState, encodeSaveState, formatRomSize, frameIntervalMs,
  gamepadButtonOf, getDefaultOptions, getRecentRoms, hotkeyOf, isRomFileName, isSameOptions, isTypingTarget,
  keyDisplayName, keyLabel, keyToPadButton, normalizeKeys, normalizeOptions, normalizeSpeed, normalizeVolume,
  parseRomHeader, patchDefaultOptions, pushRecentRom, readFileBytes, readFileText, readQuickSave, rebindKey,
  romBaseName, saveRecentRoms, screenshotFileName, setDefaultOptions, stateFileName, volumeToGain, writeQuickSave,
  clearQuickSave, EMPTY_ROM_INFO, type RecentRom,
} from './lib';
import { DEFAULT_KEYS, STATE_FILE_HEADER, VOLUME_DEFAULT } from './data';

/** 构造一个最小可用的 iNES 文件 (默认 1 个 PRG bank + 1 个 CHR bank) */
const makeRom = (
  opts: { prg?: number; chr?: number; flags6?: number; flags7?: number; extra?: number[] } = {},
): Uint8Array => {
  const prg = opts.prg ?? 1;
  const chr = opts.chr ?? 1;
  const bytes = new Uint8Array(16 + prg * 16384 + chr * 8192 + (opts.extra?.length ?? 0));
  bytes.set([ 0x4e, 0x45, 0x53, 0x1a ], 0);
  bytes[4] = prg;
  bytes[5] = chr;
  bytes[6] = opts.flags6 ?? 0;
  bytes[7] = opts.flags7 ?? 0;
  if (opts.extra) bytes.set(opts.extra, 16);
  return bytes;
};

beforeEach(() => {
  localStorage.clear();
});

describe('ROM 头解析', () => {
  test('标准 iNES 文件: mapper / 容量 / 制式 / 镜像', () => {
    const info = parseRomHeader(makeRom());
    expect(info.valid).toBe(true);
    expect(info.error).toBeUndefined();
    expect(info.isNes2).toBe(false);
    expect(info.prgBanks).toBe(1);
    expect(info.chrBanks).toBe(1);
    expect(info.mapper).toBe(0);
    expect(info.mirroring).toBe('horizontal');
    expect(info.region).toBe('ntsc');
    expect(info.battery).toBe(false);
    expect(info.trainer).toBe(false);
    expect(info.fileSize).toBe(16 + 16384 + 8192);
  });

  test('flags6 低位: 垂直镜像 / 电池存档 / trainer', () => {
    expect(parseRomHeader(makeRom({ flags6: 0x01 })).mirroring).toBe('vertical');
    expect(parseRomHeader(makeRom({ flags6: 0x08 })).mirroring).toBe('four-screen');
    expect(parseRomHeader(makeRom({ flags6: 0x02 })).battery).toBe(true);
    const trainer = parseRomHeader(makeRom({ flags6: 0x04, extra: new Array(512).fill(0) }));
    expect(trainer.trainer).toBe(true);
    expect(trainer.valid).toBe(true);
  });

  test('flags6 / flags7 高位拼接出 mapper 编号', () => {
    // flags6 高 4 位 = 1, flags7 高 4 位 = 0x40 -> mapper 0x41
    const info = parseRomHeader(makeRom({ flags6: 0x10, flags7: 0x40 }));
    expect(info.mapper).toBe(0x41);
  });

  test('iNES 1.0 的 PAL 标记 (byte 9 bit0)', () => {
    const bytes = makeRom();
    bytes[9] = 0x01;
    expect(parseRomHeader(bytes).region).toBe('pal');
  });

  test('NES 2.0: 识别格式并按 byte 9 扩展 PRG/CHR 数量', () => {
    const bytes = makeRom({ prg: 1, chr: 1, flags7: 0x08 });
    bytes[9] = 0x00;
    const info = parseRomHeader(bytes);
    expect(info.isNes2).toBe(true);
    expect(info.valid).toBe(true);
    expect(info.prgBanks).toBe(1);
    expect(info.chrBanks).toBe(1);
  });

  test('NES 2.0: byte 12 低 2 位标识制式', () => {
    const bytes = makeRom({ flags7: 0x08 });
    bytes[12] = 1;
    expect(parseRomHeader(bytes).region).toBe('pal');
    bytes[12] = 2;
    expect(parseRomHeader(bytes).region).toBe('dual');
  });

  test('非法 / 不完整文件给出对应错误码', () => {
    expect(parseRomHeader(undefined)).toMatchObject({ valid: false, error: 'tooShort' });
    expect(parseRomHeader(new Uint8Array(4))).toMatchObject({ valid: false, error: 'tooShort' });
    const bad = makeRom();
    bad[0] = 0x00;
    expect(parseRomHeader(bad)).toMatchObject({ valid: false, error: 'notNes' });
    expect(parseRomHeader(makeRom({ prg: 0 }))).toMatchObject({ valid: false, error: 'noPrg' });
    // 声称 4 个 PRG bank, 实际只有 1 个 -> 文件不完整
    const truncated = makeRom();
    truncated[4] = 4;
    expect(parseRomHeader(truncated)).toMatchObject({ valid: false, error: 'truncated' });
  });

  test('空信息常量可直接当作初始值', () => {
    expect(EMPTY_ROM_INFO.valid).toBe(false);
    expect(EMPTY_ROM_INFO.mapper).toBe(0);
  });
});

describe('文件命名 / 大小展示', () => {
  test('formatRomSize 按量级切换单位', () => {
    expect(formatRomSize(0)).toBe('0 B');
    expect(formatRomSize(512)).toBe('512 B');
    expect(formatRomSize(24592)).toBe('24 KB');
    expect(formatRomSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });

  test('romBaseName 去掉目录与扩展名', () => {
    expect(romBaseName('Contra (U).nes')).toBe('Contra (U)');
    expect(romBaseName('/tmp/roms/Super Mario Bros.nes')).toBe('Super Mario Bros');
    expect(romBaseName('noext')).toBe('noext');
    expect(romBaseName('')).toBe('rom');
  });

  test('isRomFileName 只认 .nes', () => {
    expect(isRomFileName('a.nes')).toBe(true);
    expect(isRomFileName('a.NES')).toBe(true);
    expect(isRomFileName('a.zip')).toBe(false);
  });

  test('存档 / 截屏文件名带固定后缀', () => {
    expect(stateFileName('Contra.nes')).toBe('Contra.nesstate');
    const date = new Date(2024, 0, 2, 3, 4, 5);
    expect(screenshotFileName('Contra.nes', date)).toBe('Contra-20240102-030405.png');
  });
});

describe('键位映射', () => {
  test('默认键位: 方向键与 WASD 都能用', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    expect(keyToPadButton(keys, 'ArrowUp')).toBe('Up');
    expect(keyToPadButton(keys, 'w')).toBe('Up');
    expect(keyToPadButton(keys, 'x')).toBe('A');
    expect(keyToPadButton(keys, 'Enter')).toBe('Start');
    expect(keyToPadButton(keys, 'F5')).toBeNull();
  });

  test('buildKeyLookup 每个键只命中一个手柄按键', () => {
    const lookup = buildKeyLookup(normalizeKeys(DEFAULT_KEYS));
    expect(lookup.ArrowLeft).toBe('Left');
    expect(Object.values(lookup)).not.toContain(undefined);
  });

  test('normalizeKeys: 过滤非法项并回退默认', () => {
    const keys = normalizeKeys({ Up: [ 'i' ], Down: [], Left: 'not-array', A: [ '', 'i' ] });
    expect(keys.Up).toEqual([ 'i' ]);
    // 'i' 已被 Up 占用, A 的空串被丢弃后回退到默认键 (x)
    expect(keys.A).toEqual([ 'x' ]);
    // 空数组 / 非数组一律用默认补齐
    expect(keys.Down.length).toBeGreaterThan(0);
    expect(keys.Left.length).toBeGreaterThan(0);
  });

  test('normalizeKeys 对垃圾输入返回完整默认表', () => {
    const keys = normalizeKeys(null);
    expect(Object.keys(keys).sort()).toEqual(Object.keys(DEFAULT_KEYS).sort());
    expect(keys.Start).toEqual([ 'Enter' ]);
  });

  test('rebindKey: 新键从其它按键摘除, 并成为唯一键位', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    const next = rebindKey(keys, 'B', 'x');
    expect(next.B).toEqual([ 'x' ]);
    expect(next.A).not.toContain('x');
    // 原表不被修改
    expect(keys.B).toEqual([ 'z', 'Z', 'k', 'K' ]);
    expect(keyToPadButton(next, 'x')).toBe('B');
  });

  test('cloneKeys 是深拷贝', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    const copy = cloneKeys(keys);
    copy.Up.push('!');
    expect(keys.Up).not.toContain('!');
  });

  test('keyLabel / keyDisplayName 便于界面展示', () => {
    const keys = normalizeKeys(DEFAULT_KEYS);
    expect(keyLabel(keys, 'Up')).toBe('ArrowUp');
    expect(keyDisplayName('ArrowUp')).toBe('↑');
    expect(keyDisplayName(' ')).toBe('空格');
    expect(keyDisplayName('q')).toBe('q');
  });

  test('hotkeyOf 只认快捷键, 不误判手柄按键', () => {
    expect(hotkeyOf('F5')).toBe('quickSave');
    expect(hotkeyOf('F8')).toBe('quickLoad');
    expect(hotkeyOf('p')).toBe('playPause');
    expect(hotkeyOf('m')).toBe('mute');
    expect(hotkeyOf('z')).toBeNull();
    expect(hotkeyOf('ArrowUp')).toBeNull();
  });

  test('gamepadButtonOf 按标准布局映射', () => {
    expect(gamepadButtonOf(0)).toBe('A');
    expect(gamepadButtonOf(1)).toBe('B');
    expect(gamepadButtonOf(9)).toBe('Start');
    expect(gamepadButtonOf(14)).toBe('Left');
    expect(gamepadButtonOf(5)).toBeNull();
  });

  test('isTypingTarget 命中输入类元素', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
  });
});

describe('倍速 / 音量', () => {
  test('normalizeSpeed 归到最近的档位', () => {
    expect(normalizeSpeed(0.9)).toBe(1);
    expect(normalizeSpeed(1.9)).toBe(2);
    expect(normalizeSpeed(3)).toBe(2);
    expect(normalizeSpeed('1.5')).toBe(1.5);
    expect(normalizeSpeed('abc')).toBe(1);
  });

  test('frameIntervalMs 与倍速成反比', () => {
    expect(frameIntervalMs(1)).toBeCloseTo(16.64, 1);
    expect(frameIntervalMs(2)).toBeCloseTo(8.32, 1);
  });

  test('normalizeVolume 夹到 0~100 的整数', () => {
    expect(normalizeVolume(-20)).toBe(0);
    expect(normalizeVolume(180)).toBe(100);
    expect(normalizeVolume(39.6)).toBe(40);
    expect(normalizeVolume('abc')).toBe(VOLUME_DEFAULT);
  });

  test('volumeToGain 换算成 0~1 增益', () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(70)).toBeCloseTo(0.7, 5);
    expect(volumeToGain(100)).toBe(1);
  });
});

describe('默认设置', () => {
  test('无存储时返回内置默认值', () => {
    const opts = getDefaultOptions();
    expect(opts).toEqual(DEFAULT_OPTIONS);
  });

  test('setDefaultOptions 归一化后写回并可读', () => {
    const saved = setDefaultOptions({ volume: 120, speed: 1.9, showFps: false, smooth: true, keys: normalizeKeys({}) });
    expect(saved.volume).toBe(100);
    expect(saved.speed).toBe(2);
    expect(saved.showFps).toBe(false);
    expect(saved.smooth).toBe(true);
    expect(getDefaultOptions()).toEqual(saved);
  });

  test('存储内容损坏时回退默认值', () => {
    localStorage.setItem('magic-tools-nes-settings', '{oops');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('patchDefaultOptions 局部更新', () => {
    patchDefaultOptions({ volume: 30 });
    expect(getDefaultOptions().volume).toBe(30);
    patchDefaultOptions({ showFps: false });
    expect(getDefaultOptions()).toMatchObject({ volume: 30, showFps: false });
  });

  test('isSameOptions 比较全部字段', () => {
    const a = normalizeOptions(DEFAULT_OPTIONS);
    expect(isSameOptions(a, normalizeOptions(DEFAULT_OPTIONS))).toBe(true);
    expect(isSameOptions(a, { ...a, volume: a.volume + 1 })).toBe(false);
    const keys = cloneKeys(a.keys);
    keys.A = [ 'q' ];
    expect(isSameOptions(a, { ...a, keys })).toBe(false);
  });
});

describe('存档编解码', () => {
  test('编码带文件头, 解码可还原', () => {
    const json = JSON.stringify({ cpu: { pc: 1 } });
    const text = encodeSaveState(json);
    expect(text.startsWith(STATE_FILE_HEADER)).toBe(true);
    expect(decodeSaveState(text)).toBe(json);
  });

  test('也接受不带文件头的纯 Base64', () => {
    const json = JSON.stringify({ cpu: {} });
    expect(decodeSaveState(btoa(json))).toBe(json);
  });

  test('空内容 / 非法内容抛异常', () => {
    expect(() => decodeSaveState('')).toThrow();
    expect(() => decodeSaveState('%%%')).toThrow();
  });

  test('快速存档读写与清空', () => {
    expect(readQuickSave()).toBeNull();
    expect(writeQuickSave('abc')).toBe(true);
    expect(readQuickSave()).toBe('abc');
    clearQuickSave();
    expect(readQuickSave()).toBeNull();
  });
});

describe('最近打开', () => {
  const entry = (name: string, at = 1): RecentRom => ({ name, mapper: 0, size: 1024, at });

  test('pushRecentRom 去重并置顶', () => {
    const list = pushRecentRom([ entry('a', 1), entry('b', 2) ], entry('a', 3));
    expect(list.map((it) => it.name)).toEqual([ 'a', 'b' ]);
    expect(list[0].at).toBe(3);
  });

  test('pushRecentRom 只保留上限条数', () => {
    let list: RecentRom[] = [];
    for (let i = 0; i < 10; i += 1) list = pushRecentRom(list, entry(`rom${i}`, i));
    expect(list).toHaveLength(6);
    expect(list[0].name).toBe('rom9');
  });

  test('saveRecentRoms / getRecentRoms 往返, 并过滤垃圾数据', () => {
    saveRecentRoms([ entry('a') ]);
    expect(getRecentRoms()).toEqual([ entry('a') ]);
    localStorage.setItem('magic-tools-nes-recent', '[null, {"name":""}, {"name":"b","mapper":"2"}]');
    expect(getRecentRoms()).toEqual([ { name: 'b', mapper: 2, size: 0, at: 0 } ]);
    localStorage.setItem('magic-tools-nes-recent', 'not json');
    expect(getRecentRoms()).toEqual([]);
  });
});

describe('文件读取', () => {
  test('readFileBytes 读出字节', async () => {
    const file = new File([ new Uint8Array([ 1, 2, 3 ]) ], 'a.nes');
    await expect(readFileBytes(file).then((b) => Array.from(b))).resolves.toEqual([ 1, 2, 3 ]);
  });

  test('readFileText 读出文本', async () => {
    await expect(readFileText(new Blob([ 'hello' ]))).resolves.toBe('hello');
  });
});
