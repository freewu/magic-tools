// MindMap 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '心智圖' },
  en: { appName: 'Mind Map' },
} as const;

// 界面文案词条 (zh 短语即 key; 无命中回退 zh 原文)
const uilangRows: Record<string, [string, string]> = {
  // 顶部面板开关
  '隐藏输入': ['隱藏輸入', 'Hide outline'],
  '显示输入': ['顯示輸入', 'Show outline'],
  '隐藏预览': ['隱藏預覽', 'Hide preview'],
  '显示预览': ['顯示預覽', 'Show preview'],

  // 输入面板
  'Markdown 大纲': ['Markdown 大綱', 'Markdown outline'],
  '在此输入 Markdown 大纲…': ['在此輸入 Markdown 大綱…', 'Type a Markdown outline here…'],
  '示例': ['範例', 'Sample'],
  '复制大纲': ['複製大綱', 'Copy outline'],
  '已复制大纲': ['已複製大綱', 'Outline copied'],
  '清空': ['清空', 'Clear'],
  '{l} 行 / {c} 字符 / {h} 个标题': ['{l} 行 / {c} 字元 / {h} 個標題', '{l} lines / {c} chars / {h} headings'],
  '{n} 个节点 · {d} 层': ['{n} 個節點 · {d} 層', '{n} nodes · {d} levels'],

  // 预览面板
  '预览': ['預覽', 'Preview'],
  '渲染中...': ['渲染中...', 'Rendering…'],
  '还没内容, 在左侧输入 Markdown 大纲': ['還沒內容, 請在左側輸入 Markdown 大綱', 'Nothing yet — type a Markdown outline on the left'],
  '导出图片': ['匯出圖片', 'Export image'],
  'SVG 图片': ['SVG 圖片', 'SVG image'],
  'PNG 图片': ['PNG 圖片', 'PNG image'],
  'WebP 图片': ['WebP 圖片', 'WebP image'],
  '矢量图, 始终透明背景': ['向量圖, 始終透明背景', 'Vector, always transparent'],
  '位图, 按「背景 / 缩放」设置导出': ['點陣圖, 依「背景 / 縮放」設定匯出', 'Raster, exported with your background & scale'],
  '位图, 体积更小': ['點陣圖, 體積更小', 'Raster, smaller file size'],
  '当前浏览器不支持, 请改用 PNG': ['目前瀏覽器不支援, 請改用 PNG', 'This browser cannot export WebP — use PNG instead'],
  // 保存对话框标题
  '导出 SVG': ['匯出 SVG', 'Export SVG'],
  '导出 WebP': ['匯出 WebP', 'Export WebP'],
  '复制 SVG': ['複製 SVG', 'Copy SVG'],
  '已复制 SVG': ['已複製 SVG', 'SVG copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選取複製', 'Copy failed — please copy manually'],
  '适应窗口': ['適應視窗', 'Fit'],
  '已适应窗口': ['已適應視窗', 'Fitted'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  '按 Esc 退出全屏': ['按 Esc 退出全螢幕', 'Press Esc to exit fullscreen'],
  '全屏查看导图, 画布更大更好拖拽': ['全螢幕檢視心智圖, 畫布更大更好拖曳', 'View the map fullscreen — a bigger canvas is easier to pan'],

  // 视图参数
  '配色': ['配色', 'Color'],
  '展开层级': ['展開層級', 'Expand level'],
  '字号': ['字號', 'Font size'],
  '背景': ['背景', 'Background'],
  '缩放': ['縮放', 'Scale'],
  '全部展开': ['全部展開', 'Expand all'],
  '仅展开 {n} 层': ['僅展開 {n} 層', 'Expand {n} levels'],
  '渲染失败': ['渲染失敗', 'Render failed'],
  '{msg} (已回退到内置示例)': ['{msg} (已回退到內建範例)', '{msg} (fell back to a built-in sample)'],

  // 配色方案
  '默认多色': ['預設多色', 'Default multicolor'],
  '单色 · 蓝': ['單色 · 藍', 'Mono · blue'],
  '单色 · 绿': ['單色 · 綠', 'Mono · green'],
  '单色 · 灰': ['單色 · 灰', 'Mono · gray'],
  '暖色系': ['暖色系', 'Warm'],
  '冷色系': ['冷色系', 'Cool'],

  // 背景选项
  '白色': ['白色', 'White'],
  '深色': ['深色', 'Dark'],
  '透明': ['透明', 'Transparent'],

  // 示例名称
  '项目计划': ['專案計畫', 'Project plan'],
  '学习路线': ['學習路線', 'Learning path'],
  '会议纪要': ['會議紀錄', 'Meeting notes'],
  '知识体系': ['知識體系', 'Knowledge map'],
  '需求拆解': ['需求拆解', 'Requirement breakdown'],
  'markmap 语法速查': ['markmap 語法速查', 'markmap syntax reference'],

  // 示例说明
  '迭代目标 / 排期 / 风险, 适合周会与项目启动': ['迭代目標 / 排期 / 風險, 適合週會與專案啟動', 'Goals, schedule and risks — great for kickoffs'],
  '由浅入深的知识路径, 适合技术学习规划': ['由淺入深的知識路徑, 適合技術學習規劃', 'A staged path for technology learning plans'],
  '待办清单 + 结论沉淀, 复选框可直接标记状态': ['待辦清單 + 結論沉澱, 核取方塊可直接標記狀態', 'Action items and conclusions, with checkboxes'],
  '读书笔记 / 领域知识地图, 适合长期积累': ['讀書筆記 / 領域知識地圖, 適合長期累積', 'Reading notes and domain knowledge maps'],
  '把一句需求拆成可执行的功能点': ['把一句需求拆成可執行的功能點', 'Turn one requirement into actionable items'],
  '标题 / 列表 / 折叠 / 复选框 / 代码块等写法示例': ['標題 / 列表 / 折疊 / 核取方塊 / 程式碼區塊等寫法範例', 'Headings, lists, folding, checkboxes and code blocks'],

  // 导出结果
  '已导出 {file}': ['已匯出 {file}', 'Exported {file}'],
  '导出失败: {msg}': ['匯出失敗: {msg}', 'Export failed: {msg}'],
  '没有可导出的内容': ['沒有可匯出的內容', 'Nothing to export'],

  // 说明区标题
  ' 思维导图说明 ': [' 心智圖說明 ', ' About the mind map '],
};

// 取词: 无命中回退 zh 原文
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
