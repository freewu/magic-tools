/**
 * 假装开会: 纯前端渲染的三种会议软件假界面 (腾讯会议 / Zoom / Microsoft Teams)
 * 本文件只放纯数据与纯函数, 便于单测; 视图见 index.tsx
 */

/** 三种界面风格 */
export type Skin = 'tencent' | 'zoom' | 'teams';

/** 三语文本: [zh-CN, zh-TW, en] */
export type Trio = [string, string, string];

export const SKINS: Skin[] = [ 'tencent', 'zoom', 'teams' ];

/** 取三语文本 */
export const trio = (v: Trio, locale: string): string => (
  locale === 'zh-TW' ? v[1] : locale === 'en' ? v[2] : v[0]
);

// ---------------------------------------------------------------------------
// 各皮肤的品牌信息 / 默认值
// ---------------------------------------------------------------------------

export type SkinMeta = {
  key: Skin;
  /** 产品名 */
  name: Trio;
  /** 默认会议主题 */
  topic: Trio;
  /** 主色 (按钮 / 高亮) */
  accent: string;
  /** 顶部品牌色块上的文字 */
  badge: string;
  /** 默认会议号 */
  meetingId: string;
  /** 会议号前缀文案 */
  idLabel: Trio;
  /** 网格中的说话高亮色 */
  speaking: string;
};

export const SKIN_META: Record<Skin, SkinMeta> = {
  tencent: {
    key: 'tencent',
    name: [ '腾讯会议', '騰訊會議', 'Tencent Meeting' ],
    topic: [ '产品双周同步会', '產品雙週同步會', 'Product biweekly sync' ],
    accent: '#006EFF',
    badge: '腾讯会议',
    meetingId: '812 345 678',
    idLabel: [ '会议号', '會議號', 'Meeting ID' ],
    speaking: '#00C169',
  },
  zoom: {
    key: 'zoom',
    name: [ 'Zoom', 'Zoom', 'Zoom' ],
    topic: [ 'Weekly Product Sync', 'Weekly Product Sync', 'Weekly Product Sync' ],
    accent: '#2D8CFF',
    badge: 'zoom',
    meetingId: '928 4517 3062',
    idLabel: [ '会议 ID', '會議 ID', 'Meeting ID' ],
    speaking: '#00C169',
  },
  teams: {
    key: 'teams',
    name: [ 'Microsoft Teams', 'Microsoft Teams', 'Microsoft Teams' ],
    topic: [ 'Weekly Product Sync', 'Weekly Product Sync', 'Weekly Product Sync' ],
    accent: '#5B5FC7',
    badge: 'T',
    meetingId: '362 918 447 21',
    idLabel: [ '会议 ID', '會議 ID', 'Meeting ID' ],
    speaking: '#7F85F5',
  },
};

// ---------------------------------------------------------------------------
// 底部工具条按钮 (各产品的原生布局/文案不同, 因此按皮肤配置)
// ---------------------------------------------------------------------------

/** 图标名 -> index.tsx 中映射为具体图标组件 (lib 保持纯数据) */
export type IconKey = 'mic' | 'micOff' | 'cam' | 'camOff' | 'share' | 'shareOff' | 'people' | 'chat' | 'more' | 'rec' | 'hand' | 'leave' | 'info' | 'shield' | 'grid' | 'signal';

/** 按钮行为 */
export type ControlAction = 'mic' | 'cam' | 'share' | 'people' | 'chat' | 'more' | 'rec' | 'hand' | 'leave';

export type Control = {
  action: ControlAction;
  /** 默认 (未激活) 状态文案 */
  label: Trio;
  /** 激活状态文案 (如 Teams 已开麦显示「取消静音」) */
  labelActive?: Trio;
  /** 默认 (未激活) 状态图标: 麦克风/摄像头关闭时即用带斜杠的图标 */
  icon: IconKey;
  /** 激活状态图标 */
  iconActive?: IconKey;
  /** 该皮肤下此类按钮是否为危险色 (离开) */
  danger?: boolean;
};

const SHARE_OFF: Trio = [ '停止共享', '停止共享', 'Stop sharing' ];

export const SKIN_CONTROLS: Record<Skin, Control[]> = {
  tencent: [
    { action: 'mic', label: [ '麦克风', '麥克風', 'Mic' ], icon: 'micOff', iconActive: 'mic' },
    { action: 'cam', label: [ '视频', '視訊', 'Video' ], icon: 'camOff', iconActive: 'cam' },
    { action: 'share', label: [ '共享屏幕', '共享螢幕', 'Share' ], labelActive: SHARE_OFF, icon: 'share', iconActive: 'shareOff' },
    { action: 'people', label: [ '成员', '成員', 'Members' ], icon: 'people' },
    { action: 'chat', label: [ '聊天', '聊天', 'Chat' ], icon: 'chat' },
    { action: 'more', label: [ '更多', '更多', 'More' ], icon: 'more' },
    { action: 'leave', label: [ '离开会议', '離開會議', 'Leave' ], icon: 'leave', danger: true },
  ],
  zoom: [
    { action: 'mic', label: [ '音频', '音訊', 'Audio' ], icon: 'micOff', iconActive: 'mic' },
    { action: 'cam', label: [ '视频', '視訊', 'Video' ], icon: 'camOff', iconActive: 'cam' },
    { action: 'people', label: [ '参会者', '參會者', 'Participants' ], icon: 'people' },
    { action: 'chat', label: [ '聊天', '聊天', 'Chat' ], icon: 'chat' },
    { action: 'share', label: [ '共享屏幕', '共享螢幕', 'Share Screen' ], labelActive: SHARE_OFF, icon: 'share', iconActive: 'shareOff' },
    { action: 'rec', label: [ '录制', '錄製', 'Record' ], icon: 'rec' },
    { action: 'leave', label: [ '离开', '離開', 'Leave' ], icon: 'leave', danger: true },
  ],
  teams: [
    { action: 'chat', label: [ '聊天', '聊天', 'Chat' ], icon: 'chat' },
    { action: 'people', label: [ '人员', '人員', 'People' ], icon: 'people' },
    { action: 'hand', label: [ '举手', '舉手', 'Raise hand' ], labelActive: [ '放手', '放手', 'Lower hand' ], icon: 'hand' },
    { action: 'mic', label: [ '静音', '靜音', 'Mute' ], labelActive: [ '取消静音', '取消靜音', 'Unmute' ], icon: 'micOff', iconActive: 'mic' },
    { action: 'cam', label: [ '摄像头', '攝影機', 'Camera' ], icon: 'camOff', iconActive: 'cam' },
    { action: 'share', label: [ '共享', '共享', 'Share' ], labelActive: SHARE_OFF, icon: 'share', iconActive: 'shareOff' },
    { action: 'leave', label: [ '离开', '離開', 'Leave' ], icon: 'leave', danger: true },
  ],
};

/** 工具条分组分隔线 (插在该 action 之前): Zoom 的音频/视频 | 参会者/聊天 | 共享/录制 | 离开 */
export const SKIN_DIVIDERS: Record<Skin, ControlAction[]> = {
  tencent: [],
  zoom: [ 'people', 'share', 'leave' ],
  teams: [],
};

/** 顶部栏右侧的小图标按钮 (装饰用) */
export const SKIN_TOP_ICONS: Record<Skin, IconKey[]> = {
  tencent: [ 'info', 'signal' ],
  zoom: [ 'shield', 'info' ],
  teams: [ 'chat', 'people', 'more' ],
};

// ---------------------------------------------------------------------------
// 参会者
// ---------------------------------------------------------------------------

export const PARTICIPANTS_MIN = 2;
export const PARTICIPANTS_MAX = 12;

export type Participant = {
  id: string;
  name: string;
  /** 头像首字母 */
  initial: string;
  /** 头像色相 (hsl) */
  hue: number;
  isMe: boolean;
  host: boolean;
  muted: boolean;
  /** 画面偏暗 (模拟光线不佳的摄像头 / 关掉画面) */
  dim: boolean;
  /** 姓名被手动改过: 语言 / 人数变化时不再被自动生成的名字覆盖 */
  edited?: boolean;
};

const NAMES_ZH = [
  '张伟', '李娜', '王芳', '刘洋', '陈晨', '赵敏', '周杰', '吴倩',
  '孙鹏', '郑爽', '冯磊', '许静', '黄涛', '何丽', '马超', '林悦',
];
const NAMES_EN = [
  'Alex Chen', 'Maria Lopez', 'Sam Patel', 'Priya Nair', 'Tom Becker', 'Lucy Wang',
  'Diego Ruiz', 'Nina Kowalski', 'Kevin Zhao', 'Anna Schmidt', 'Raj Kumar', 'Ella Novak',
];

/** 线性同余伪随机 (固定种子 -> 稳定输出, 便于测试与「同样的会议」复现) */
export const lcg = (seed: number) => {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** 取名字首字符做头像文字 (英文名取首字母, 中文名取姓) */
export const initialOf = (name: string): string => {
  const n = (name || '').trim();
  if (!n) return '?';
  if (/^[\x20-\x7e]+$/.test(n)) return n.slice(0, 2).toUpperCase();
  return n.slice(0, 1);
};

export const useEnglishNames = (locale: string): boolean => locale === 'en';

/** 人数夹到允许区间 (非法值回退到下限) */
export const clampCount = (count: number): number =>
  Math.max(PARTICIPANTS_MIN, Math.min(PARTICIPANTS_MAX, Math.floor(count) || PARTICIPANTS_MIN));

/** 姓名去空白, 空字符串回退旧名 (手动清空不会导致匿名成员) */
export const normalizeName = (name: string, fallback: string): string => (name || '').trim() || fallback;

/** 生成参会者: 前 count-1 位是「别人」, 最后一位是「我」 */
export const pickParticipants = (count: number, locale: string, myName: string): Participant[] => {
  const total = clampCount(count);
  const en = useEnglishNames(locale);
  const pool = en ? NAMES_EN : NAMES_ZH;
  const rand = lcg(2024 + total * 131 + (en ? 17 : 0));
  const used = new Set<number>();
  const list: Participant[] = [];
  for (let i = 0; i < total - 1; i++) {
    let n = Math.floor(rand() * pool.length);
    let guard = 0;
    while (used.has(n) && guard++ < pool.length) n = (n + 1) % pool.length;
    used.add(n);
    const name = pool[n % pool.length];
    list.push({
      id: `p${i}`,
      name,
      initial: initialOf(name),
      hue: Math.floor(rand() * 360),
      isMe: false,
      host: i === 0,
      muted: rand() < 0.4,
      dim: rand() < 0.35,
    });
  }
  const me = normalizeName(myName, en ? 'Me' : '我');
  list.push({
    id: 'me',
    name: me,
    initial: initialOf(me),
    hue: 212,
    isMe: true,
    host: false,
    muted: false,
    dim: false,
  });
  return list;
};

/** 网格列数: 按人数排版, 尽量接近真实会议的 4:3 / 16:9 铺满效果 */
export const gridColumns = (count: number): number => {
  const n = Math.max(1, Math.floor(count) || 1);
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
};

// ---------------------------------------------------------------------------
// 计时 / 聊天 / 共享屏幕 的假数据
// ---------------------------------------------------------------------------

/** 秒 -> HH:MM:SS */
export const formatClock = (total: number): string => {
  const s = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

/** 时长文案 (皮肤不同: 腾讯「00:12:34」/ Zoom「00:12:34」/ Teams「已过 00:12:34」) */
export const clockText = (skin: Skin, locale: string, seconds: number): string => {
  const clock = formatClock(seconds);
  if (skin !== 'teams') return clock;
  return locale === 'en' ? `Elapsed ${clock}` : locale === 'zh-TW' ? `已過 ${clock}` : `已过 ${clock}`;
};

export const CHAT_LINES_MIN = 2;

const CHAT_POOL_ZH = [
  '我先线上听一下, 稍后补充。',
  '这个数据我这边再核对一下, 会后同步。',
  '收到, 辛苦!',
  '麻烦把文档发到群里, 谢谢。',
  '第 3 页的指标口径要和上一版对齐。',
  '我这边网络有点卡, 先关一下视频。',
  '这个需求下个迭代能排上吗?',
  '好的, 那我们按这个方案推进。',
  '不好意思刚断线了, 现在能听到吗?',
  '结论我记在纪要里, 会后发给大家。',
];
const CHAT_POOL_EN = [
  'Joining from the car — will keep it brief.',
  'Can someone share the doc?',
  'The numbers on slide 3 look off, let me re-check.',
  'Ack, will follow up after the call.',
  'My connection is unstable, camera off for now.',
  'Can we fit this into the next sprint?',
  'Sorry, just reconnected — can you hear me?',
  'I will drop the notes in the thread afterwards.',
  'Agreed, let us go with that plan.',
  'Sharing my screen in a second.',
];

export type ChatLine = { author: string; text: string; at: string };

/** 第 index 条假聊天 (循环取用, 便于「会议越开越久」的观感) */
export const chatLine = (index: number, locale: string, members: Participant[]): ChatLine => {
  const en = useEnglishNames(locale);
  const pool = en ? CHAT_POOL_EN : CHAT_POOL_ZH;
  const i = Math.max(0, Math.floor(index));
  const text = pool[i % pool.length];
  const who = members.filter((m) => !m.isMe);
  const author = who.length ? who[i % who.length].name : '';
  const mins = 3 + i * 2;
  const at = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  return { author, text, at };
};

/** 共享屏幕时展示的假幻灯片 */
export const SHARE_SLIDE: { title: Trio; bullets: Trio[]; bars: number[] } = {
  title: [ 'Q4 目标与进度', 'Q4 目標與進度', 'Q4 Goals and Progress' ],
  bullets: [
    [ '本季度重点: 稳定性与性能', '本季度重點: 穩定性與效能', 'Focus: stability and performance' ],
    [ '灰度发布覆盖 60% 用户', '灰度發布覆蓋 60% 使用者', 'Canary rollout covers 60% of users' ],
    [ '下阶段: 打通数据看板', '下階段: 打通資料看板', 'Next: unify the metrics dashboard' ],
  ],
  bars: [ 72, 48, 91, 35, 64, 80 ],
};
