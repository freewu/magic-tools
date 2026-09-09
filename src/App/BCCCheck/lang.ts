// BCCCheck 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "BCC 校驗" },
  en: { appName: "BCC Checker" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '格式化': ['格式化', 'Format'],
  '写': ['寫', 'Write'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '输入格式:': ['輸入格式:', 'Input format:'],
  'ASCII / 文本': ['ASCII / 文字', 'ASCII / text'],
  '十六进制字节 (支持 空格/逗号/0x 等分隔)': ['十六進位位元組 (支援 空格/逗號/0x 等分隔)', 'Hex bytes (space / comma / 0x prefixes allowed)'],
  '文本按 UTF-8 编码为字节': ['文字按 UTF-8 編碼為位元組', 'Text is encoded to bytes as UTF-8'],
  '十进制': ['十進位', 'Decimal'],
  '八进制': ['八進位', 'Octal'],
  '二进制': ['二進位', 'Binary'],
  '数据长度': ['資料長度', 'Byte count'],
  '参与计算的字节数': ['參與計算的位元組數', 'Bytes included in the calculation'],
  '{n} 字节': ['{n} 位元組', '{n} bytes'],
  '点击复制 {l} 值': ['點擊複製 {l} 值', 'Click to copy {l} value'],
  '已复制: {t}': ['已複製: {t}', 'Copied: {t}'],
  '输入需要计算 BCC 校验值的十六进制数据 (如: 01 03 00 00 00 02) 或 拖拽文件到框内打开': ['輸入需要計算 BCC 校驗值的十六進位資料 (如: 01 03 00 00 00 02) 或 拖曳檔案到框內開啟', 'Enter hex data to compute the BCC (e.g. 01 03 00 00 00 02), or drag a file into the box'],
  '输入文本 (按 UTF-8 编码为字节参与计算, 如: ABC -> XOR = 0x40) 或 拖拽文件到框内打开': ['輸入文字 (按 UTF-8 編碼為位元組參與計算, 如: ABC -> XOR = 0x40) 或 拖曳檔案到框內開啟', 'Enter text (encoded to bytes as UTF-8, e.g. ABC -> XOR = 0x40), or drag a file into the box'],
  '期望 BCC:': ['期望 BCC:', 'Expected BCC:'],
  '如 00 / 0x5A (十六进制)': ['如 00 / 0x5A (十六進位)', 'e.g. 00 / 0x5A (hex)'],
  '✓ 校验通过': ['✓ 校驗通過', '✓ Check passed'],
  '✗ 校验不通过 (期望 {e})': ['✗ 校驗不通過 (期望 {e})', '✗ Check failed (expected {e})'],
  '期望值格式错误 (需 1-2 位十六进制)': ['期望值格式錯誤 (需 1-2 位十六進位)', 'Invalid expected value (needs 1-2 hex digits)'],
  '填入期望值 (十六进制) 后自动比对': ['填入期望值 (十六進位) 後自動比對', 'Enter the expected value (hex) to compare automatically'],
  '期望': ['期望', 'Expected'],
  'HEX (十六进制)': ['HEX (十六進位)', 'HEX (hexadecimal)'],
  '字节': ['位元組', 'bytes'],
  '位': ['位', 'bits'],
  '校验': ['校驗', 'Verify'],
  'r:': ['r:', 'r:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '个': ['個', ''],
  '解析': ['解析', 'Parse'],
  '每': ['每', 'Every'],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
  '或': ['或', 'OR'],
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

