// MermaidEditor 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'Mermaid 編輯器' },
  en: { appName: 'Mermaid Editor' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  // 顶部说明
  'Mermaid 编辑器': ['Mermaid 編輯器', 'Mermaid Editor'],
  '左侧编写 Mermaid 代码, 右侧实时渲染, 全部在本地完成 (不联网); 可导出': [
    '左側編寫 Mermaid 程式碼, 右側即時渲染, 全部在本機完成 (不連網); 可匯出',
    'Write Mermaid on the left, preview it live on the right — everything runs locally; export ',
  ],
  ' 图片。': [' 圖片。', ' images.'],

  // 示例 (按图形家族分组, 覆盖 mermaid 内置的全部可预览图形)
  '示例': ['範例', 'Sample'],
  '基础图': ['基礎圖', 'Basic diagrams'],
  '数据图表': ['資料圖表', 'Data charts'],
  '流程与排期': ['流程與排期', 'Process & planning'],
  '语法图': ['語法圖', 'Syntax diagrams'],
  '流程图 (flowchart)': ['流程圖 (flowchart)', 'Flowchart'],
  '时序图 (sequenceDiagram)': ['時序圖 (sequenceDiagram)', 'Sequence diagram'],
  '类图 (classDiagram)': ['類別圖 (classDiagram)', 'Class diagram'],
  '状态图 (stateDiagram-v2)': ['狀態圖 (stateDiagram-v2)', 'State diagram'],
  'ER 图 (erDiagram)': ['ER 圖 (erDiagram)', 'ER diagram'],
  '思维导图 (mindmap)': ['思維導圖 (mindmap)', 'Mindmap'],
  '用户旅程图 (journey)': ['使用者旅程圖 (journey)', 'User journey'],
  'C4 架构图 (C4Context)': ['C4 架構圖 (C4Context)', 'C4 context diagram'],
  '架构图 (architecture-beta)': ['架構圖 (architecture-beta)', 'Architecture diagram'],
  '块图 (block-beta)': ['區塊圖 (block-beta)', 'Block diagram'],
  '需求图 (requirementDiagram)': ['需求圖 (requirementDiagram)', 'Requirement diagram'],
  '饼图 (pie)': ['圓餅圖 (pie)', 'Pie chart'],
  '象限图 (quadrantChart)': ['象限圖 (quadrantChart)', 'Quadrant chart'],
  'XY 图 (xychart)': ['XY 圖 (xychart)', 'XY chart'],
  '桑基图 (sankey)': ['桑基圖 (sankey)', 'Sankey diagram'],
  '雷达图 (radar-beta)': ['雷達圖 (radar-beta)', 'Radar chart'],
  '矩形树图 (treemap-beta)': ['矩形樹狀圖 (treemap-beta)', 'Treemap'],
  '韦恩图 (venn-beta)': ['韋恩圖 (venn-beta)', 'Venn diagram'],
  '数据包图 (packet)': ['封包圖 (packet)', 'Packet diagram'],
  '甘特图 (gantt)': ['甘特圖 (gantt)', 'Gantt chart'],
  'Git 分支图 (gitGraph)': ['Git 分支圖 (gitGraph)', 'Git graph'],
  '时间线 (timeline)': ['時間軸 (timeline)', 'Timeline'],
  '看板 (kanban)': ['看板 (kanban)', 'Kanban'],
  '鱼骨图 (ishikawa-beta)': ['魚骨圖 (ishikawa-beta)', 'Ishikawa (fishbone)'],
  'Cynefin 框架 (cynefin-beta)': ['Cynefin 框架 (cynefin-beta)', 'Cynefin framework'],
  'Wardley 地图 (wardley-beta)': ['Wardley 地圖 (wardley-beta)', 'Wardley map'],
  '事件建模 (eventmodeling)': ['事件建模 (eventmodeling)', 'Event modeling'],
  '目录树 (treeView-beta)': ['目錄樹 (treeView-beta)', 'Tree view'],
  '语法图 · EBNF (railroad-ebnf-beta)': ['語法圖 · EBNF (railroad-ebnf-beta)', 'Syntax diagram · EBNF'],
  '语法图 · ABNF (railroad-abnf-beta)': ['語法圖 · ABNF (railroad-abnf-beta)', 'Syntax diagram · ABNF'],
  '语法图 · PEG (railroad-peg-beta)': ['語法圖 · PEG (railroad-peg-beta)', 'Syntax diagram · PEG'],
  '语法图 · IR (railroad-beta)': ['語法圖 · IR (railroad-beta)', 'Syntax diagram · IR'],

  // 编辑与预览面板
  'Mermaid 源码': ['Mermaid 原始碼', 'Mermaid source'],
  '在此输入 Mermaid 代码…': ['在此輸入 Mermaid 程式碼…', 'Type Mermaid code here…'],
  '清空': ['清空', 'Clear'],
  '预览': ['預覽', 'Preview'],
  '渲染中...': ['渲染中...', 'Rendering…'],
  '还没内容, 在左侧输入 Mermaid 代码': ['還沒有內容, 請在左側輸入 Mermaid 程式碼', 'Nothing to render yet — type Mermaid code on the left'],
  '{l} 行 / {c} 字符': ['{l} 列 / {c} 字元', '{l} lines / {c} chars'],

  // 导出
  '复制源码': ['複製原始碼', 'Copy source'],
  '复制 SVG': ['複製 SVG', 'Copy SVG'],
  '导出 SVG': ['匯出 SVG', 'Export SVG'],
  '导出 PNG': ['匯出 PNG', 'Export PNG'],
  '导出 WebP': ['匯出 WebP', 'Export WebP'],
  '缩放': ['縮放', 'Scale'],
  '背景': ['背景', 'Background'],
  '白色': ['白色', 'White'],
  '深色': ['深色', 'Dark'],
  '透明': ['透明', 'Transparent'],
  'SVG 为矢量格式, 始终透明背景, 不受「背景 / 缩放」影响': [
    'SVG 為向量格式, 固定透明背景, 不受「背景 / 縮放」影響',
    'SVG is vector and always keeps a transparent background — “Background / Scale” do not apply',
  ],
  '当前浏览器不支持 WebP 导出, 请改用 PNG': [
    '目前瀏覽器不支援 WebP 匯出, 請改用 PNG',
    'This browser cannot encode WebP — please use PNG instead',
  ],
  '导出失败: {msg}': ['匯出失敗: {msg}', 'Export failed: {msg}'],
  '已导出 {file}': ['已匯出 {file}', 'Exported {file}'],
  '已保存 {file}': ['已儲存 {file}', 'Saved {file}'],

  // 提示与错误
  '渲染失败': ['渲染失敗', 'Render failed'],
  '语法错误': ['語法錯誤', 'Syntax error'],
  '渲染引擎加载失败, 请刷新页面重试': ['渲染引擎載入失敗, 請重新整理頁面再試', 'Failed to load the renderer — please reload the page'],
  '已复制': ['已複製', 'Copied'],
  '已复制源码': ['已複製原始碼', 'Source copied'],
  '已复制 SVG': ['已複製 SVG', 'SVG copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選取複製', 'Copy failed — please copy manually'],

  // 说明区标题
  ' Mermaid 编辑器说明 ': [' Mermaid 編輯器說明 ', ' About the Mermaid editor '],
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
