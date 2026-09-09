// BarcodeGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "條碼生成" },
  en: { appName: "Barcode Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '清除': ['清除', 'Clear'],
  '高度:': ['高度:', 'Height:'],
  '文字': ['文字', 'Label'],
  '生成失败': ['產生失敗', 'Generation failed'],
  '取消': ['取消', 'Cancel'],
  '字符': ['字元', 'chars'],
  '请先输入内容': ['請先輸入內容', 'Enter some content first'],
  '已取消保存': ['已取消儲存', 'Save cancelled'],
  '颜色:': ['顏色:', 'Color:'],
  '背景色:': ['背景色:', 'Background:'],
  '单个': ['單個', 'Single'],
  '批量': ['批次', 'Batch'],
  '{n} 行': ['{n} 行', '{n} line(s)'],
  ' (超过 {m} 行, 已截断)': [' (超過 {m} 行, 已截斷)', ' (over {m} lines, truncated)'],
  '文件名前缀:': ['檔名前綴:', 'Filename prefix:'],
  '导出全部 PNG': ['匯出全部 PNG', 'Export all PNG'],
  '清空': ['清空', 'Clear'],
  '宽': ['寬', 'W'],
  '高': ['高', 'H'],
  '格式': ['格式', 'Format'],
  '默认': ['預設', 'Default'],
  '常用': ['常用', 'Common'],
  '自动切换 A/B/C 子集, 支持全部可打印 ASCII 字符': ['自動切換 A/B/C 子集, 支援全部可列印 ASCII 字元', 'Automatically switches A/B/C subsets; supports all printable ASCII characters'],
  '数字、大写字母与常用符号 (ASCII 32-95)': ['數字、大寫字母與常用符號 (ASCII 32-95)', 'Digits, uppercase letters and common symbols (ASCII 32-95)'],
  'ASCII 32-127 (含小写字母)': ['ASCII 32-127 (含小寫字母)', 'ASCII 32-127 (including lowercase letters)'],
  '仅数字且位数必须为偶数': ['僅數字且位數必須為偶數', 'Digits only and the length must be even'],
  '输入 12 位自动补校验位, 或输入完整 13 位': ['輸入 12 位自動補檢查碼, 或輸入完整 13 位', 'Enter 12 digits and the check digit is added automatically, or enter the full 13'],
  '输入 7 位自动补校验位, 或输入完整 8 位': ['輸入 7 位自動補檢查碼, 或輸入完整 8 位', 'Enter 7 digits and the check digit is added automatically, or enter the full 8'],
  '输入 11 位自动补校验位, 或输入完整 12 位': ['輸入 11 位自動補檢查碼, 或輸入完整 12 位', 'Enter 11 digits and the check digit is added automatically, or enter the full 12'],
  '0-9 A-Z 及 - . 空格 $ / + %': ['0-9 A-Z 及 - . 空格 $ / + %', '0-9 A-Z and - . space $ / + %'],
  '输入 13 位自动补校验位, 或输入完整 14 位': ['輸入 13 位自動補檢查碼, 或輸入完整 14 位', 'Enter 13 digits and the check digit is added automatically, or enter the full 14'],
  'MSI (Mod 10 校验)': ['MSI (Mod 10 檢查碼)', 'MSI (Mod 10 checksum)'],
  'Mod 10 校验位': ['Mod 10 檢查碼', 'Mod 10 check digit'],
  'Mod 11 校验位': ['Mod 11 檢查碼', 'Mod 11 check digit'],
  '双 Mod 10 校验位': ['雙 Mod 10 檢查碼', 'Double Mod 10 check digit'],
  'Mod 11 + Mod 10 校验位': ['Mod 11 + Mod 10 檢查碼', 'Mod 11 + Mod 10 check digit'],
  '取值范围 3-131070': ['取值範圍 3-131070', 'Value range 3-131070'],
  'ITF 交错 2/5': ['ITF 交錯 2/5', 'ITF 2/5 Interleaved'],
  '校验位不正确, 请检查最后一位数字': ['檢查碼不正確, 請檢查最後一位數字', 'Incorrect check digit — please check the last digit'],
  'CODE128 仅支持可打印 ASCII 字符 (空格及可见字符)': ['CODE128 僅支援可列印 ASCII 字元 (空格及可見字元)', 'CODE128 supports printable ASCII characters only (space and visible characters)'],
  'CODE128 A 仅支持数字、大写字母与常用符号 (ASCII 32-95)': ['CODE128 A 僅支援數字、大寫字母與常用符號 (ASCII 32-95)', 'CODE128 A supports digits, uppercase letters and common symbols only (ASCII 32-95)'],
  'CODE128 B 仅支持 ASCII 32-126 (含小写字母)': ['CODE128 B 僅支援 ASCII 32-126 (含小寫字母)', 'CODE128 B supports ASCII 32-126 only (including lowercase letters)'],
  'CODE128 C 仅支持数字且位数必须为偶数': ['CODE128 C 僅支援數字且位數必須為偶數', 'CODE128 C supports digits only and the length must be even'],
  'EAN-13 需要 12 或 13 位数字': ['EAN-13 需要 12 或 13 位數字', 'EAN-13 needs 12 or 13 digits'],
  'EAN-8 需要 7 或 8 位数字': ['EAN-8 需要 7 或 8 位數字', 'EAN-8 needs 7 or 8 digits'],
  'UPC-A 需要 11 或 12 位数字': ['UPC-A 需要 11 或 12 位數字', 'UPC-A needs 11 or 12 digits'],
  'CODE39 仅支持: 0-9 A-Z 及 - . 空格 $ / + %': ['CODE39 僅支援: 0-9 A-Z 及 - . 空格 $ / + %', 'CODE39 supports: 0-9 A-Z and - . space $ / + %'],
  'ITF-14 需要 13 或 14 位数字': ['ITF-14 需要 13 或 14 位數字', 'ITF-14 needs 13 or 14 digits'],
  'ITF 仅支持数字且位数必须为偶数': ['ITF 僅支援數字且位數必須為偶數', 'ITF supports digits only and the length must be even'],
  'MSI 系列仅支持数字': ['MSI 系列僅支援數字', 'MSI variants support digits only'],
  'Pharmacode 仅支持数字': ['Pharmacode 僅支援數字', 'Pharmacode supports digits only'],
  'Pharmacode 取值范围为 3-131070': ['Pharmacode 取值範圍為 3-131070', 'Pharmacode value must be in 3-131070'],
  '请先输入内容生成条形码': ['請先輸入內容產生條碼', 'Enter content to generate a barcode first'],
  '条形码图片已保存': ['條碼圖片已儲存', 'Barcode image saved'],
  '条形码生成失败, 请检查内容后重试': ['條碼產生失敗, 請檢查內容後重試', 'Barcode generation failed — check the content and retry'],
  '已保存 {n} 个 ({f} 行内容不符合 {fmt} 规则被跳过)': ['已儲存 {n} 個 ({f} 行內容不符合 {fmt} 規則被跳過)', 'Saved {n} ({f} line(s) skipped for not matching the {fmt} rules)'],
  '已保存 {n} 个条形码': ['已儲存 {n} 個條碼', 'Saved {n} barcode(s)'],
  '格式:': ['格式:', 'Format:'],
  '条宽:': ['條寬:', 'Bar width:'],
  '显示内容:': ['顯示內容:', 'Show text:'],
  '显示': ['顯示', 'Show'],
  '隐藏': ['隱藏', 'Hide'],
  '输入内容后自动生成条形码 ({h})': ['輸入內容後自動產生條碼 ({h})', 'The barcode is generated automatically as you type ({h})'],
  '下载 PNG': ['下載 PNG', 'Download PNG'],
  '点击下载条形码 PNG': ['點擊下載條碼 PNG', 'Click to download the barcode PNG'],
  '每行一个编码内容, 一次生成 {n} 行以内; 不符合当前 {fmt} 编码规则的行走自动跳过; 导出时桌面版选择文件夹一次保存全部图片, 网页版逐个下载。': ['每行一個編碼內容, 一次產生 {n} 行以內; 不符合目前 {fmt} 編碼規則的行會自動跳過; 匯出時桌面版選擇資料夾一次儲存全部圖片, 網頁版逐個下載。', 'One encoded value per line, up to {n} lines at a time; lines not matching the current {fmt} rules are skipped automatically. On export the desktop build saves all images into a chosen folder at once, while the web demo downloads them one by one.'],
  '批量内容 (每行一个条形码)\n\n示例:\n6901028040479\n4006381333931\nABC-12345\nhttps://example.com': ['批次內容 (每行一個條碼)\n\n範例:\n6901028040479\n4006381333931\nABC-12345\nhttps://example.com', 'Batch content (one barcode per line)\n\nExample:\n6901028040479\n4006381333931\nABC-12345\nhttps://example.com'],
  '生成失败: ': ['產生失敗: ', 'Generation failed: '],
};

// 取词: 无命中回退 zh 原文 (与共享 image-lang 行为一致)
export const im = (locale: string, zh: string): string => {
  const e = imagelangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};

