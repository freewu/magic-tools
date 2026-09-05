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
