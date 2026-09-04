// 维吉尼亚密码 (Vigenère Cipher): 多表替换密码, 以密钥字母循环决定每个明文字母的位移量
// 仅位移英文字母 (大小写保持), 其它字符 (含中文) 原样保留; 密钥只允许英文字母

/** 解析密钥: 仅接受 A-Z 字母 (大小写均可), 返回大写字母序号数组 */
const parseKey = (key :string) :number[] => {
  const clean = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean === '') throw new Error('请输入密钥');
  if (clean.length !== key.length) throw new Error('密钥仅支持英文字母');
  return Array.from(clean, (ch) => ch.charCodeAt(0) - 65);
};

/** 维吉尼亚加密: 明文字母 i 位移 (密钥字母[i mod len]) 位 */
export const vigenereEncrypt = (text :string, key :string) :string => {
  const k = parseKey(key);
  let ki = 0;
  let out = '';
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c >= 65 && c <= 90) {
      out += String.fromCharCode(((c - 65 + k[ki % k.length]) % 26) + 65);
      ki++;
    } else if (c >= 97 && c <= 122) {
      out += String.fromCharCode(((c - 97 + k[ki % k.length]) % 26) + 97);
      ki++;
    } else {
      out += ch; // 非字母原样保留, 不消耗密钥
    }
  }
  return out;
};

/** 维吉尼亚解密: 密文字母 i 位移 -密钥字母[i mod len] 位 */
export const vigenereDecrypt = (text :string, key :string) :string => {
  const k = parseKey(key);
  let ki = 0;
  let out = '';
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c >= 65 && c <= 90) {
      out += String.fromCharCode(((c - 65 - k[ki % k.length] + 26) % 26) + 65);
      ki++;
    } else if (c >= 97 && c <= 122) {
      out += String.fromCharCode(((c - 97 - k[ki % k.length] + 26) % 26) + 97);
      ki++;
    } else {
      out += ch;
    }
  }
  return out;
};

/** 密钥是否合法 (仅英文字母, 可为空) */
export const vigenereKeyValid = (key :string) :boolean => /^[A-Za-z]*$/.test(key);

// -------- 默认密钥 (localStorage) --------
const DEFAULT_KEY_ITEM = 'vigenere-crypto:default-key';

/** 获取默认密钥 */
export const getDefaultKey = () :string =>
  localStorage.getItem(DEFAULT_KEY_ITEM) ?? '';

/** 保存默认密钥 */
export const setDefaultKey = (key :string) :void => {
  localStorage.setItem(DEFAULT_KEY_ITEM, key);
};
