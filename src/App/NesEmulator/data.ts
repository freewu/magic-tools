// NES 模拟器: 屏幕规格 / 手柄按键 / 默认键位 / 存储 key / 样式等常量
// 模拟核心使用 jsnes (纯 JS, 浏览器与桌面 WebView 都能跑); 界面与功能参考 tetanes (Rust + SDL2 的 NES 模拟器)
// 说明: 纯数据与常量集中在此; 解析 / 键位 / 存档等逻辑在 lib.ts, 页面只做渲染与副作用

/** NES 画面分辨率 (NTSC): 256 × 240 */
export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

/** NES 刷新率 (NTSC 60.098Hz) */
export const BASE_FPS = 60.098;

/** 可选倍速 */
export const SPEED_OPTIONS = [ 0.5, 1, 1.5, 2 ] as const;
export type Speed = (typeof SPEED_OPTIONS)[ number ];
export const SPEED_DEFAULT: Speed = 1;

/** 手柄按键 (玩家 1) */
export type PadButton = 'A' | 'B' | 'Select' | 'Start' | 'Up' | 'Down' | 'Left' | 'Right';
export const PAD_BUTTONS: readonly PadButton[] = [ 'Up', 'Down', 'Left', 'Right', 'A', 'B', 'Select', 'Start' ];

/**
 * 按键对应的 jsnes Controller.BUTTON_* 数值
 * (jsnes 里是 Client 常量 0~9, 这里写成字面量, 便于纯函数单测与避免运行时依赖它的导出)
 */
export const BUTTON_CODES: Record<PadButton, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7> = {
  A: 0,
  B: 1,
  Select: 2,
  Start: 3,
  Up: 4,
  Down: 5,
  Left: 6,
  Right: 7,
};

/** 默认键位 (KeyboardEvent.key): 每个按键支持多个别名, 方便同时满足「方向键」与「WASD」两套习惯 */
export const DEFAULT_KEYS: Record<PadButton, string[]> = {
  Up: [ 'ArrowUp', 'w', 'W' ],
  Down: [ 'ArrowDown', 's', 'S' ],
  Left: [ 'ArrowLeft', 'a', 'A' ],
  Right: [ 'ArrowRight', 'd', 'D' ],
  A: [ 'x', 'X', 'j', 'J' ],
  B: [ 'z', 'Z', 'k', 'K' ],
  Select: [ 'Shift', 'Backspace' ],
  Start: [ 'Enter' ],
};

/** 标准手柄 (Gamepad API standard mapping) 按键下标 -> NES 手柄按键 */
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

/** 存档 / 最近列表 / 键位等 localStorage key */
export const SETTINGS_STORAGE_KEY = 'magic-tools-nes-settings';
export const QUICKSAVE_STORAGE_KEY = 'magic-tools-nes-quicksave';
export const RECENT_STORAGE_KEY = 'magic-tools-nes-recent';

/** 存档文件头 (与 tetanes 的存档文件区分; 读取时允许缺省) */
export const STATE_FILE_HEADER = 'NESSTATE1';

/** 支持的 ROM 扩展名 */
export const ROM_EXTENSIONS = [ 'nes' ];

/** 画面 / 按键 / 全屏样式 (只做视觉, 不影响逻辑) */
export const NES_CSS = `
.nes-stage { box-sizing: border-box; }
.nes-stage.nes-full { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 16px; background: #000; }
.nes-screen { position: relative; width: 100%; max-width: 640px; margin: 0 auto; aspect-ratio: 256 / 240;
  background: #000; border-radius: 6px; overflow: hidden; }
.nes-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; background: #000;
  image-rendering: pixelated; }
.nes-canvas-smooth { image-rendering: auto; }
.nes-full .nes-screen { max-width: none; width: min(96vw, calc(86vh * ${SCREEN_WIDTH} / ${SCREEN_HEIGHT})); }
.nes-empty { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 8px; align-items: center;
  justify-content: center; padding: 16px; text-align: center; color: #cbd5e1; background:
  radial-gradient(circle at 50% 40%, rgba(56, 130, 246, 0.22), transparent 60%), #0b1020; }
.nes-drop { outline: 2px dashed rgba(148, 163, 184, 0.7); outline-offset: -10px; }
.nes-pad { display: grid; grid-template-columns: repeat(3, 40px); grid-template-rows: repeat(3, 40px); gap: 4px; }
.nes-pad-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
  border: none; border-radius: 6px; background: rgba(148, 163, 184, 0.18); color: inherit; font-weight: 700;
  cursor: pointer; user-select: none; touch-action: none; }
.nes-pad-btn:active { background: rgba(56, 130, 246, 0.55); }
@media (prefers-reduced-motion: reduce) { .nes-canvas { scroll-behavior: auto; } }
`;
