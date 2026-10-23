// GameBoy 模拟器: 屏幕规格 / 按键 / 默认键位 / 存储 key / 样式等常量
// 模拟核心使用 boytacean (Rust + WebAssembly 的 GB / GBC 模拟器, Apache-2.0);
// 界面与操作参考 https://x0cero.github.io/gameboy/ (Rust 版 GB 模拟器的网页端)
// 说明: 纯数据与常量集中在此; 解析 / 键位 / 存档等逻辑在 lib.ts, 页面只做渲染与副作用

/** GameBoy 屏幕分辨率: 160 × 144 */
export const SCREEN_WIDTH = 160;
export const SCREEN_HEIGHT = 144;

/** GameBoy 刷新率 (59.7275Hz, 每帧 70224 时钟周期) */
export const BASE_FPS = 59.7275;

/** 一帧的时钟周期数 (扫描线 154 × 456) */
export const FRAME_CYCLES = 70224;

/** 可选倍速 */
export const SPEED_OPTIONS = [ 0.5, 1, 1.5, 2 ] as const;
export type Speed = (typeof SPEED_OPTIONS)[ number ];
export const SPEED_DEFAULT: Speed = 1;

/** 手柄按键 */
export type PadButton = 'A' | 'B' | 'Select' | 'Start' | 'Up' | 'Down' | 'Left' | 'Right';
export const PAD_BUTTONS: readonly PadButton[] = [ 'Up', 'Down', 'Left', 'Right', 'A', 'B', 'Select', 'Start' ];

/**
 * 按键对应的 boytacean PadKey 数值
 * (Up=0, Down=1, Left=2, Right=3, Start=4, Select=5, A=6, B=7; 写成字面量便于纯函数单测)
 */
export const PAD_CODES: Record<PadButton, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7> = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
  Start: 4,
  Select: 5,
  A: 6,
  B: 7,
};

/**
 * 默认键位 (KeyboardEvent.key): 每个按键支持多个别名
 * A / B 的顺序与参考实现一致 (Z = A, X = B), 同时兼容 J / K
 */
export const DEFAULT_KEYS: Record<PadButton, string[]> = {
  Up: [ 'ArrowUp', 'w', 'W' ],
  Down: [ 'ArrowDown', 's', 'S' ],
  Left: [ 'ArrowLeft', 'a', 'A' ],
  Right: [ 'ArrowRight', 'd', 'D' ],
  A: [ 'z', 'Z', 'j', 'J' ],
  B: [ 'x', 'X', 'k', 'K' ],
  Select: [ 'Shift', 'Backspace' ],
  Start: [ 'Enter' ],
};

/** 标准手柄 (Gamepad API standard mapping) 按键下标 -> GB 手柄按键 */
export const GAMEPAD_BUTTONS: Record<number, PadButton> = {
  0: 'A',
  1: 'B',
  8: 'Select',
  9: 'Start',
  12: 'Up',
  13: 'Down',
  14: 'Left',
  15: 'Right',
};

/** 浏览器全局快捷键 (不在模拟器按键映射内) */
export type Hotkey = 'playPause' | 'quickSave' | 'quickLoad' | 'reset' | 'mute' | 'fullscreen';
export const HOTKEYS: Record<string, Hotkey> = {
  p: 'playPause',
  P: 'playPause',
  Escape: 'playPause',
  F5: 'quickSave',
  F8: 'quickLoad',
  r: 'reset',
  R: 'reset',
  m: 'mute',
  M: 'mute',
  F11: 'fullscreen',
};

/** 音量范围 / 默认值 (0~100) */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_DEFAULT = 70;

/** 「最近打开」列表最多保留的条数 */
export const RECENT_LIMIT = 6;

/** 设置 / 快速存档 / 最近列表 / 卡带电池存档的 localStorage key */
export const SETTINGS_STORAGE_KEY = 'magic-tools-gameboy-settings';
export const QUICKSAVE_STORAGE_KEY = 'magic-tools-gameboy-quicksave';
export const RECENT_STORAGE_KEY = 'magic-tools-gameboy-recent';
export const SRAM_STORAGE_KEY = 'magic-tools-gameboy-sram';

/** 存档文件头 (读取时允许缺省) */
export const STATE_FILE_HEADER = 'GBSTATE1';

/** 支持的 ROM 扩展名 */
export const ROM_EXTENSIONS = [ 'gb', 'gbc', 'bin' ];

/** 卡带类型 (0x0147) -> 名称 (未列出的显示十六进制值) */
export const CART_TYPES: Record<number, string> = {
  0x00: 'ROM ONLY',
  0x01: 'MBC1',
  0x02: 'MBC1 + RAM',
  0x03: 'MBC1 + RAM + 电池',
  0x05: 'MBC2',
  0x06: 'MBC2 + 电池',
  0x08: 'ROM + RAM',
  0x09: 'ROM + RAM + 电池',
  0x0b: 'MMM01',
  0x0c: 'MMM01 + RAM',
  0x0d: 'MMM01 + RAM + 电池',
  0x0f: 'MBC3 + 计时 + 电池',
  0x10: 'MBC3 + 计时 + RAM + 电池',
  0x11: 'MBC3',
  0x12: 'MBC3 + RAM',
  0x13: 'MBC3 + RAM + 电池',
  0x19: 'MBC5',
  0x1a: 'MBC5 + RAM',
  0x1b: 'MBC5 + RAM + 电池',
  0x1c: 'MBC5 + 震动',
  0x1d: 'MBC5 + 震动 + RAM',
  0x1e: 'MBC5 + 震动 + RAM + 电池',
  0x20: 'MBC6',
  0x22: 'MBC7 + 传感器 + 震动 + RAM + 电池',
  0xfc: 'POCKET CAMERA',
  0xfd: 'BANDAI TAMA5',
  0xfe: 'HuC3',
  0xff: 'HuC1 + RAM + 电池',
};

/** ROM 容量码 (0x0148) -> KB */
export const ROM_SIZES: Record<number, number> = {
  0x00: 32, 0x01: 64, 0x02: 128, 0x03: 256, 0x04: 512, 0x05: 1024,
  0x06: 2048, 0x07: 4096, 0x08: 8192,
};

/** RAM 容量码 (0x0149) -> KB */
export const RAM_SIZES: Record<number, number> = {
  0x00: 0, 0x01: 2, 0x02: 8, 0x03: 32, 0x04: 128, 0x05: 64,
};

/** 画面 / 按键 / 全屏样式 (只做视觉, 不影响逻辑) */
export const GB_CSS = `
.gb-stage { box-sizing: border-box; }
.gb-stage.gb-full { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 16px; background: #000; }
.gb-screen { position: relative; width: 100%; max-width: 512px; margin: 0 auto; aspect-ratio: ${SCREEN_WIDTH} / ${SCREEN_HEIGHT};
  background: #000; border-radius: 6px; overflow: hidden; }
.gb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; background: #000;
  image-rendering: pixelated; }
.gb-canvas-smooth { image-rendering: auto; }
.gb-canvas-grid { filter: contrast(1.06) saturate(1.05); }
.gb-full .gb-screen { max-width: none; width: min(96vw, calc(86vh * ${SCREEN_WIDTH} / ${SCREEN_HEIGHT})); }
.gb-empty { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 8px; align-items: center;
  justify-content: center; padding: 16px; text-align: center; color: #cbd5e1; background:
  radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.22), transparent 60%), #0b1020; }
.gb-drop { outline: 2px dashed rgba(148, 163, 184, 0.7); outline-offset: -10px; }
.gb-pad { display: grid; grid-template-columns: repeat(3, 40px); grid-template-rows: repeat(3, 40px); gap: 4px; }
.gb-pad-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
  border: none; border-radius: 6px; background: rgba(148, 163, 184, 0.18); color: inherit; font-weight: 700;
  cursor: pointer; user-select: none; touch-action: none; }
.gb-pad-btn:active { background: rgba(16, 185, 129, 0.55); }
@media (prefers-reduced-motion: reduce) { .gb-canvas { scroll-behavior: auto; } }
`;
