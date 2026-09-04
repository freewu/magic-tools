// 栅栏密码 (Rail Fence Cipher): 把文本按锯齿形 (Zigzag) 写入 N 条栏, 再按栏从上到下读出
// 实现基于码点数组 (Array.from), 中文等任意字符均可参与换位

/** 校验栏数并返回整数 */
const parseRails = (rails :number) :number => {
  const n = Number(rails);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) throw new Error('栏数必须为不小于 1 的整数');
  return n;
};

/** 文本第 i 个字符所在的栏 (循环周期 2n-2) */
const railOf = (i :number, rails :number) :number => {
  const cycle = 2 * rails - 2;
  const m = i % cycle;
  return m < rails ? m : cycle - m;
};

/** 栅栏加密: 按锯齿顺序换位 */
export const railFenceEncrypt = (text :string, rails :number) :string => {
  const n = parseRails(rails);
  const chars = Array.from(text);
  if (chars.length === 0 || n === 1) return text;
  const rows :string[][] = Array.from({ length: n }, () => []);
  chars.forEach((ch, i) => { rows[railOf(i, n)].push(ch); });
  return rows.flat().join('');
};

/** 栅栏解密: 按各栏长度回填再按原锯齿顺序读出 */
export const railFenceDecrypt = (cipher :string, rails :number) :string => {
  const n = parseRails(rails);
  const chars = Array.from(cipher);
  if (chars.length === 0 || n === 1) return cipher;
  const counts = new Array(n).fill(0);
  chars.forEach((_, i) => { counts[railOf(i, n)]++; });
  // 按栏切片
  const rows :string[][] = [];
  let pos = 0;
  for (let r = 0; r < n; r++) {
    rows.push(chars.slice(pos, pos + counts[r]));
    pos += counts[r];
  }
  // 按原锯齿顺序取回
  const ptr = new Array(n).fill(0);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const r = railOf(i, n);
    out += rows[r][ptr[r]++];
  }
  return out;
};

// -------- 默认栏数 (localStorage) --------
const DEFAULT_RAILS_ITEM = 'rail-fence-crypto:default-rails';

/** 获取默认栏数 */
export const getDefaultRails = () :number => {
  const v = Number(localStorage.getItem(DEFAULT_RAILS_ITEM));
  return Number.isFinite(v) && v >= 2 ? Math.trunc(v) : 3;
};

/** 保存默认栏数 */
export const setDefaultRails = (rails :number) :void => {
  localStorage.setItem(DEFAULT_RAILS_ITEM, String(Math.trunc(rails)));
};
