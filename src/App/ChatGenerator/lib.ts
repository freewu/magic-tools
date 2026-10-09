// 聊天生成器: 数据模型校验 / 消息增删改排序 / 默认值读写
import {
  BATTERY_DEFAULT, BATTERY_MAX, BATTERY_MIN, CHARGING_DEFAULT, DURATION_DEFAULT, DURATION_MAX, DURATION_MIN,
  IMAGE_MAX_CHARS, KEY_BATTERY, KEY_CHARGING, KEY_NAME_IN, KEY_NAME_OUT, KEY_NETWORK, KEY_PLATFORM, KEY_SCALE,
  KEY_SHOW_INPUT, KEY_SHOW_NAMES, KEY_SIGNAL, KEY_STATUS_TIME, KEY_SUBTITLE, KEY_SYSTEM, KEY_TITLE, MESSAGES_MAX,
  NAME_IN_DEFAULT,
  NAME_MAX, NAME_OUT_DEFAULT, NETWORK_DEFAULT, NETWORKS, PLATFORMS, PLATFORM_DEFAULT, PLATFORM_IDS, SAMPLE_IMAGE,
  SAMPLE_MESSAGES, SCALE_DEFAULT, SHOW_INPUT_DEFAULT, SHOW_NAMES_DEFAULT, SIGNAL_DEFAULT, SIGNAL_MAX, SIGNAL_MIN,
  STATUS_TIME_DEFAULT, SUBTITLE_DEFAULT, SYSTEMS, SYSTEM_DEFAULT, TEXT_MAX, TIME_LABEL_MAX, TIME_PATTERN,
  TITLE_DEFAULT, TITLE_MAX,
  type ChatDoc, type ChatMessage, type ChatMessageType, type ChatNetwork, type ChatScale, type ChatSide,
  type ChatSystem, type ChatTheme, type PlatformId,
} from './data';

// ==================== 通用小工具 ====================

/** 取整并夹到 [min, max], 非法值 (含 null / undefined / 空串) 用 fallback */
export const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

/** 截断超长文本 (按字符数, 与 antd maxLength 一致) */
export const clampText = (v: unknown, max: number): string => {
  const s = typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v);
  return s.length > max ? s.slice(0, max) : s;
};

/** 平台是否合法, 非法回退 wechat */
export const normalizePlatform = (v: unknown): PlatformId =>
  (PLATFORM_IDS as string[]).includes(String(v)) ? (v as PlatformId) : PLATFORM_DEFAULT;

/** 导出倍率 (1 / 2 / 3) */
export const normalizeScale = (v: unknown): ChatScale => {
  const n = clampInt(v, 1, 3, SCALE_DEFAULT);
  return n as ChatScale;
};

/** 状态栏系统风格 */
export const normalizeSystem = (v: unknown): ChatSystem =>
  (SYSTEMS as string[]).includes(String(v)) ? (v as ChatSystem) : SYSTEM_DEFAULT;

/** 状态栏网络类型 */
export const normalizeNetwork = (v: unknown): ChatNetwork =>
  (NETWORKS as string[]).includes(String(v)) ? (v as ChatNetwork) : NETWORK_DEFAULT;

/** 电量 (%) */
export const normalizeBattery = (v: unknown): number => clampInt(v, BATTERY_MIN, BATTERY_MAX, BATTERY_DEFAULT);

/** 信号格数 (1~4) */
export const normalizeSignal = (v: unknown): number => clampInt(v, SIGNAL_MIN, SIGNAL_MAX, SIGNAL_DEFAULT);

/** 语音时长 (秒) */
export const normalizeDuration = (v: unknown): number => clampInt(v, DURATION_MIN, DURATION_MAX, DURATION_DEFAULT);

/** 状态栏时间是否合法 (HH:MM, 24 小时制) */
export const isTimeText = (v: string): boolean => TIME_PATTERN.test(v.trim());

/** 状态栏时间: 非法时回退默认值 */
export const normalizeTimeText = (v: unknown, fallback?: string): string => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (isTimeText(s)) return s;
  return fallback !== undefined && isTimeText(fallback) ? fallback : STATUS_TIME_DEFAULT;
};

/** 消息类型是否合法 */
export const normalizeMessageType = (v: unknown): ChatMessageType =>
  v === 'image' || v === 'voice' || v === 'time' ? v : 'text';

/** 消息方向是否合法 */
export const normalizeSide = (v: unknown): ChatSide => (v === 'out' ? 'out' : 'in');

/** 平台样式 (id 非法时回退第一个平台) */
export const themeOf = (id: PlatformId): ChatTheme => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];

/** 平台名 (Tab / 下拉展示用, 品牌名不翻译) */
export const platformLabel = (id: PlatformId): string => themeOf(id).label;

/** 头像兜底文字: 昵称首个非空白字符 (拉丁字符转大写), 无昵称时用 ? */
export const avatarText = (name: string): string => {
  const s = (name || '').trim();
  if (!s) return '?';
  const ch = Array.from(s)[0];
  return ch.toUpperCase();
};

/** 电量文案 */
export const batteryText = (n: number): string => `${normalizeBattery(n)}%`;

/** 信号格: 返回 4 个布尔 (true = 点亮) */
export const signalLevels = (signal: number): boolean[] => {
  const n = normalizeSignal(signal);
  return [1, 2, 3, 4].map((i) => i <= n);
};

/** 语音时长文案 (如 6") */
export const voiceText = (duration: number): string => `${normalizeDuration(duration)}"`;

/** 已读回执符号 (none = 空字符串; read 与 double 用同一个双勾, 颜色由平台决定) */
export const receiptMark = (receipt: ChatTheme['receipt']): string => {
  if (receipt === 'check') return '✓';
  if (receipt === 'double' || receipt === 'read') return '✓✓';
  return '';
};

// ==================== 消息增删改 ====================

let idSeq = 0;

/** 生成消息 id (本地唯一即可, 不做全局保证) */
export const newId = (): string => {
  idSeq += 1;
  return `m${idSeq.toString(36)}${Date.now().toString(36)}`;
};

/** 校验并修正一条消息 (用于载入默认值 / 外部数据) */
export const normalizeMessage = (raw: Partial<ChatMessage> | null | undefined): ChatMessage => {
  const type = normalizeMessageType(raw?.type);
  const image = typeof raw?.image === 'string' ? raw.image.slice(0, IMAGE_MAX_CHARS) : '';
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : newId(),
    type,
    side: normalizeSide(raw?.side),
    name: clampText(raw?.name, NAME_MAX).trim(),
    text: clampText(raw?.text, type === 'time' ? TIME_LABEL_MAX : TEXT_MAX),
    image: type === 'image' ? image : '',
    duration: normalizeDuration(raw?.duration ?? DURATION_DEFAULT),
    time: typeof raw?.time === 'string' ? clampText(raw.time, 5).trim() : '',
  };
};

/** 按会话默认昵称 / 按钮类型新建一条消息 */
export const createMessage = (doc: ChatDoc, type: ChatMessageType, side: ChatSide = 'in'): ChatMessage =>
  normalizeMessage({
    type,
    side,
    name: (side === 'out' ? doc.nameOut : doc.nameIn).trim(),
    text: '',
    duration: DURATION_DEFAULT,
    time: '',
  });

/** 追加消息: 超过 MESSAGES_MAX 时原样返回 (由调用方提示) */
export const addMessage = (list: ChatMessage[], msg: ChatMessage): ChatMessage[] =>
  (list.length >= MESSAGES_MAX ? list : [...list, msg]);

/** 修改消息 (未命中 id 时返回浅拷贝) */
export const updateMessage = (list: ChatMessage[], id: string, patch: Partial<ChatMessage>): ChatMessage[] =>
  list.map((m) => (m.id === id ? normalizeMessage({ ...m, ...patch, id: m.id }) : m));

/** 删除消息 */
export const removeMessage = (list: ChatMessage[], id: string): ChatMessage[] =>
  list.filter((m) => m.id !== id);

/** 上移 / 下移一条消息 (越界时顺序不变) */
export const moveMessage = (list: ChatMessage[], id: string, dir: 'up' | 'down'): ChatMessage[] => {
  const from = list.findIndex((m) => m.id === id);
  const to = dir === 'up' ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** 清空消息 */
export const clearMessages = (): ChatMessage[] => [];

/** 平台示例对话 (深拷贝, 避免修改示例常量) */
export const sampleMessages = (): ChatMessage[] =>
  SAMPLE_MESSAGES.map((s) =>
    normalizeMessage({
      type: s.type,
      side: s.side ?? 'in',
      text: s.text ?? '',
      image: s.type === 'image' ? SAMPLE_IMAGE : '',
      duration: s.duration,
      time: s.time ?? '',
      name: '',
    })
  );

/** 载入默认值组装初始会话 (messages 由 sampleMessages 提供) */
export const docFromDefaults = (): ChatDoc => {
  const platform = getDefaultPlatform();
  return {
    platform,
    title: getDefaultTitle(),
    subtitle: getDefaultSubtitle(),
    system: getDefaultSystem(),
    statusTime: getDefaultStatusTime(),
    battery: getDefaultBattery(),
    charging: getDefaultCharging(),
    signal: getDefaultSignal(),
    network: getDefaultNetwork(),
    showInputBar: getDefaultShowInputBar(),
    showNames: getDefaultShowNames(),
    nameIn: getDefaultNameIn(),
    nameOut: getDefaultNameOut(),
    avatarIn: '',
    avatarOut: '',
    messages: sampleMessages(),
  };
};

// ==================== 默认值读写 ====================

const readSetting = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};

const writeSetting = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式 / 配额不足时忽略 */ }
};

// 读取时同样做防御: localStorage 可能被手工改写或由旧版本写入超长内容
export const getDefaultPlatform = (): PlatformId => normalizePlatform(readSetting(KEY_PLATFORM));
export const getDefaultTitle = (): string => clampText(readSetting(KEY_TITLE) ?? TITLE_DEFAULT, TITLE_MAX);
export const getDefaultSubtitle = (): string => clampText(readSetting(KEY_SUBTITLE) ?? SUBTITLE_DEFAULT, TITLE_MAX);
export const getDefaultScale = (): ChatScale => normalizeScale(readSetting(KEY_SCALE) ?? SCALE_DEFAULT);
export const getDefaultSystem = (): ChatSystem => normalizeSystem(readSetting(KEY_SYSTEM));
export const getDefaultStatusTime = (): string => normalizeTimeText(readSetting(KEY_STATUS_TIME));
export const getDefaultBattery = (): number => normalizeBattery(readSetting(KEY_BATTERY));
export const getDefaultCharging = (): boolean => readSetting(KEY_CHARGING) === '1';
export const getDefaultSignal = (): number => normalizeSignal(readSetting(KEY_SIGNAL));
export const getDefaultNetwork = (): ChatNetwork => normalizeNetwork(readSetting(KEY_NETWORK));
export const getDefaultShowInputBar = (): boolean => {
  const raw = readSetting(KEY_SHOW_INPUT);
  // 仅 '0' / '1' 视为有效, 其余 (未设置 / 手工改坏) 一律回退默认
  return raw === '0' ? false : raw === '1' ? true : SHOW_INPUT_DEFAULT;
};
export const getDefaultShowNames = (): boolean => {
  const raw = readSetting(KEY_SHOW_NAMES);
  return raw === '0' ? false : raw === '1' ? true : SHOW_NAMES_DEFAULT;
};
export const getDefaultNameIn = (): string => clampText(readSetting(KEY_NAME_IN) ?? NAME_IN_DEFAULT, NAME_MAX);
export const getDefaultNameOut = (): string => clampText(readSetting(KEY_NAME_OUT) ?? NAME_OUT_DEFAULT, NAME_MAX);

export const setDefaultPlatform = (v: unknown): void => writeSetting(KEY_PLATFORM, normalizePlatform(v));
export const setDefaultTitle = (v: unknown): void => writeSetting(KEY_TITLE, clampText(v, TITLE_MAX));
export const setDefaultSubtitle = (v: unknown): void => writeSetting(KEY_SUBTITLE, clampText(v, TITLE_MAX));
export const setDefaultScale = (v: unknown): void => writeSetting(KEY_SCALE, String(normalizeScale(v)));
export const setDefaultSystem = (v: unknown): void => writeSetting(KEY_SYSTEM, normalizeSystem(v));
export const setDefaultStatusTime = (v: unknown): void => writeSetting(KEY_STATUS_TIME, normalizeTimeText(v));
export const setDefaultBattery = (v: unknown): void => writeSetting(KEY_BATTERY, String(normalizeBattery(v)));
export const setDefaultCharging = (v: unknown): void => writeSetting(KEY_CHARGING, v ? '1' : '0');
export const setDefaultSignal = (v: unknown): void => writeSetting(KEY_SIGNAL, String(normalizeSignal(v)));
export const setDefaultNetwork = (v: unknown): void => writeSetting(KEY_NETWORK, normalizeNetwork(v));
export const setDefaultShowInputBar = (v: unknown): void => writeSetting(KEY_SHOW_INPUT, v ? '1' : '0');
export const setDefaultShowNames = (v: unknown): void => writeSetting(KEY_SHOW_NAMES, v ? '1' : '0');
export const setDefaultNameIn = (v: unknown): void => writeSetting(KEY_NAME_IN, clampText(v, NAME_MAX));
export const setDefaultNameOut = (v: unknown): void => writeSetting(KEY_NAME_OUT, clampText(v, NAME_MAX));

/** 供设置面板测试 / 清理用: 所有默认值键名 */
export const DEFAULT_KEYS: string[] = [
  KEY_PLATFORM, KEY_TITLE, KEY_SUBTITLE, KEY_SCALE, KEY_SYSTEM, KEY_STATUS_TIME, KEY_BATTERY, KEY_CHARGING,
  KEY_SIGNAL, KEY_NETWORK, KEY_SHOW_INPUT, KEY_SHOW_NAMES, KEY_NAME_IN, KEY_NAME_OUT,
];
