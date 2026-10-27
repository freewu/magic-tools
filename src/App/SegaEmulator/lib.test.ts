// Sega 模拟器纯逻辑单测: 选项读写 / ROM 文件名 / 播放器页 URL / 消息解析
import {
  DEFAULT_OPTIONS, coreLabelOf, coreOfRomName, extOf, formatFileSize, getDefaultOptions, isFileLike, isRomFileName,
  normalizeOptions, normalizeVolume, parsePlayerMessage, patchDefaultOptions, pickRomFile, playerLang, playerUrl,
  romBaseName, setDefaultOptions,
} from './lib';
import { SETTINGS_STORAGE_KEY, VOLUME_DEFAULT, VOLUME_MAX } from './data';

beforeEach(() => {
  localStorage.clear();
});

describe('选项 (默认音量 / 启动后自动全屏)', () => {
  test('未设置过时使用默认值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    expect(DEFAULT_OPTIONS.volume).toBe(VOLUME_DEFAULT);
    expect(DEFAULT_OPTIONS.autoFullscreen).toBe(false);
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
    expect(normalizeOptions({ volume: 10 })).toEqual({ volume: 10, autoFullscreen: false });
    expect(normalizeOptions({ autoFullscreen: true })).toEqual({ volume: VOLUME_DEFAULT, autoFullscreen: true });
    // 非布尔值一律按关闭处理
    expect(normalizeOptions({ autoFullscreen: 'yes' as unknown as boolean }).autoFullscreen).toBe(false);
  });

  test('存储内容损坏时回退默认', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('patchDefaultOptions 只改提供的字段, 并写入 localStorage', () => {
    setDefaultOptions({ volume: 30, autoFullscreen: true });
    expect(getDefaultOptions()).toEqual({ volume: 30, autoFullscreen: true });

    const next = patchDefaultOptions({ volume: 70 });
    expect(next).toEqual({ volume: 70, autoFullscreen: true });
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({ volume: 70, autoFullscreen: true });
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
  test('带 lang / volume / core 参数, 并清掉 hash', () => {
    const url = playerUrl({ locale: 'zh-CN', volume: 55, core: 'segaMS' }, 'http://localhost:1212/index.html#/SegaEmulator');
    expect(url).toBe('http://localhost:1212/emulatorjs/player.html?lang=zh-CN&volume=55&core=segaMS');
    expect(new URL(url).hash).toBe('');
  });

  test('Web 版子路径 (/tools/) 也解析到同目录下的播放器页', () => {
    const url = playerUrl(
      { locale: 'en', volume: 100 },
      'https://freewu.github.io/magic-tools/tools/#/SegaEmulator'
    );
    expect(url).toBe('https://freewu.github.io/magic-tools/tools/emulatorjs/player.html?lang=en-US&volume=100&core=segaMD');
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
