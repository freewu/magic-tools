// Sega 模拟器: 内核 / ROM 扩展名 / 播放器页 / 存储 key / 样式等常量
// 模拟核心: Genesis Plus GX (libretro 的 Mega Drive / Genesis / Master System / Game Gear 模拟器, GPL-3.0)
// 页面控制器: EmulatorJS 4.2.3 (GPL-3.0, https://emulatorjs.org)
// 两者都内置在仓库 src/public/emulatorjs 下 (来源与版本见该目录 README.md), 运行期不联网。
// 说明: 纯数据与常量集中在此; 选项 / 文件名解析 / 播放器 URL 等逻辑在 lib.ts, 页面只做渲染与副作用

/** 内嵌播放器页 (src/public/emulatorjs/player.html, 构建后位于 dist/emulatorjs/player.html) */
export const PLAYER_PAGE = 'emulatorjs/player.html';

/** 默认核心: Mega Drive / Genesis */
export const DEFAULT_CORE = 'segaMD';

/**
 * 扩展名 -> 核心: Genesis Plus GX 一台机器一颗核心名
 * (EmulatorJS 的 system 名 segaMD / segaMS / segaGG 都指向同一个 genesis_plus_gx 核心)
 */
export const CORE_BY_EXT: Record<string, string> = {
  '.sms': 'segaMS',
  '.gg': 'segaGG',
};

/** 核心名 -> 机型显示名 (机器名, 不翻译) */
export const CORE_LABELS: Record<string, string> = {
  segaMD: 'Mega Drive / Genesis',
  segaMS: 'Master System',
  segaGG: 'Game Gear',
};

/**
 * 支持的 ROM 扩展名
 * 压缩包 (.zip / .7z) 按 Mega Drive 处理; 32X / Sega CD 需要另外的核心, 未内置
 */
export const ROM_EXTENSIONS = [ '.md', '.bin', '.gen', '.smd', '.sms', '.gg', '.zip', '.7z' ] as const;

/** <input type="file"> 的 accept 属性 */
export const ROM_ACCEPT = '.md,.bin,.gen,.smd,.sms,.gg,.zip,.7z,.MD,.BIN,.GEN,.SMD,.SMS,.GG,.ZIP,.7Z';

/** 音量 (0~100, 与设置里的滑块一致) */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_DEFAULT = 80;

/** 设置持久化 key */
export const SETTINGS_STORAGE_KEY = 'magic-tools-segaemulator-settings';

/** 键位持久化 key */
export const KEYS_STORAGE_KEY = 'magic-tools-segaemulator-keys';

// ---- 手柄按键 / 键位 ----

/** 手柄按键: 十字键 + Genesis 六键手柄的 A~Z + Start / Mode */
export type SegaButton = 'Up' | 'Down' | 'Left' | 'Right' | 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z' | 'Start' | 'Mode';

/** 按键展示顺序 (十字键 -> 动作键 -> Start / Mode) */
export const SEGA_BUTTONS: readonly SegaButton[] = [
  'Up', 'Down', 'Left', 'Right', 'A', 'B', 'C', 'X', 'Y', 'Z', 'Start', 'Mode',
];

/**
 * 按键 -> EmulatorJS (RetroArch 布局) 的按钮编号
 * 与 EmulatorJS 的 segaMD 虚拟手柄 / 控制菜单一致: B=0 A=1 Mode=2 Start=3 Up..Right=4..7 C=8 Y=9 X=10 Z=11
 */
export const BUTTON_IDS: Record<SegaButton, number> = {
  B: 0, A: 1, Mode: 2, Start: 3, Up: 4, Down: 5, Left: 6, Right: 7, C: 8, Y: 9, X: 10, Z: 11,
};

/** 按键显示名 (十字键用中文, 动作键用真机上的丝印) */
export const BUTTON_LABELS: Record<SegaButton, string> = {
  Up: '上', Down: '下', Left: '左', Right: '右',
  A: 'A', B: 'B', C: 'C', X: 'X', Y: 'Y', Z: 'Z', Start: 'Start', Mode: 'Mode',
};

/**
 * 默认键位 (KeyboardEvent.keyCode)
 * 十字键 = 方向键; A / B / C = Z / X / C; X / Y / Z = A / S / D; Start = Enter; Mode = V
 */
export const DEFAULT_KEYS: Record<SegaButton, number> = {
  Up: 38, Down: 40, Left: 37, Right: 39,
  A: 90, B: 88, C: 67, X: 65, Y: 83, Z: 68,
  Start: 13, Mode: 86,
};

/** 播放器页 -> 父页面的消息类型 (见 player.html) */
export const MSG_LOADING = 'sega-loading';
export const MSG_READY = 'sega-ready';
export const MSG_STARTED = 'sega-started';
export const MSG_ERROR = 'sega-error';
export const MSG_ROM_FILE = 'sega-rom-file';

/** 舞台 (iframe 容器) 与拖放区样式: 深浅色都用主题变量, 不写死颜色 */
export const SEGA_CSS = `
.sega-stage {
  position: relative;
  width: 100%;
  min-height: 320px;
  height: min(62vh, 560px);
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.sega-stage.is-full {
  height: 100vh;
  border-radius: 0;
}
.sega-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
}
.sega-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  border: 1px dashed var(--sega-line);
  border-radius: 8px;
  background: var(--sega-bg);
  color: var(--sega-fg);
  text-align: center;
  cursor: pointer;
  transition: border-color .2s, background .2s;
}
.sega-drop:hover,
.sega-drop.is-over {
  border-color: #1677ff;
  background: var(--sega-bg-hover);
}
.sega-drop-title {
  font-size: 15px;
  font-weight: 600;
}
.sega-drop-hint {
  font-size: 12px;
  opacity: .65;
}
/* 按键配置: 每格一个按钮, 点一下进入待绑定 (虚线高亮), 再按键盘上的新键 */
.sega-keys {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 8px;
  width: 100%;
}
.sega-key {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--sega-line);
  border-radius: 6px;
  background: var(--sega-bg);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: border-color .2s, background .2s;
}
.sega-key:hover {
  border-color: #1677ff;
  background: var(--sega-bg-hover);
}
.sega-key.is-binding {
  border-style: dashed;
  border-color: #1677ff;
  background: var(--sega-bg-hover);
}
.sega-key-name {
  font-size: 12px;
  color: var(--sega-fg);
  white-space: nowrap;
}
.sega-key-val {
  min-width: 34px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--sega-bg-hover);
  color: var(--sega-fg);
  font: 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-align: center;
  white-space: nowrap;
}
.sega-key.is-custom .sega-key-val {
  background: rgba(22, 119, 255, .16);
  color: #1677ff;
}
.sega-key.is-binding .sega-key-val {
  background: transparent;
  color: #1677ff;
}
`;
