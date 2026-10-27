// Sega 模拟器纯逻辑单测: 选项读写 / ROM 文件名 / 播放器页 URL / 消息解析
import {
  DEFAULT_OPTIONS, coreLabelOf, coreOfRomName, extOf, formatFileSize, getDefaultOptions, getKeys, isCustomKeys,
  isFileLike, isRomFileName, keyLabelOf, keyOwner, keysParam, keysToIds, normalizeKeys, normalizeOptions,
  normalizePadOpacity, normalizeVolume, padOpacityToAlpha, parsePlayerMessage, patchDefaultOptions, pickRomFile,
  playerLang, playerUrl, resetKeys, romBaseName, setDefaultOptions, setKeys,
} from './lib';
import {
  BUTTON_IDS, DEFAULT_KEYS, KEYS_STORAGE_KEY, PAD_OPACITY_DEFAULT, PAD_OPACITY_MAX, PAD_OPACITY_MIN, SEGA_BUTTONS,
  SETTINGS_STORAGE_KEY, VOLUME_DEFAULT, VOLUME_MAX,
} from './data';

beforeEach(() => {
  localStorage.clear();
});

describe('选项 (默认音量 / 自动全屏 / 游戏层按键)', () => {
  test('未设置过时使用默认值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    expect(DEFAULT_OPTIONS.volume).toBe(VOLUME_DEFAULT);
    expect(DEFAULT_OPTIONS.autoFullscreen).toBe(false);
    // 游戏层虚拟按键默认开着, 默认 70% 不透明度
    expect(DEFAULT_OPTIONS.showPad).toBe(true);
    expect(DEFAULT_OPTIONS.padOpacity).toBe(PAD_OPACITY_DEFAULT);
  });

  test('音量越界 clamp, 非法值回退默认', () => {
    expect(normalizeVolume(-20)).toBe(0);
    expect(normalizeVolume(999)).toBe(VOLUME_MAX);
    expect(normalizeVolume('55')).toBe(55);
    expect(normalizeVolume(52.6)).toBe(53);
    expect(normalizeVolume(undefined)).toBe(VOLUME_DEFAULT);
    expect(normalizeVolume('abc')).toBe(VOLUME_DEFAULT);
    expect(normalizeVolume(Number.NaN)).toBe(VOLUME_DEFAULT);
  });

  test('normalizeOptions 补全缺失字段', () => {
    expect(normalizeOptions(null)).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ volume: 10 })).toEqual({ ...DEFAULT_OPTIONS, volume: 10 });
    expect(normalizeOptions({ autoFullscreen: true })).toEqual({ ...DEFAULT_OPTIONS, autoFullscreen: true });
    // 非布尔值一律按关闭处理
    expect(normalizeOptions({ autoFullscreen: 'yes' as unknown as boolean }).autoFullscreen).toBe(false);
    expect(normalizeOptions({ showPad: 1 as unknown as boolean }).showPad).toBe(false);
    expect(normalizeOptions({ padOpacity: 5 }).padOpacity).toBe(PAD_OPACITY_MIN);
  });

  test('虚拟按键透明度: 越界 clamp / 非法回退 / 换算成 CSS opacity', () => {
    expect(normalizePadOpacity(0)).toBe(PAD_OPACITY_MIN);
    expect(normalizePadOpacity(500)).toBe(PAD_OPACITY_MAX);
    expect(normalizePadOpacity(52.6)).toBe(53);
    expect(normalizePadOpacity('55')).toBe(55);
    expect(normalizePadOpacity(undefined)).toBe(PAD_OPACITY_DEFAULT);
    expect(normalizePadOpacity('abc')).toBe(PAD_OPACITY_DEFAULT);
    expect(normalizePadOpacity(Number.NaN)).toBe(PAD_OPACITY_DEFAULT);
    // 默认 70 -> 0.7; 下限 20 -> 0.2 (永远看得见)
    expect(padOpacityToAlpha(PAD_OPACITY_DEFAULT)).toBe(0.7);
    expect(padOpacityToAlpha(PAD_OPACITY_MAX)).toBe(1);
    expect(padOpacityToAlpha(0)).toBe(0.2);
    expect(padOpacityToAlpha(undefined)).toBe(0.7);
  });

  test('存储内容损坏时回退默认', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('patchDefaultOptions 只改提供的字段, 并写入 localStorage', () => {
    setDefaultOptions({ volume: 30, autoFullscreen: true });
    expect(getDefaultOptions()).toEqual({ ...DEFAULT_OPTIONS, volume: 30, autoFullscreen: true });

    const next = patchDefaultOptions({ volume: 70 });
    expect(next).toEqual({ ...DEFAULT_OPTIONS, volume: 70, autoFullscreen: true });
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}'))
      .toEqual({ ...DEFAULT_OPTIONS, volume: 70, autoFullscreen: true });

    // 关掉游戏层按键后仍然可以单独调透明度
    expect(patchDefaultOptions({ showPad: false, padOpacity: 40 }))
      .toEqual({ ...DEFAULT_OPTIONS, volume: 70, autoFullscreen: true, showPad: false, padOpacity: 40 });
  });
});

describe('ROM 文件名', () => {
  test('支持的扩展名 (大小写不敏感)', () => {
    for (const name of [ 'sonic.md', 'sonic.BIN', 'game.gen', 'game.smd', 'game.sms', 'game.gg', 'rom.zip', 'rom.7Z' ]) {
      expect(isRomFileName(name)).toBe(true);
    }
  });

  test('不支持 / 无扩展名 / 空文件名', () => {
    for (const name of [ 'save.sav', 'rom.sfc', 'rom.32x', 'rom', '', '   ' ]) {
      expect(isRomFileName(name)).toBe(false);
    }
    expect(isRomFileName('.md')).toBe(false);
    expect(isRomFileName('rom.')).toBe(false);
  });

  test('extOf / romBaseName', () => {
    expect(extOf('Sonic.The.Hedgehog.md')).toBe('.md');
    expect(extOf('ROM.ZIP')).toBe('.zip');
    expect(extOf('rom')).toBe('');
    expect(romBaseName('Sonic.The.Hedgehog.md')).toBe('Sonic.The.Hedgehog');
    expect(romBaseName('rom')).toBe('rom');
  });

  test('按扩展名选核心: sms / gg 各一颗, 其余 (含压缩包) 按 Mega Drive', () => {
    expect(coreOfRomName('alex.sms')).toBe('segaMS');
    expect(coreOfRomName('sonic.gg')).toBe('segaGG');
    expect(coreOfRomName('sonic.md')).toBe('segaMD');
    expect(coreOfRomName('sonic.zip')).toBe('segaMD');
    expect(coreLabelOf('segaMS')).toBe('Master System');
    expect(coreLabelOf('segaGG')).toBe('Game Gear');
    expect(coreLabelOf('segaMD')).toBe('Mega Drive / Genesis');
    // 未知核心回退 Mega Drive
    expect(coreLabelOf('nope')).toBe('Mega Drive / Genesis');
  });

  test('formatFileSize', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.00 MB');
    expect(formatFileSize(-1)).toBe('0 B');
    expect(formatFileSize('big')).toBe('0 B');
  });
});

describe('播放器页 URL', () => {
  test('带 lang / volume / core / keys 参数, 并清掉 hash', () => {
    const url = new URL(playerUrl(
      { locale: 'zh-CN', volume: 55, core: 'segaMS' },
      'http://localhost:1212/index.html#/SegaEmulator'
    ));
    expect(url.origin + url.pathname).toBe('http://localhost:1212/emulatorjs/player.html');
    expect(url.searchParams.get('lang')).toBe('zh-CN');
    expect(url.searchParams.get('volume')).toBe('55');
    expect(url.searchParams.get('core')).toBe('segaMS');
    // 键位按默认值带上 (空值表示用默认键位)
    expect(url.searchParams.get('keys')).toBe(keysParam(DEFAULT_KEYS));
    expect(url.hash).toBe('');
  });

  test('Web 版子路径 (/tools/) 也解析到同目录下的播放器页', () => {
    const url = new URL(playerUrl(
      { locale: 'en', volume: 100 },
      'https://freewu.github.io/magic-tools/tools/#/SegaEmulator'
    ));
    expect(url.origin + url.pathname).toBe('https://freewu.github.io/magic-tools/tools/emulatorjs/player.html');
    expect(url.searchParams.get('lang')).toBe('en-US');
    expect(url.searchParams.get('core')).toBe('segaMD');
  });

  test('音量越界先归一化再写进 URL', () => {
    const url = playerUrl({ locale: 'zh-CN', volume: 500 }, 'http://localhost:1212/');
    expect(new URL(url).searchParams.get('volume')).toBe(String(VOLUME_MAX));
  });

  test('playerLang: 繁体也走 zh-CN 语言包 (EmulatorJS 没有 zh-TW)', () => {
    expect(playerLang('zh-CN')).toBe('zh-CN');
    expect(playerLang('zh-TW')).toBe('zh-CN');
    expect(playerLang('en')).toBe('en-US');
    expect(playerLang('ja')).toBe('en-US');
  });
});

describe('键位 (键盘按键)', () => {
  test('默认键位: 十字键 = 方向键, Z/X/C = A/B/C, A/S/D = X/Y/Z, Enter/V = Start/Mode', () => {
    expect(SEGA_BUTTONS).toEqual([ 'Up', 'Down', 'Left', 'Right', 'A', 'B', 'C', 'X', 'Y', 'Z', 'Start', 'Mode' ]);
    expect(DEFAULT_KEYS.Up).toBe(38);
    expect(DEFAULT_KEYS.Down).toBe(40);
    expect(DEFAULT_KEYS.Left).toBe(37);
    expect(DEFAULT_KEYS.Right).toBe(39);
    expect([ DEFAULT_KEYS.A, DEFAULT_KEYS.B, DEFAULT_KEYS.C ]).toEqual([ 90, 88, 67 ]);
    expect([ DEFAULT_KEYS.X, DEFAULT_KEYS.Y, DEFAULT_KEYS.Z ]).toEqual([ 65, 83, 68 ]);
    expect(DEFAULT_KEYS.Start).toBe(13);
    expect(DEFAULT_KEYS.Mode).toBe(86);
    // 每个按键都有默认值, 且互不重复
    expect(new Set(SEGA_BUTTONS.map((b) => DEFAULT_KEYS[b])).size).toBe(SEGA_BUTTONS.length);
  });

  test('按钮编号与 EmulatorJS (RetroArch 布局) 一致', () => {
    expect(BUTTON_IDS.B).toBe(0);
    expect(BUTTON_IDS.A).toBe(1);
    expect(BUTTON_IDS.Mode).toBe(2);
    expect(BUTTON_IDS.Start).toBe(3);
    expect([ BUTTON_IDS.Up, BUTTON_IDS.Down, BUTTON_IDS.Left, BUTTON_IDS.Right ]).toEqual([ 4, 5, 6, 7 ]);
    expect([ BUTTON_IDS.C, BUTTON_IDS.Y, BUTTON_IDS.X, BUTTON_IDS.Z ]).toEqual([ 8, 9, 10, 11 ]);
  });

  test('normalizeKeys: 缺项 / 非法值 / 重复键都回退默认', () => {
    expect(normalizeKeys(null)).toEqual(DEFAULT_KEYS);
    // 只给一部分: 其余用默认
    expect(normalizeKeys({ A: 75 }).A).toBe(75);
    expect(normalizeKeys({ A: 75 }).B).toBe(DEFAULT_KEYS.B);
    // 非法值 (0 / 负数 / 超范围 / 非数字)
    expect(normalizeKeys({ A: 0 }).A).toBe(DEFAULT_KEYS.A);
    expect(normalizeKeys({ A: -3 }).A).toBe(DEFAULT_KEYS.A);
    expect(normalizeKeys({ A: 9999 }).A).toBe(DEFAULT_KEYS.A);
    expect(normalizeKeys({ A: '75' }).A).toBe(DEFAULT_KEYS.A);
    // 两个按键抢同一个键: 后面的回退默认
    const dup = normalizeKeys({ A: 75, B: 75 });
    expect(dup.A).toBe(75);
    expect(dup.B).toBe(DEFAULT_KEYS.B);
  });

  test('读写 / 恢复默认 / 是否自定义', () => {
    expect(getKeys()).toEqual(DEFAULT_KEYS);
    expect(isCustomKeys(getKeys())).toBe(false);

    const saved = setKeys({ ...DEFAULT_KEYS, A: 75 });
    expect(saved.A).toBe(75);
    expect(JSON.parse(localStorage.getItem(KEYS_STORAGE_KEY) ?? '{}').A).toBe(75);
    expect(getKeys()).toEqual(saved);
    expect(isCustomKeys(getKeys())).toBe(true);

    expect(resetKeys()).toEqual(DEFAULT_KEYS);
    expect(getKeys()).toEqual(DEFAULT_KEYS);
    expect(isCustomKeys(getKeys())).toBe(false);
  });

  test('存储内容损坏时回退默认键位', () => {
    localStorage.setItem(KEYS_STORAGE_KEY, '{not json');
    expect(getKeys()).toEqual(DEFAULT_KEYS);
    localStorage.setItem(KEYS_STORAGE_KEY, '"abc"');
    expect(getKeys()).toEqual(DEFAULT_KEYS);
  });

  test('keyOwner: 找到占用该键的按键, 可排除自己', () => {
    const keys = { ...DEFAULT_KEYS, A: 75 };
    expect(keyOwner(keys, 75)).toBe('A');
    expect(keyOwner(keys, 75, 'A')).toBeNull();
    expect(keyOwner(keys, 1234)).toBeNull();
  });

  test('keyLabelOf: 字母大写 / 方向键用箭头 / 其它用名字或编号', () => {
    expect(keyLabelOf(90)).toBe('Z');
    expect(keyLabelOf(38)).toBe('↑');
    expect(keyLabelOf(13)).toBe('Enter');
    expect(keyLabelOf(32)).toBe('Space');
    expect(keyLabelOf(112)).toBe('F1');
    expect(keyLabelOf(96)).toBe('Num0');
    expect(keyLabelOf(53)).toBe('5');
    expect(keyLabelOf(186)).toBe(';');
    // 未收录的键显示编号, 无效值显示 '-'
    expect(keyLabelOf(200)).toBe('#200');
    expect(keyLabelOf(0)).toBe('-');
    expect(keyLabelOf(Number.NaN)).toBe('-');
  });

  test('keysToIds / keysParam: 键位表转成「按钮编号 -> keyCode」', () => {
    expect(keysToIds(DEFAULT_KEYS)).toEqual({
      4: 38, 5: 40, 6: 37, 7: 39, 1: 90, 0: 88, 8: 67, 10: 65, 9: 83, 11: 68, 3: 13, 2: 86,
    });
    const custom = { ...DEFAULT_KEYS, Start: 32 };
    expect(JSON.parse(keysParam(custom))['3']).toBe(32);
    // 非法值不写进参数 (播放器页保持它自己的默认)
    expect(JSON.parse(keysParam({ ...DEFAULT_KEYS, Mode: 0 }))['2']).toBeUndefined();
  });
});

describe('播放器页消息', () => {
  test('loading / ready / started / error / rom-file', () => {
    expect(parsePlayerMessage({ type: 'sega-loading', name: 'sonic.md' })).toEqual({ kind: 'loading', name: 'sonic.md' });
    expect(parsePlayerMessage({ type: 'sega-ready', name: 'sonic.md' })).toEqual({ kind: 'ready', name: 'sonic.md' });
    expect(parsePlayerMessage({ type: 'sega-started', name: 'sonic.md' })).toEqual({ kind: 'started', name: 'sonic.md' });
    expect(parsePlayerMessage({ type: 'sega-error', message: 'boom' })).toEqual({ kind: 'error', message: 'boom' });

    const file = new File([ 'x' ], 'sonic.md');
    const msg = parsePlayerMessage({ type: 'sega-rom-file', file });
    expect(msg?.kind).toBe('rom-file');
    expect(msg && msg.kind === 'rom-file' ? msg.file : null).toBe(file);
  });

  test('sega-input 解析按下 / 松开 (驱动游戏层按键动效)', () => {
    expect(parsePlayerMessage({ type: 'sega-input', id: 0, down: true })).toEqual({ kind: 'input', id: 0, down: true });
    expect(parsePlayerMessage({ type: 'sega-input', id: 11, down: false })).toEqual({ kind: 'input', id: 11, down: false });
    // down 缺省按松开处理
    expect(parsePlayerMessage({ type: 'sega-input', id: 4 })).toEqual({ kind: 'input', id: 4, down: false });
    // 编号非法直接丢弃
    expect(parsePlayerMessage({ type: 'sega-input', id: -1, down: true })).toBeNull();
    expect(parsePlayerMessage({ type: 'sega-input', id: 'x', down: true })).toBeNull();
    expect(parsePlayerMessage({ type: 'sega-input', down: true })).toBeNull();
  });

  test('无关消息 / 缺字段一律返回 null', () => {
    expect(parsePlayerMessage(null)).toBeNull();
    expect(parsePlayerMessage('sega-started')).toBeNull();
    expect(parsePlayerMessage({ type: 'other' })).toBeNull();
    // rom-file 缺少文件时丢弃
    expect(parsePlayerMessage({ type: 'sega-rom-file' })).toBeNull();
    expect(parsePlayerMessage({ type: 'sega-rom-file', file: { name: 'x.md' } })).toBeNull();
  });

  test('isFileLike 用字段判断, 跨 realm 也成立', () => {
    expect(isFileLike(new File([ 'x' ], 'a.md'))).toBe(true);
    expect(isFileLike({ name: 'a.md', size: 3 })).toBe(true);
    expect(isFileLike({ name: 'a.md' })).toBe(false);
    expect(isFileLike(null)).toBe(false);
    expect(isFileLike('a.md')).toBe(false);
  });

  test('pickRomFile 支持 File / 数组 / FileList 形态', () => {
    const file = new File([ 'x' ], 'sonic.md');
    expect(pickRomFile(file)).toBe(file);
    expect(pickRomFile([ file ])).toBe(file);
    expect(pickRomFile({ 0: file, length: 1 })).toBe(file);
    expect(pickRomFile([])).toBeNull();
    expect(pickRomFile(null)).toBeNull();
    expect(pickRomFile([ 'nope' ])).toBeNull();
  });
});
