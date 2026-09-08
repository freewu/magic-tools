/**
 * 密码生成与强度检测 (零依赖, 纯逻辑)
 * - genPassword: 使用 crypto.getRandomValues 安全随机生成
 * - passwordStrength: 启发式强度评估 (字符集熵 + 常见弱口令库 + 连续重复惩罚)
 */

export interface PwOptions {
  length: number;        // 长度 (自动收敛到 4~128)
  upper: boolean;        // 含大写字母
  lower: boolean;        // 含小写字母
  digit: boolean;        // 含数字
  symbol: boolean;       // 含符号
  excludeAmbiguous: boolean; // 排除易混淆字符 (IOlo01 等)
}

export const PW_LENGTH_MIN = 4;
export const PW_LENGTH_MAX = 128;

// 易混淆字符 (按标准惯例移除)
const AMBIGUOUS = new Set([ 'I', 'O', 'l', 'o', '0', '1' ]);

const CHARSETS: Record<'upper' | 'lower' | 'digit' | 'symbol', string> = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{}:,.?/|~',
};

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

/** 0 <= n < max 的安全随机整数 (crypto 不可用时回退 Math.random) */
function randInt(max: number): number {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } }).crypto;
  const arr = new Uint32Array(1);
  if (c?.getRandomValues) {
    c.getRandomValues(arr);
  } else {
    arr[0] = Math.floor(Math.random() * 0xffffffff);
  }
  return arr[0] % max;
}

/** Fisher-Yates 洗牌 (安全随机) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 生成随机密码
 * 默认行为: 至少选中一个大类但池为空时忽略该类; 全部关闭时回退为小写+数字
 */
export function genPassword(opts: Partial<PwOptions> = {}): string {
  const length = clamp(Math.round(opts.length ?? 16), PW_LENGTH_MIN, PW_LENGTH_MAX);
  let upper = opts.upper !== false;
  let lower = opts.lower !== false;
  let digit = opts.digit !== false;
  let symbol = opts.symbol !== false;
  const excludeAmbiguous = opts.excludeAmbiguous !== false;

  const pick = (key: 'upper' | 'lower' | 'digit' | 'symbol'): string => {
    let s = CHARSETS[key];
    if (excludeAmbiguous) s = [...s].filter((c) => !AMBIGUOUS.has(c)).join('');
    return s;
  };

  let pool = '';
  if (upper) pool += pick('upper');
  if (lower) pool += pick('lower');
  if (digit) pool += pick('digit');
  if (symbol) pool += pick('symbol');

  // 全部字符集都被关闭/排除光时回退为 小写+数字
  if (pool === '') {
    upper = false;
    lower = true;
    digit = true;
    symbol = false;
    pool = pick('lower') + pick('digit');
  }

  const parts: string[] = [];
  // 保证每个选中的字符集至少出现一次
  const each = (key: 'upper' | 'lower' | 'digit' | 'symbol', on: boolean) => {
    if (on) {
      const s = pick(key);
      if (s) parts.push(s[randInt(s.length)]);
    }
  };
  each('upper', upper);
  each('lower', lower);
  each('digit', digit);
  each('symbol', symbol);

  while (parts.length < length) parts.push(pool[randInt(pool.length)]);

  const pw = shuffle(parts).join('');
  // 长度收敛: 若因最少字符要求超出? 不会超出; 若超出则截断
  return pw.slice(0, length);
}

/* ---------------- 强度检测 ---------------- */

export type StrengthKey = 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';

export interface StrengthLevel {
  score: number;         // 0~4
  key: StrengthKey;
  label: string;
  color: string;
  desc: string;
}

export const STRENGTH_LEVELS: StrengthLevel[] = [
  { score: 0, key: 'very-weak', label: '极弱', color: '#ff4d4f', desc: '极易被暴力/字典破解, 请勿使用' },
  { score: 1, key: 'weak', label: '弱', color: '#fa8c16', desc: '容易被破解, 建议增加长度与字符类型' },
  { score: 2, key: 'medium', label: '一般', color: '#fadb14', desc: '对普通场景可用, 敏感账户建议加强' },
  { score: 3, key: 'strong', label: '强', color: '#52c41a', desc: '当前配置较难被暴力破解' },
  { score: 4, key: 'very-strong', label: '极强', color: '#1677ff', desc: '按现有算力需极长时间, 安全性很高' },
];

// 常见弱口令 (小写/常见字符替换后比对)
const BLACKLIST = [
  'password', 'passw0rd', 'password1', 'password123', 'pass1234', '123456', '1234567',
  '12345678', '123456789', '1234567890', '12345', '1234', '123', '123123', '123321',
  '112233', '121212', '111111', '11111111', '000000', '666666', '888888', '999999',
  '123456a', 'a123456', 'qwerty', 'qwertyuiop', 'qwerty123', '1q2w3e4r', '1qaz2wsx',
  'zaq12wsx', 'zxcvbnm', 'asdfghjkl', 'asdf', 'abc', 'abcd', 'abc123', 'abc123456',
  'abcdef', 'abcdefg', 'abcdefgh', 'abcdefghij', 'aaaaaa', 'admin', 'administrator',
  'root', 'toor', 'guest', 'test', 'testing', 'default', 'welcome', 'welcome1',
  'iloveyou', 'iloveu', 'letmein', 'fuckyou', 'monkey', 'dragon', 'master', 'superman',
  'football', 'baseball', 'shadow', 'princess', 'sunshine', 'trustno1', 'mustang',
  'batman', 'samsung', 'naruto', 'photoshop', 'qazwsx', 'hello', 'hello123',
  'love', 'lovely', 'jesus', 'whatever', 'woaini', 'woshishui', 'aini1314',
  '5201314', '1314520', '7758521', 'taobao', 'qq123456', 'woyaojia', 'wang123',
  'zhang123', 'li123456', 'chen123', 'yang123', 'zhao123', 'liu123', 'china123',
  'chinese', 'beijing2008', '520520', 'woaini520', '19931013', '19891230', '520131',
  'apple', 'google', 'microsoft', 'qq123', 'woaini1314', 'gaia', 'daniel',
];

// 常见连续序列 (已包含进黑名单的部分不重复列出)
const SEQUENCES: string[] = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'abcdefghijklmnopqrstuvwxyz',
  'abcdefghijklmnop', '1234567890', '0987654321', '87654321',
];

/**
 * 上下文感知的 leet 还原:
 * - 符号类 (@ $ !) 恒还原为字母
 * - 数字类 (0/1/3) 仅当其前后都是字母时还原 (w0rd -> word),
 *   作为后缀/纯数字时保持原样 (123456 不受影响)
 */
function leetDecode(pw: string): string {
  const lower = pw.toLowerCase();
  const isLetter = (c: string | undefined): boolean => !!c && /[a-z]/.test(c);
  const map: Record<string, string> = { '@': 'a', '$': 's', '!': 'i', '0': 'o', '1': 'i', '3': 'e' };
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const mapped = map[ch];
    if (mapped) {
      const isDigitLike = ch === '0' || ch === '1' || ch === '3';
      const insideWord = isLetter(lower[i - 1]) && isLetter(lower[i + 1]);
      if (!isDigitLike || insideWord) {
        out += mapped;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

/** 字符串是否包含任一序列中长度 >=5 的连续片段 (如 qwerty / 12345) */
function hasSequence(s: string): boolean {
  for (const seq of SEQUENCES) {
    for (let i = 0; i + 5 <= seq.length; i++) {
      if (s.includes(seq.slice(i, i + 5))) return true;
    }
  }
  return false;
}

/**
 * 是否命中常见弱口令库
 * 三种候选: 原始小写 / leet 还原 / 去掉尾部数字与符号后的词根 (password123 -> password)
 */
function matchWeakList(pw: string): boolean {
  const raw = pw.toLowerCase();
  const decoded = leetDecode(pw);
  const stem = decoded.replace(/[^a-z]+$/, '');
  return BLACKLIST.includes(raw) || BLACKLIST.includes(decoded) || (stem.length >= 3 && BLACKLIST.includes(stem));
}

export interface PwCheck {
  ok: boolean;
  label: string;
}

export interface StrengthResult {
  score: number;            // 0~4
  level: StrengthLevel;
  entropy: number;          // 估算熵 (bit)
  crackedList: boolean;     // 命中常见弱口令库
  maxRun: number;           // 最长连续重复字符长度
  foundSequence: boolean;   // 命中键盘/字母/数字连续序列
  checks: PwCheck[];
  onlineSec: number;        // 按每秒 1000 次在线猜测的预计破解秒数
  offlineSec: number;       // 按每秒 1e12 次离线猜测的预计破解秒数
}

export function passwordStrength(pw: string): StrengthResult {
  const empty: StrengthResult = {
    score: 0, level: STRENGTH_LEVELS[0], entropy: 0, crackedList: false,
    maxRun: 0, foundSequence: false, checks: [], onlineSec: 0, offlineSec: 0,
  };
  if (!pw) return empty;

  const len = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasCjk = /[\u4e00-\u9fff]/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9\u4e00-\u9fff]/.test(pw);

  // 估算字符池大小
  let pool = 0;
  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasDigit) pool += 10;
  if (hasSymbol) pool += 33;
  if (hasCjk) pool += 2000; // 常用汉字近似
  if (pool === 0) pool = 1;
  const entropy = len * Math.log2(pool);

  // 最长连续重复
  let maxRun = 0;
  let run = 1;
  for (let i = 1; i < len; i++) {
    if (pw[i] === pw[i - 1]) run += 1;
    else { if (run > maxRun) maxRun = run; run = 1; }
  }
  if (run > maxRun) maxRun = run;

  const crackedList = matchWeakList(pw);
  const foundSequence = hasSequence(pw.toLowerCase()) || hasSequence(leetDecode(pw));

  // 评分
  let score: number;
  if (len < 4) score = 0;
  else if (crackedList) score = 0;
  else if (entropy >= 90) score = 4;
  else if (entropy >= 60) score = 3;
  else if (entropy >= 42) score = 2;
  else if (entropy >= 26) score = 1;
  else score = 0;

  if (foundSequence) score = Math.min(score, 1);
  if (maxRun >= 3) score = Math.max(0, score - 1);
  if (len < 8) score = Math.min(score, 1);

  const level = STRENGTH_LEVELS[clamp(score, 0, 4)];

  // 破解时间估算 (熵位 → 秒)
  const pow2 = (bits: number): number => (bits >= 120 ? Infinity : Math.pow(2, bits));
  const onlineSec = pow2(entropy) / 1000;
  const offlineSec = pow2(entropy) / 1e12;

  const checks: PwCheck[] = [
    { ok: len >= 12, label: len >= 12 ? `长度 ${len} (推荐 ≥12)` : `长度 ${len} (推荐 ≥12)` },
    { ok: hasLower && hasUpper, label: hasLower && hasUpper ? '大小写混合' : '建议混合大小写' },
    { ok: hasDigit, label: hasDigit ? '包含数字' : '建议包含数字' },
    { ok: hasSymbol || hasCjk, label: hasSymbol ? '包含符号' : hasCjk ? '包含中文/符号' : '建议包含符号或中文' },
    { ok: !crackedList, label: crackedList ? '命中常见弱口令库' : '未命中常见弱口令库' },
    { ok: maxRun < 3, label: maxRun >= 3 ? `存在连续 ${maxRun} 个相同字符` : '无连续重复字符' },
    { ok: !foundSequence, label: foundSequence ? '存在键盘/字母/数字连续序列' : '无连续序列' },
  ];

  return {
    score: level.score, level, entropy,
    crackedList, maxRun, foundSequence, checks, onlineSec, offlineSec,
  };
}

/** 秒数 → 人类可读时长 (中文) */
export function humanSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec >= 3.156e16) return '超过 10 亿年';
  const units: Array<[number, string]> = [
    [3.156e7, '年'], [2592000, '个月'], [86400, '天'], [3600, '小时'],
    [60, '分钟'], [1, '秒'],
  ];
  for (const [ span, name ] of units) {
    if (sec >= span) {
      const v = sec / span;
      return v >= 100 ? `${Math.round(v).toLocaleString()} ${name}` : `${v.toFixed(1)} ${name}`;
    }
  }
  return '不足 1 秒';
}
