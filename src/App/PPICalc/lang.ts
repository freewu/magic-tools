// PPICalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "PPI 計算" },
  en: { appName: "PPI Calculator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '数值': ['數值', 'Numeric'],
  '数字': ['數字', 'Numeric'],
  '+1': ['+1', '+1'],
  '名称': ['名稱', 'Issuer'],
  'PPI = √(宽² + 高²) ÷ 对角线英寸': ['PPI = √(寬² + 高²) ÷ 對角線英吋', 'PPI = √(width² + height²) ÷ diagonal inches'],
  'Pentile 等效 ≈ RGB PPI × √(2/3) ≈ ×0.8165': ['Pentile 等效 ≈ RGB PPI × √(2/3) ≈ ×0.8165', 'Pentile equivalent ≈ RGB PPI × √(2/3) ≈ ×0.8165'],
  'RGB 排列: 每像素 3 子像素 | Pentile: 2 子像素': ['RGB 排列: 每像素 3 子像素 | Pentile: 2 子像素', 'RGB layout: 3 subpixels per pixel | Pentile: 2'],
  '常用屏幕:': ['常用螢幕:', 'Common screens:'],
  '选择常用分辨率 (可手动修改下方数值)': ['選擇常用解析度 (可手動修改下方數值)', 'Pick a common resolution (the values below stay editable)'],
  '分辨率:': ['解析度:', 'Resolution:'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '屏幕尺寸:': ['螢幕尺寸:', 'Screen size:'],
  '英寸': ['英吋', 'inches'],
  '请输入有效的分辨率(正整数)与屏幕尺寸(大于 0 英寸)': ['請輸入有效的解析度(正整數)與螢幕尺寸(大於 0 英吋)', 'Enter a valid resolution (positive integers) and screen size (greater than 0 inches)'],
  '标准 RGB 排列 PPI': ['標準 RGB 排列 PPI', 'Standard RGB PPI'],
  '每英寸像素 (对角线方向)': ['每英吋像素 (對角線方向)', 'Pixels per inch (diagonal)'],
  'Pentile 排列等效 PPI': ['Pentile 排列等效 PPI', 'Pentile-equivalent PPI'],
  'OLED 菱形排列, 红/蓝子像素共享, 等效 ≈ RGB × 0.8165': ['OLED 菱形排列, 紅/藍子像素共享, 等效 ≈ RGB × 0.8165', 'OLED diamond layout shares red/blue subpixels — equivalent ≈ RGB × 0.8165'],
  '物理尺寸 (宽 × 高)': ['物理尺寸 (寬 × 高)', 'Physical size (width × height)'],
  'RGB 子像素密度': ['RGB 子像素密度', 'RGB subpixel density'],
  'Pentile 子像素密度': ['Pentile 子像素密度', 'Pentile subpixel density'],
  '总像素': ['總像素', 'Total pixels'],
  '宽高比': ['寬高比', 'Aspect ratio'],
  '{a} × {b} 英寸': ['{a} × {b} 英吋', '{a} × {b} inches'],
  '{n} 个/英寸': ['{n} 個/英吋', '{n} per inch'],
  '{p} ({m} MP)': ['{p} ({m} MP)', '{p} ({m} MP)'],
  '提示: Pentile (如三星 Diamond 排列) 每个像素仅 2 个子像素, 等效视觉密度约为标准 RGB 的 √(2/3) ≈ 81.65%; 同分辨率下 Pentile 屏的理论细腻度低于 RGB 排列, 厂商常以更高分辨率(如 QHD+)弥补。': ['提示: Pentile (如三星 Diamond 排列) 每個像素僅 2 個子像素, 等效視覺密度約為標準 RGB 的 √(2/3) ≈ 81.65%; 同解析度下 Pentile 螢幕的理論細膩度低於 RGB 排列, 廠商常以更高解析度(如 QHD+)彌補。', "Note: on Pentile (e.g. Samsung's Diamond layout) each pixel has only 2 subpixels, so the perceived density is about √(2/3) ≈ 81.65% of standard RGB. At the same resolution a Pentile panel is theoretically less sharp than RGB; makers compensate with higher resolutions (e.g. QHD+)."],
  '位': ['位', 'bits'],
  '校验': ['校驗', 'Verify'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '标准': ['標準', 'Standard'],
  '个': ['個', ''],
  '每': ['每', 'Every'],
  '分': ['分', 'm'],
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

