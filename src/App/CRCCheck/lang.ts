// CRCCheck 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "CRC 校驗" },
  en: { appName: "CRC Checker" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '格式化': ['格式化', 'Format'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  '写': ['寫', 'Write'],
  '含义': ['含義', 'Meaning'],
  '位宽': ['位寬', 'Bit width'],
  '(bit)': ['(bit)', '(bit)'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '算法': ['演算法', 'Algorithm'],
  '位数': ['位數', 'Digits'],
  '8 位': ['8 位', '8 digits'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '生成': ['產生', 'Generate'],
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
  '校验算法:': ['校驗演算法:', 'Algorithm:'],
  '选择 CRC 算法': ['選擇 CRC 演算法', 'Pick a CRC algorithm'],
  'CRC 位数': ['CRC 位數', 'CRC width'],
  '生成多项式 (已省略隐含最高位)': ['生成多項式 (已省略隱含最高位)', 'Generator polynomial (implicit top bit omitted)'],
  '寄存器初始值': ['暫存器初始值', 'Register initial value'],
  '最终结果异或值': ['最終結果互斥或值', 'Final XOR value'],
  '输入比特反转 (LSB first)': ['輸入位元反轉 (LSB first)', 'Reverse input bits (LSB first)'],
  '输出比特反转': ['輸出位元反轉', 'Reverse output bits'],
  '输入数据反转 (RefIn)': ['輸入資料反轉 (RefIn)', 'Reverse input data (RefIn)'],
  '输出数据反转 (RefOut)': ['輸出資料反轉 (RefOut)', 'Reverse output data (RefOut)'],
  '输入需要计算 CRC 校验值的数据 (十六进制字节, 如: 01 03 04 02 00 01 00) 或 拖拽文件到框内打开': ['輸入需要計算 CRC 校驗值的資料 (十六進位位元組, 如: 01 03 04 02 00 01 00) 或 拖曳檔案到框內開啟', 'Enter data to compute the CRC (hex bytes, e.g. 01 03 04 02 00 01 00), or drag a file into the box'],
  '输入文本 (按 UTF-8 编码为字节参与计算, 如: 123456789 -> CRC-16/MODBUS = 4B37) 或 拖拽文件到框内打开': ['輸入文字 (按 UTF-8 編碼為位元組參與計算, 如: 123456789 -> CRC-16/MODBUS = 4B37) 或 拖曳檔案到框內開啟', 'Enter text (encoded to bytes as UTF-8, e.g. 123456789 -> CRC-16/MODBUS = 4B37), or drag a file into the box'],
  'HEX (十六进制)': ['HEX (十六進位)', 'HEX (hexadecimal)'],
  '字节': ['位元組', 'bytes'],
  '位': ['位', 'bits'],
  '算法:': ['演算法:', 'Algorithm:'],
  '校验': ['校驗', 'Verify'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '全部': ['全部', 'All'],
  '标准': ['標準', 'Standard'],
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

