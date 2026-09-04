// 凯撒密码 (Caesar Cipher): 字母循环位移 n 位 (mod 26), 大小写保持, 非字母字符原样保留

/** 位移量归一化为 [0,26) 内的整数 */
const normalizeShift = (shift :number) :number => {
  const n = Number(shift);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error('位移量必须为整数');
  return ((n % 26) + 26) % 26;
};

/** 凯撒加密: 每个英文字母向后移动 shift 位 */
export const caesarEncrypt = (text :string, shift :number) :string => {
  const k = normalizeShift(shift);
  let out = '';
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c >= 65 && c <= 90) out += String.fromCharCode(((c - 65 + k) % 26) + 65);
    else if (c >= 97 && c <= 122) out += String.fromCharCode(((c - 97 + k) % 26) + 97);
    else out += ch; // 非字母 (含中文) 原样保留
  }
  return out;
};

/** 凯撒解密: 向后移动 -shift 位 */
export const caesarDecrypt = (text :string, shift :number) :string =>
  caesarEncrypt(text, -shift);

/** 文本中是否包含英文字母 */
export const hasLetters = (text :string) :boolean => /[A-Za-z]/.test(text);

// -------- 默认位移量 (localStorage) --------
const DEFAULT_SHIFT_ITEM = 'caesar-crypto:default-shift';

/** 获取默认位移量 */
export const getDefaultShift = () :number => {
  const v = Number(localStorage.getItem(DEFAULT_SHIFT_ITEM));
  return Number.isFinite(v) ? Math.trunc(v) : 3;
};

/** 保存默认位移量 */
export const setDefaultShift = (shift :number) :void => {
  localStorage.setItem(DEFAULT_SHIFT_ITEM, String(Math.trunc(shift)));
};
