// QrDecode 界面数据: 参数候选 / 内容类型与字段显示名 / 本地存储键
/** 反色策略 (对应 jsQR 的 inversionAttempts) */
export type InversionMode = 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';

/** 数据段类型 (jsQR chunks 的 type) */
export type ChunkKind = 'numeric' | 'alphanumeric' | 'byte' | 'kanji' | 'eci' | 'unknown';

/** 内容类型 (按协议识别出的类别) */
export type PayloadKind = 'url' | 'wifi' | 'vcard' | 'mecard' | 'mailto' | 'tel' | 'sms' | 'geo' | 'otpauth' | 'text';

/** 默认设置的本地存储键 (设置中心与工具页共用) */
export const DEFAULTS_STORAGE_KEY = 'qr-decode:defaults';

/** 反色策略候选 (对应 jsQR 的 inversionAttempts) */
export const INVERSION_OPTIONS: { value: InversionMode; label: string }[] = [
  { value: 'attemptBoth', label: '自动尝试反色 (推荐)' },
  { value: 'dontInvert', label: '只按原色解析' },
  { value: 'onlyInvert', label: '只按反色解析 (深底浅码)' },
  { value: 'invertFirst', label: '优先按反色解析' },
];

export const INVERSION_DEFAULT: InversionMode = 'attemptBoth';

/** 解码前图片缩放上限候选 (0 = 不缩放; 大图缩小后解析更快, 也能提高成功率) */
export const MAX_EDGE_OPTIONS = [ 0, 800, 1200, 1600, 2400 ];

export const MAX_EDGE_DEFAULT = 1600;

/** 历史记录条数候选 */
export const HISTORY_MAX_OPTIONS = [ 5, 10, 20, 50 ];

export const HISTORY_MAX_DEFAULT = 10;

/** 预览图最大高度 (px) */
export const PREVIEW_MAX_HEIGHT = 360;

/** 数据段类型显示名 */
export const CHUNK_LABELS: Record<ChunkKind, string> = {
  numeric: '数字',
  alphanumeric: '字母数字',
  byte: '字节',
  kanji: '日文汉字',
  eci: 'ECI 字符集',
  unknown: '其它',
};

/** 内容类型显示名 */
export const KIND_LABELS: Record<PayloadKind, string> = {
  url: '网址',
  wifi: 'WiFi 配网',
  vcard: '名片 (vCard)',
  mecard: '名片 (MECARD)',
  mailto: '邮件地址',
  tel: '电话号码',
  sms: '短信',
  geo: '坐标位置',
  otpauth: '动态口令 (OTP)',
  text: '纯文本',
};

/**
 * 内容字段显示名 (key 为协议里的原始键名, 大小写敏感; 未命中时原样显示)
 */
export const FIELD_LABELS: Record<string, string> = {
  // WiFi / MECARD 配网
  T: '加密方式',
  S: 'SSID',
  P: '密码',
  H: '隐藏网络',
  N: '姓名',
  // vCard
  FN: '姓名',
  ORG: '组织',
  TITLE: '职位',
  TEL: '电话',
  EMAIL: '邮箱',
  URL: '网址',
  ADR: '地址',
  NOTE: '备注',
  VERSION: '版本',
  BDAY: '生日',
  // mailto / tel / sms / geo
  address: '收件人',
  number: '号码',
  body: '正文',
  subject: '主题',
  cc: '抄送',
  bcc: '密送',
  lat: '纬度',
  lng: '经度',
  alt: '海拔',
  q: '查询',
  // otpauth
  type: '类型',
  issuer: '签发方',
  account: '账号',
  secret: '密钥',
  digits: '位数',
  period: '周期 (秒)',
  algorithm: '算法',
  // 网址
  url: '网址',
};
