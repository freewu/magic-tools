// ComplementCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "原碼/反碼/補碼計算" },
  en: { appName: "Complement Code Calculator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '左': ['左', 'Left'],
  '数值': ['數值', 'Numeric'],
  '符号': ['符號', 'Symbols'],
  '补码 (二进制)': ['補碼 (二進位)', "Two's complement (binary)"],
  '补码 (十六进制)': ['補碼 (十六進位)', "Two's complement (hex)"],
  '原码 (二进制)': ['原碼 (二進位)', 'Sign-magnitude (binary)'],
  '反码 (二进制)': ['反碼 (二進位)', "One's complement (binary)"],
  '十进制 → 原/反/补码': ['十進位 → 原/反/補碼', "Decimal → SM/1's/2's complement"],
  '编码 → 十进制': ['編碼 → 十進位', 'Encoding → decimal'],
  '位宽': ['位寬', 'Bit width'],
  '(bit)': ['(bit)', '(bit)'],
  '有符号 {r}': ['有符號 {r}', 'Signed {r}'],
  '无符号 {r}': ['無符號 {r}', 'Unsigned {r}'],
  '十进制整数': ['十進位整數', 'Decimal integer'],
  '输入十进制整数 (范围 {r})': ['輸入十進位整數 (範圍 {r})', 'Enter a decimal integer (range {r})'],
  '编码类型': ['編碼類型', 'Encoding type'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '二进制串': ['二進位串', 'Binary string'],
  '原码': ['原碼', 'Sign-magnitude'],
  '反码': ['反碼', "One's complement"],
  '补码': ['補碼', "Two's complement"],
  '十进制结果': ['十進位結果', 'Decimal result'],
  '输入 {b} 位补码十六进制 (可带 0x, 最多 {c} 位)': ['輸入 {b} 位補碼十六進位 (可帶 0x, 最多 {c} 位)', "Enter {b}-bit two's-complement hex (0x optional, up to {c} digits)"],
  '输入 {b} 位{k}二进制 (可少于 {b} 位, 高位补 0)': ['輸入 {b} 位{k}二進位 (可少於 {b} 位, 高位補 0)', 'Enter a {b}-bit {k} binary string (fewer than {b} bits allowed — padded with leading 0s)'],
  '−2^{b} 超出原码表示范围 (±(2^{b}−1))': ['−2^{b} 超出原碼表示範圍 (±(2^{b}−1))', '−2^{b} is outside the sign-magnitude range (±(2^{b}−1))'],
  '−2^{b} 超出反码表示范围 (±(2^{b}−1))': ['−2^{b} 超出反碼表示範圍 (±(2^{b}−1))', "−2^{b} is outside the one's-complement range (±(2^{b}−1))"],
  '{k} ({b}位)': ['{k} ({b}位)', '{k} ({b}-bit)'],
  '说明: 正数的原码 / 反码 / 补码相同; 负数的补码 = 反码 + 1。最左位为符号位 (0 正 / 1 负)。原码与反码可表示范围仅 ±(2^(N−1)−1), 因此 −2^(N−1) 只有补码表示。': ['說明: 正數的原碼 / 反碼 / 補碼相同; 負數的補碼 = 反碼 + 1。最左位為符號位 (0 正 / 1 負)。原碼與反碼可表示範圍僅 ±(2^(N−1)−1)，因此 −2^(N−1) 只有補碼表示。', "Notes: for positive numbers, sign-magnitude / one's complement / two's complement are identical; for negatives, two's complement = one's complement + 1. The leftmost bit is the sign bit (0 positive / 1 negative). Sign-magnitude and one's complement can only cover ±(2^(N−1)−1), so −2^(N−1) has a two's-complement representation only."],
  '位数': ['位數', 'Digits'],
  '8 位': ['8 位', '8 digits'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  '十进制': ['十進位', 'Decimal'],
  '二进制': ['二進位', 'Binary'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  '计算': ['計算', 'Compute'],
  '时': ['時', 'h'],
};

// 取词: 无命中回退 zh 原文 (与共享 ui-lang 行为一致)
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};

