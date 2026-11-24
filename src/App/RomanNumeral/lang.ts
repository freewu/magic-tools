// RomanNumeral 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '羅馬數字' },
  en: { appName: 'Roman Numerals' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 操作按钮
  '转为罗马数字': ['轉為羅馬數字', 'To Roman'],
  '转为阿拉伯数字': ['轉為阿拉伯數字', 'To Arabic'],
  '清除': ['清除', 'Clear'],

  // 输入提示
  '输入阿拉伯数字 (1 - 3999)': ['輸入阿拉伯數字 (1 - 3999)', 'Enter an Arabic number (1 - 3999)'],
  '输入罗马数字 (I - MMMCMXCIX)': ['輸入羅馬數字 (I - MMMCMXCIX)', 'Enter a Roman numeral (I - MMMCMXCIX)'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy'],
  '支持范围 1 - 3999 (I - MMMCMXCIX); 罗马数字大小写均可, 需为标准写法': [
    '支援範圍 1 - 3999 (I - MMMCMXCIX); 羅馬數字大小寫皆可, 需為標準寫法',
    'Range 1 - 3999 (I - MMMCMXCIX); either case is accepted, standard form required',
  ],

  // 提示消息
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!'],
  '阿拉伯数字超出范围, 仅支持 1 - 3999': ['阿拉伯數字超出範圍, 僅支援 1 - 3999', 'Out of range — only 1 - 3999 is supported'],
  '请输入整数 (阿拉伯数字)': ['請輸入整數 (阿拉伯數字)', 'Please enter a whole number'],
  '不是标准的罗马数字写法 (支持 I ~ MMMCMXCIX, 即 1 - 3999)': [
    '不是標準的羅馬數字寫法 (支援 I ~ MMMCMXCIX, 即 1 - 3999)',
    'Not a standard Roman numeral (I - MMMCMXCIX, i.e. 1 - 3999)',
  ],

  // 说明区标题
  '罗马数字说明': ['羅馬數字說明', 'About Roman numerals'],
};

// 取词: 无命中回退 zh 原文
export const rn = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
