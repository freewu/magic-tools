// FileDiff 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "檔案比較" },
  en: { appName: "File Diff" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '{n} 行': ['{n} 行', '{n} lines'],
  '数组': ['陣列', 'Array'],
  '行号': ['行號', 'Line numbers'],
  '读取文件失败: {m}': ['讀取檔案失敗: {m}', 'Failed to read file: {m}'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  '已载入 {s}侧文件: {name} ({n} 行)': ['已載入 {s}側檔案: {name} ({n} 行)', 'Loaded {s}-side file: {name} ({n} lines)'],
  '点击选择文件，或将文件拖到此处': ['點擊選擇檔案，或將檔案拖到此處', 'Click to choose a file, or drop one here'],
  '左文件 (被比较基准)': ['左檔案 (被比較基準)', 'Left file (base for comparison)'],
  '右文件 (待比较)': ['右檔案 (待比較)', 'Right file (to compare)'],
  '{n} 行相同': ['{n} 行相同', '{n} lines identical'],
  '{n} 行仅左侧有': ['{n} 行僅左側有', '{n} lines only on the left'],
  '{n} 行仅右侧有': ['{n} 行僅右側有', '{n} lines only on the right'],
  '文本超长已截断比较前 4000 行': ['文字過長已截斷，比較前 4000 行', 'Input too long — only the first 4000 lines were compared'],
  '选择左侧文件': ['選擇左側檔案', 'Choose left file'],
  '选择右侧文件': ['選擇右側檔案', 'Choose right file'],
  '交换左右': ['交換左右', 'Swap sides'],
  '在左右区域各载入一个文件 (点击选择 / 拖拽), 自动按行 diff, 左侧红色 = 删除行, 右侧绿色 = 新增行': ['在左右區域各載入一個檔案 (點擊選擇 / 拖曳), 自動逐行 diff, 左側紅色 = 刪除行, 右側綠色 = 新增行', 'Load one file into each zone (click or drag) — rows are diffed automatically: red on the left = deleted lines, green on the right = added lines'],
  '左侧文件': ['左側檔案', 'Left file'],
  '右侧文件': ['右側檔案', 'Right file'],
  '(删除行红色)': ['(刪除行紅色)', '(deleted lines in red)'],
  '(新增行绿色)': ['(新增行綠色)', '(added lines in green)'],
  '共 {n} 个 diff 行, 仅渲染前 {m} 行': ['共 {n} 個 diff 行, 僅渲染前 {m} 行', '{n} diff lines total — only the first {m} are rendered'],
  '{n} 行 · {s} KB': ['{n} 行 · {s} KB', '{n} lines · {s} KB'],
  '读': ['讀', 'Read'],
  '计数': ['計數', 'Counter'],
  '+1': ['+1', '+1'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '生成': ['產生', 'Generate'],
  'UTF-8 文本': ['UTF-8 文字', 'UTF-8 text'],
  '字节': ['位元組', 'bytes'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '删除': ['刪除', 'Delete'],
  '全部': ['全部', 'All'],
  '个': ['個', ''],
  '至': ['至', 'to'],
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

