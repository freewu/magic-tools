// 摩斯码表 (ITU 国际摩斯电码常用集)
// 编码规则: 字母/数字/常用标点, 单词之间用 " / " 分隔
export const MORSE_CODE_TABLE :Record<string, string> = {
  // 字母
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  // 数字
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  // 常用标点
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
  "'": '.----.', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

// 反向表: 摩斯符号 -> 字符
export const MORSE_REVERSE_TABLE :Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE_TABLE).map(([ ch, code ]) => [ code, ch ])
);

// 判断字符串是否为合法摩斯符号 (仅 . 与 -)
const isMorseSymbol = (s :string) :boolean => /^[.\-]+$/.test(s);

/**
 * 文本 -> 摩斯码
 * 单词之间用 " / " 分隔, 单词内字母之间用单个空格分隔
 */
export const encodeMorse = (text :string) :string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const encodedWords = words.map((word) => {
    const letters = Array.from(word).map((ch) => {
      const code = MORSE_CODE_TABLE[ch.toUpperCase()];
      if (!code) throw new Error(`暂不支持字符: "${ch}"`);
      return code;
    });
    return letters.join(' ');
  });
  return encodedWords.join(' / ');
};

/**
 * 摩斯码 -> 文本
 * 支持以单个空格分隔字母、以 " / " 分隔单词;
 * 单词之间允许任意多个空格, 空单词会被忽略
 */
export const decodeMorse = (text :string) :string => {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const words :string[][] = [];
  let current :string[] = [];
  for (const token of tokens) {
    if (token === '/') {
      words.push(current);
      current = [];
      continue;
    }
    if (!isMorseSymbol(token)) {
      throw new Error(`无法识别的摩斯符号: "${token}"`);
    }
    const ch = MORSE_REVERSE_TABLE[token];
    if (ch === undefined) {
      throw new Error(`未收录的摩斯符号: "${token}"`);
    }
    current.push(ch);
  }
  words.push(current);
  return words.map((w) => w.join('')).filter(Boolean).join(' ');
};

// 判断是否为可播放的摩斯码文本 (仅 . - 空格 / )
export const isMorseText = (s :string) :boolean =>
  /[.\-]/.test(s) && /^[\s.\-/]+$/.test(s);

export interface MorsePlayToken {
  text: string;   // 展示文本: 某字母的码值 (如 ...) 或单词分隔 /
  word: boolean;  // 是否为单词分隔 /
  sym: number;    // 该码值在播放序列中的序号 (非码值项为 -1)
}

export interface MorsePlaySchedule {
  tokens: MorsePlayToken[];          // 按顺序展示的码值列表
  startMs: number[];                 // 每个码值开始发声的时间 (距首个声音, 毫秒)
  totalMs: number;                   // 总时长 (毫秒)
  events: Array<{ on: boolean; ms: number }>; // 音频事件序列 (与 startMs 同源)
}

/**
 * 构建播放调度: 时间线完全基于摩斯节奏 (点=1, 划=3, 符号内间隔 1,
 * 字母间隔 3, 单词间隔 7, 单位 = dotMs 毫秒), 供音频与高亮共用, 保证同步。
 */
export const buildMorsePlaySchedule = (morse :string, dotMs :number) :MorsePlaySchedule => {
  const tokens = morse.trim().split(/\s+/).filter(Boolean);
  const events :Array<{ on: boolean; ms: number }> = [];
  const out :MorsePlayToken[] = [];
  const startMs :number[] = [];
  let cur = 0;        // 当前时间线位置 (距首个声音, ms)
  let pendingGap = 0; // 下一个声音前需要静默的长度
  let symIdx = 0;

  const flushGap = () => {
    if (pendingGap > 0) {
      events.push({ on: false, ms: pendingGap });
      cur += pendingGap;
      pendingGap = 0;
    }
  };

  for (const token of tokens) {
    if (token === '/') { // 单词间隔 7 个单位
      pendingGap = Math.max(pendingGap, dotMs * 7);
      out.push({ text: '/', word: true, sym: -1 });
      continue;
    }
    if (!isMorseSymbol(token)) { // 无法识别的杂串: 按字母间隔跳过 (常规入口已被 isMorseText 拦截)
      pendingGap = Math.max(pendingGap, dotMs * 3);
      out.push({ text: token, word: false, sym: -1 });
      continue;
    }
    flushGap();
    const syms = token.split('');
    startMs.push(cur); // 该码值第一个符号开始发声的时间
    syms.forEach((sym, j) => {
      events.push({ on: true, ms: sym === '.' ? dotMs : dotMs * 3 }); // 点 1 / 划 3
      if (j < syms.length - 1) events.push({ on: false, ms: dotMs });  // 符号内间隔 1
    });
    const charMs = syms.reduce((a, s) => a + (s === '.' ? dotMs : dotMs * 3) + dotMs, 0) - dotMs;
    cur += charMs;
    out.push({ text: token, word: false, sym: symIdx });
    symIdx++;
    pendingGap = dotMs * 3; // 字母间隔 3
  }

  return { tokens: out, startMs, totalMs: cur, events };
};

// ---------- 常用编码 (呼叫 / Q简语 / 数字祝词 / 单词简写 + 自定义) ----------
export interface MorsePhraseItem {
  text: string; // 填入文本 (如 CQ / 73 / TU), 可为字母数字标点组成的词句
  desc: string; // 含义说明
}

export interface MorsePhraseGroup {
  key: string;
  name: string;
  items: MorsePhraseItem[];
}

// 内置常用编码分组 (莫斯码由表实时编码, 保证与播放一致)
export const MORSE_PHRASE_GROUPS :MorsePhraseGroup[] = [
  {
    key: 'call', name: '呼叫 / 通用',
    items: [
      { text: 'CQ', desc: '呼叫所有电台（常发 CQ CQ CQ 广泛呼叫）' },
      { text: 'SOS', desc: '求救信号' },
      { text: 'K', desc: '请讲 / 轮到你（Over）' },
      { text: 'KN', desc: '只允许指定电台回复' },
      { text: 'AS', desc: '稍等、待命' },
      { text: 'AR', desc: '报文结束' },
      { text: 'SK', desc: '通信结束，下线' },
      { text: 'BT', desc: '分段分隔符' },
    ],
  },
  {
    key: 'q', name: '高频 Q 简语',
    items: [
      { text: 'QRZ', desc: '谁在呼叫我？' },
      { text: 'QTH', desc: '你的位置？/ 我位置是…' },
      { text: 'QSL', desc: '收到确认，知悉' },
      { text: 'QRL', desc: '频率占用、我很忙' },
      { text: 'QRM', desc: '有人为干扰' },
      { text: 'QRN', desc: '天电 / 静电噪声' },
      { text: 'QRX', desc: '请等一下，稍后呼叫' },
      { text: 'QRT', desc: '停止发报、关机' },
      { text: 'QRV', desc: '我准备好了' },
      { text: 'QSY', desc: '换频率' },
      { text: 'QSO', desc: '电台联络、通联会话' },
    ],
  },
  {
    key: 'num', name: '数字祝词',
    items: [
      { text: '73', desc: '致敬、祝顺利（最常用结束语）' },
      { text: '88', desc: '爱与祝福' },
    ],
  },
  {
    key: 'word', name: '单词简写',
    items: [
      { text: 'TU', desc: 'Thank you 谢谢' },
      { text: 'OK', desc: '好的' },
      { text: 'R', desc: 'Received = 收到' },
      { text: 'GN', desc: 'Good night 晚安' },
      { text: 'GM', desc: 'Good morning 早安' },
    ],
  },
];

// 自定义常用编码 (存储在 设置 → 其它 → 摩斯码常用编码)
export interface CustomMorsePhrase {
  id: number;
  text: string;
  desc: string;
}

const CUSTOM_KEY = 'morse-phrases';

export const listCustomMorsePhrases = () :CustomMorsePhrase[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => x && typeof x.text === 'string' && typeof x.desc === 'string' && typeof x.id === 'number');
  } catch {
    return [];
  }
};

export const saveCustomMorsePhrases = (list :CustomMorsePhrase[]) => {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); } catch { /* ignore */ }
};

export const newMorsePhraseId = () :number => Date.now();
