// 对方默认头像: 项目 Logo (打包进产物, 不联网; 用户可自行上传替换)
import logoUrl from '../../../assets/logo.png';

// 聊天生成器: 平台样式表 / 消息类型 / 默认值键名 / 示例对话
//
// 说明: 各平台样式为「风格化模拟」——取该平台具有辨识度的配色、气泡圆角、
// 头像形状、状态栏与标题栏等特征, 便于生成一眼可辨的对话截图;
// 并非逐像素还原官方客户端 (官方素材受版权保护, 本工具不内置任何官方图片资源)。
// 唯一内置的图片是项目自身 Logo (对方默认头像, 见 AVATAR_IN_DEFAULT)。

// 布局两族:
//   - mobile  + bubble: 手机屏 (状态栏 + 标题栏 + 气泡列表 + 底部输入栏), 如微信 / QQ / WhatsApp
//   - desktop + plain : 桌面客户端 (标题栏 + 消息流, 无气泡), 如 Slack / Discord

/** 平台标识 (顺序即 Tab 顺序) */
export type PlatformId =
  | 'wechat' | 'qq' | 'slack' | 'telegram' | 'discord' | 'whatsapp' | 'line' | 'dingtalk' | 'feishu';

/** 消息类型: 文字 / 图片 / 语音 / 时间分隔 / 微信红包 / 微信转账 (后两者仅微信展示) */
export type ChatMessageType = 'text' | 'image' | 'voice' | 'time' | 'redpacket' | 'transfer';

/** 消息方向: in = 对方 (左侧), out = 我 (右侧) */
export type ChatSide = 'in' | 'out';

/** 已读回执样式: 无 / 单勾 / 双勾 / 双勾高亮 (已读) */
export type ChatReceipt = 'none' | 'check' | 'double' | 'read';

/** 状态栏系统风格: iOS (灵动岛, 百分比在电池内) / 安卓 (居中挖孔, 百分比在电池外) */
export type ChatSystem = 'ios' | 'android';

/** 状态栏网络类型 */
export type ChatNetwork = 'wifi' | '3G' | '4G' | '5G';

/** 导出倍率 */
export type ChatScale = 1 | 2 | 3;

/** 一条消息 */
export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  /** 发送方: in = 对方 (左) / out = 我 (右); type = 'time' 时忽略 */
  side: ChatSide;
  /** 昵称 (为空时用会话里的默认昵称) */
  name: string;
  /** 文字内容 / 时间分隔文案 */
  text: string;
  /** 图片 data URL (type = 'image') */
  image: string;
  /** 转账金额 (type = 'transfer', 纯数字文本, 展示为 ￥金额) */
  amount: string;
  /** 语音时长, 秒 (type = 'voice') */
  duration: number;
  /** 消息时间 HH:MM (为空则不显示) */
  time: string;
}

/** 会话文档 (页面全部状态) */
export interface ChatDoc {
  platform: PlatformId;
  title: string;
  subtitle: string;
  system: ChatSystem;
  statusTime: string;
  battery: number;
  charging: boolean;
  signal: number;
  network: ChatNetwork;
  showInputBar: boolean;
  /** 气泡布局下是否在气泡上方显示昵称 (Slack / Discord 始终显示) */
  showNames: boolean;
  /** 消息免打扰: 标题右侧显示禁音图标 */
  mute: boolean;
  /** 对方昵称 */
  nameIn: string;
  /** 我的昵称 */
  nameOut: string;
  /** 对方头像 (data URL, 空 = 用昵称首字) */
  avatarIn: string;
  /** 我的头像 (data URL, 空 = 用昵称首字) */
  avatarOut: string;
  messages: ChatMessage[];
}

/** 气泡样式 */
export interface BubbleTheme {
  /** 气泡背景色 (plain 布局下不使用) */
  bg: string;
  /** 文字颜色 */
  color: string;
  /** 圆角 (px) */
  radius: number;
  /** 是否带小尖角 (如微信 / WhatsApp) */
  tail: boolean;
  /** 描边 (部分平台的白气泡有浅描边, 空字符串 = 无) */
  border: string;
}

/** 平台视觉样式 */
export interface ChatTheme {
  id: PlatformId;
  /** 平台名 (品牌名, 三语一致, 不翻译) */
  label: string;
  /** 布局: 手机屏 / 桌面窗口 */
  layout: 'mobile' | 'desktop';
  /** 消息样式: 气泡 / 纯消息流 */
  bubble: 'bubble' | 'plain';
  /** 对齐: split = 对方左我在右; left = 双方均左对齐 (Slack / Discord 原生样式) */
  align: 'split' | 'left';
  /** 屏幕宽度 (px) */
  width: number;
  /** 聊天区背景 */
  background: string;
  /** 背景纹理 (CSS background-image, 空 = 无) */
  pattern: string;
  /** 手机状态栏 (desktop 布局为 null); 时间在左/右由 doc.system 决定 (iOS 在左, 安卓在右) */
  statusBar: { bg: string; color: string } | null;
  /** 顶部标题栏 */
  header: {
    bg: string; color: string; subColor: string; border: string;
    /** 标题是否居中 (微信 / QQ / LINE / 钉钉 / 飞书居中, WhatsApp / Telegram / 桌面端靠左) */
    center: boolean;
    /** 是否展示副标题 (微信标题栏没有副标题) */
    subtitle: boolean;
    back: boolean;
  };
  incoming: BubbleTheme;
  outgoing: BubbleTheme;
  /** 头像形状: 圆角 px (直径一半为圆形) */
  avatar: { radius: number; size: number; bg: string; color: string };
  /** 时间 / 状态等次要文字颜色 */
  meta: string;
  /** 时间是否显示在气泡右下角 (WhatsApp / Telegram / LINE / QQ) */
  timeInBubble: boolean;
  /** 已读回执样式 */
  receipt: ChatReceipt;
  /** plain 布局下昵称颜色 */
  nameColor: string;
  /** 底部输入栏 (desktop 布局或不需要时为 null); pill = 输入框底色 */
  inputBar: { bg: string; color: string; border: string; pill: string } | null;
  /** 左侧边栏 (Slack) */
  sidebar?: { bg: string; color: string; active: string; items: string[] };
  /** 窗口标题栏 (Discord) */
  titleBar?: { bg: string; color: string; dots: string[] };
  /** 字体栈 */
  font: string;
}

/** 系统字体栈 (聊天截图以「像官方」为准, 统一用系统字体) */
const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif';
/** 桌面客户端字体栈 */
const FONT_DESKTOP = '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, Arial, sans-serif';

/** 细点背景纹理 (浅色平台通用) */
const DOTS_LIGHT = 'radial-gradient(rgba(0, 0, 0, 0.045) 1px, transparent 1px)';
/** 细点背景纹理 (深色平台通用) */
const DOTS_DARK = 'radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px)';

/** 平台样式表 (顺序即 Tab 顺序: 微信 / QQ / Slack / Telegram / Discord / WhatsApp / LINE / 钉钉 / 飞书) */
export const PLATFORMS: ChatTheme[] = [
  {
    id: 'wechat',
    label: '微信',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#ededed',
    pattern: '',
    statusBar: { bg: '#ededed', color: '#000000' },
    header: { bg: '#ededed', color: '#000000', subColor: '#7f7f7f', border: '#e0e0e0', center: true, subtitle: false, back: true },
    incoming: { bg: '#ffffff', color: '#000000', radius: 4, tail: true, border: '' },
    outgoing: { bg: '#95ec69', color: '#000000', radius: 4, tail: true, border: '' },
    avatar: { radius: 4, size: 40, bg: '#c9c9c9', color: '#ffffff' },
    meta: '#b2b2b2',
    timeInBubble: false,
    receipt: 'none',
    nameColor: '#576b95',
    inputBar: { bg: '#f7f7f7', color: '#7f7f7f', border: '#e0e0e0', pill: '#ffffff' },
    font: FONT_SANS,
  },
  {
    id: 'qq',
    label: 'QQ',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#f2f3f5',
    pattern: '',
    statusBar: { bg: '#12b7f5', color: '#ffffff' },
    header: { bg: '#12b7f5', color: '#ffffff', subColor: 'rgba(255, 255, 255, 0.82)', border: '', center: true, subtitle: true, back: true },
    incoming: { bg: '#ffffff', color: '#222222', radius: 12, tail: false, border: '' },
    outgoing: { bg: '#12b7f5', color: '#ffffff', radius: 12, tail: false, border: '' },
    avatar: { radius: 50, size: 38, bg: '#12b7f5', color: '#ffffff' },
    meta: '#a5a9b0',
    timeInBubble: true,
    receipt: 'double',
    nameColor: '#12b7f5',
    inputBar: { bg: '#ffffff', color: '#a5a9b0', border: '#e5e6eb', pill: '#f2f3f5' },
    font: FONT_SANS,
  },
  {
    id: 'slack',
    label: 'Slack',
    layout: 'desktop',
    bubble: 'plain',
    align: 'left',
    width: 520,
    background: '#ffffff',
    pattern: '',
    statusBar: null,
    header: { bg: '#ffffff', color: '#1d1c1d', subColor: '#616061', border: '#e8e8e8', center: false, subtitle: true, back: false },
    incoming: { bg: 'transparent', color: '#1d1c1d', radius: 0, tail: false, border: '' },
    outgoing: { bg: 'transparent', color: '#1d1c1d', radius: 0, tail: false, border: '' },
    avatar: { radius: 4, size: 36, bg: '#4a154b', color: '#ffffff' },
    meta: '#616061',
    timeInBubble: false,
    receipt: 'none',
    nameColor: '#1264a3',
    inputBar: { bg: '#ffffff', color: '#616061', border: '#dddddd', pill: '#ffffff' },
    sidebar: {
      bg: '#3f0e40',
      color: 'rgba(255, 255, 255, 0.72)',
      active: '#1164a3',
      items: ['# 产品讨论', '# 前端', '# 随机闲聊', '# 发布通知'],
    },
    font: FONT_DESKTOP,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#cfdfe8',
    pattern: DOTS_LIGHT,
    statusBar: { bg: '#517da2', color: '#ffffff' },
    header: { bg: '#517da2', color: '#ffffff', subColor: 'rgba(255, 255, 255, 0.82)', border: '', center: false, subtitle: true, back: true },
    incoming: { bg: '#ffffff', color: '#000000', radius: 12, tail: true, border: '' },
    outgoing: { bg: '#effdde', color: '#000000', radius: 12, tail: true, border: '' },
    avatar: { radius: 50, size: 40, bg: '#517da2', color: '#ffffff' },
    meta: '#8d9499',
    timeInBubble: true,
    receipt: 'double',
    nameColor: '#517da2',
    inputBar: { bg: '#ffffff', color: '#9aa4ab', border: '#d9e2e8', pill: '#f1f3f5' },
    font: FONT_SANS,
  },
  {
    id: 'discord',
    label: 'Discord',
    layout: 'desktop',
    bubble: 'plain',
    align: 'left',
    width: 520,
    background: '#313338',
    pattern: '',
    statusBar: null,
    header: { bg: '#313338', color: '#f2f3f5', subColor: '#949ba4', border: '#26272b', center: false, subtitle: true, back: false },
    incoming: { bg: 'transparent', color: '#dbdee1', radius: 0, tail: false, border: '' },
    outgoing: { bg: 'transparent', color: '#dbdee1', radius: 0, tail: false, border: '' },
    avatar: { radius: 50, size: 36, bg: '#5865f2', color: '#ffffff' },
    meta: '#949ba4',
    timeInBubble: false,
    receipt: 'none',
    nameColor: '#f2f3f5',
    inputBar: { bg: '#313338', color: '#6d6f78', border: '', pill: '#383a40' },
    titleBar: { bg: '#1e1f22', color: '#dbdee1', dots: ['#f23f43', '#f0b232', '#23a55a'] },
    font: FONT_DESKTOP,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#efeae2',
    pattern: DOTS_LIGHT,
    statusBar: { bg: '#075e54', color: '#ffffff' },
    header: { bg: '#075e54', color: '#ffffff', subColor: 'rgba(255, 255, 255, 0.82)', border: '', center: false, subtitle: true, back: true },
    incoming: { bg: '#ffffff', color: '#111b21', radius: 8, tail: true, border: '' },
    outgoing: { bg: '#d9fdd3', color: '#111b21', radius: 8, tail: true, border: '' },
    avatar: { radius: 50, size: 38, bg: '#075e54', color: '#ffffff' },
    meta: '#667781',
    timeInBubble: true,
    receipt: 'read',
    nameColor: '#06cf9c',
    inputBar: { bg: '#f0f2f5', color: '#8696a0', border: '#e9edef', pill: '#ffffff' },
    font: FONT_SANS,
  },
  {
    id: 'line',
    label: 'LINE',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#8fb6dd',
    pattern: DOTS_DARK,
    statusBar: { bg: '#06c755', color: '#ffffff' },
    header: { bg: '#06c755', color: '#ffffff', subColor: 'rgba(255, 255, 255, 0.85)', border: '', center: true, subtitle: true, back: true },
    incoming: { bg: '#ffffff', color: '#2b2b2b', radius: 16, tail: true, border: '' },
    outgoing: { bg: '#8ce763', color: '#2b2b2b', radius: 16, tail: true, border: '' },
    avatar: { radius: 50, size: 38, bg: '#06c755', color: '#ffffff' },
    meta: '#e9f2fb',
    timeInBubble: false,
    receipt: 'none',
    nameColor: '#33557f',
    inputBar: { bg: '#ffffff', color: '#9b9b9b', border: '#dfe3e6', pill: '#f7f7f7' },
    font: FONT_SANS,
  },
  {
    id: 'dingtalk',
    label: '钉钉',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#f4f5f7',
    pattern: '',
    statusBar: { bg: '#3296fa', color: '#ffffff' },
    header: { bg: '#3296fa', color: '#ffffff', subColor: 'rgba(255, 255, 255, 0.82)', border: '', center: true, subtitle: true, back: true },
    incoming: { bg: '#ffffff', color: '#171a1d', radius: 8, tail: false, border: '#e8eaed' },
    outgoing: { bg: '#3296fa', color: '#ffffff', radius: 8, tail: false, border: '' },
    avatar: { radius: 6, size: 40, bg: '#3296fa', color: '#ffffff' },
    meta: '#8a9099',
    timeInBubble: false,
    receipt: 'check',
    nameColor: '#3296fa',
    inputBar: { bg: '#ffffff', color: '#8a9099', border: '#e8eaed', pill: '#f5f6f7' },
    font: FONT_SANS,
  },
  {
    id: 'feishu',
    label: '飞书',
    layout: 'mobile',
    bubble: 'bubble',
    align: 'split',
    width: 375,
    background: '#ffffff',
    pattern: '',
    statusBar: { bg: '#ffffff', color: '#1f2329' },
    header: { bg: '#ffffff', color: '#1f2329', subColor: '#8f959e', border: '#e4e6eb', center: true, subtitle: true, back: true },
    incoming: { bg: '#f2f3f5', color: '#1f2329', radius: 10, tail: false, border: '' },
    outgoing: { bg: '#3370ff', color: '#ffffff', radius: 10, tail: false, border: '' },
    avatar: { radius: 50, size: 40, bg: '#3370ff', color: '#ffffff' },
    meta: '#8f959e',
    timeInBubble: false,
    receipt: 'check',
    nameColor: '#3370ff',
    inputBar: { bg: '#ffffff', color: '#8f959e', border: '#e4e6eb', pill: '#f2f3f5' },
    font: FONT_SANS,
  },
];

/** 平台下拉 / Tab 选项 (label 用品牌名, 三语一致) */
export const PLATFORM_IDS: PlatformId[] = PLATFORMS.map((p) => p.id);

/** 消息类型选项 */
export const MESSAGE_TYPES: ChatMessageType[] = ['text', 'image', 'voice', 'time', 'redpacket', 'transfer'];

/** 微信专属消息类型: 其他平台展示时退化为普通文字 (不作假) */
export const WECHAT_PACKET_TYPES: ChatMessageType[] = ['redpacket', 'transfer'];

/** 导出倍率选项 */
export const SCALES: ChatScale[] = [1, 2, 3];

/** 状态栏系统选项 */
export const SYSTEMS: ChatSystem[] = ['ios', 'android'];

/** 状态栏网络选项 */
export const NETWORKS: ChatNetwork[] = ['wifi', '3G', '4G', '5G'];

// ==================== 限制 ====================

/** 单条消息文字上限 (预览与导出都会随之变长, 限制避免内存与体积失控) */
export const TEXT_MAX = 500;
/** 聊天标题 / 副标题上限 */
export const TITLE_MAX = 30;
/** 昵称上限 */
export const NAME_MAX = 16;
/** 时间分隔文案上限 */
export const TIME_LABEL_MAX = 40;
/** 消息条数上限 */
export const MESSAGES_MAX = 80;
/** 转账金额上限 (字符数) */
export const AMOUNT_MAX = 12;
/** 红包祝福语上限 (字符数, 与微信红包的 25 字一致) */
export const REDPACKET_TEXT_MAX = 25;
/** 语音时长 (秒) 范围 */
export const DURATION_MIN = 1;
export const DURATION_MAX = 99;
/** 新建语音消息的默认时长 (秒) */
export const DURATION_DEFAULT = 5;
/** 电量 (%) 范围 */
export const BATTERY_MIN = 0;
export const BATTERY_MAX = 100;
/** 信号格数范围 (1~4 格) */
export const SIGNAL_MIN = 1;
export const SIGNAL_MAX = 4;
/** 缓存图片体积上限 (data URL 字符数, 约 3MB) */
export const IMAGE_MAX_CHARS = 3 * 1024 * 1024;

// ==================== localStorage 键名 ====================

/** 默认平台 */
export const KEY_PLATFORM = 'chat-generator.platform';
/** 默认聊天标题 */
export const KEY_TITLE = 'chat-generator.title';
/** 默认聊天副标题 */
export const KEY_SUBTITLE = 'chat-generator.subtitle';
/** 默认导出倍率 */
export const KEY_SCALE = 'chat-generator.scale';
/** 默认手机系统 */
export const KEY_SYSTEM = 'chat-generator.system';
/** 默认状态栏时间 */
export const KEY_STATUS_TIME = 'chat-generator.statusTime';
/** 默认电量 */
export const KEY_BATTERY = 'chat-generator.battery';
/** 默认充电中 */
export const KEY_CHARGING = 'chat-generator.charging';
/** 默认信号格数 */
export const KEY_SIGNAL = 'chat-generator.signal';
/** 默认网络类型 */
export const KEY_NETWORK = 'chat-generator.network';
/** 默认显示底部输入栏 */
export const KEY_SHOW_INPUT = 'chat-generator.showInputBar';
/** 默认显示昵称 */
export const KEY_SHOW_NAMES = 'chat-generator.showNames';
/** 默认免打扰 */
export const KEY_MUTE = 'chat-generator.mute';
/** 默认我的昵称 */
export const KEY_NAME_OUT = 'chat-generator.nameOut';
/** 默认对方昵称 */
export const KEY_NAME_IN = 'chat-generator.nameIn';

// ==================== 默认值 ====================

export const PLATFORM_DEFAULT: PlatformId = 'wechat';
export const TITLE_DEFAULT = '文件传输助手';
export const SUBTITLE_DEFAULT = '在线';
export const SCALE_DEFAULT: ChatScale = 2;
export const SYSTEM_DEFAULT: ChatSystem = 'ios';
export const STATUS_TIME_DEFAULT = '9:41';
export const BATTERY_DEFAULT = 82;
export const CHARGING_DEFAULT = false;
export const SIGNAL_DEFAULT = 4;
export const NETWORK_DEFAULT: ChatNetwork = 'wifi';
export const SHOW_INPUT_DEFAULT = true;
export const SHOW_NAMES_DEFAULT = false;
export const MUTE_DEFAULT = false;
export const NAME_IN_DEFAULT = 'bluefrog';
export const NAME_OUT_DEFAULT = '我';

/** 对方默认头像 (项目 Logo, 由打包器生成 URL, 导出 PNG 时同源可读) */
export const AVATAR_IN_DEFAULT = logoUrl;
/** 微信红包默认祝福语 / 说明文案, 转账说明文案与默认金额 */
export const REDPACKET_TEXT_DEFAULT = '恭喜发财，大吉大利';
export const AMOUNT_DEFAULT = '100.00';

/** 状态栏时间格式 (与官方一致: 上午 9:41 / 9:41) */
export const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** 示例图片 (内置 SVG, 不引入任何外部资源; 用户可替换为自己上传的图片) */
export const SAMPLE_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">' +
  '<rect width="240" height="160" fill="#dfe3e8"/>' +
  '<rect x="16" y="16" width="208" height="128" rx="8" fill="#f4f6f8" stroke="#c8ced6"/>' +
  '<circle cx="72" cy="66" r="16" fill="#b8c0c9"/>' +
  '<path d="M32 128l48-44 34 30 30-24 64 56z" fill="#c8d0d8"/>' +
  '<text x="120" y="86" font-family="sans-serif" font-size="14" fill="#8b939c" text-anchor="middle">示例图片</text>' +
  '</svg>'
)}`;

/**
 * 平台示例对话: 首次打开 (或点「载入示例」) 时载入, 便于快速看到效果。
 * 内容为示例数据 (不翻译): 时间分隔 / 双方文字 / 图片 / 语音各一条。
 */
export const SAMPLE_MESSAGES: Array<{ type: ChatMessageType; side?: ChatSide; text?: string; duration?: number; time?: string }> = [
  { type: 'time', text: '2026年10月9日 下午 4:20' },
  { type: 'text', side: 'in', text: '在吗? 帮忙看下这个页面的间距 👀', time: '16:20' },
  { type: 'text', side: 'out', text: '在的, 稍等我看一眼', time: '16:20' },
  { type: 'image', side: 'in', time: '16:21' },
  { type: 'text', side: 'out', text: '这块 padding 少了 8px, 顶部再加一点留白就行', time: '16:22' },
  { type: 'voice', side: 'in', duration: 6, time: '16:23' },
  { type: 'text', side: 'out', text: '收到, 我改完发你 🚀', time: '16:24' },
];
