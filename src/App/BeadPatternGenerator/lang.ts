// BeadPatternGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "拼豆圖紙" },
  en: { appName: "Bead Pattern" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const beadlangRows: Record<string, [string, string]> = {
  '点击或拖拽图片到此处': ['點擊或拖曳圖片到此處', 'Click or drag an image here'],
  '支持 png / jpg / webp / gif (首帧), 自动按颗粒数缩放; 纯色/透明背景自动留空': [
    '支援 png / jpg / webp / gif (首幀), 自動依顆粒數縮放; 純色/透明背景自動留空',
    'Supports png / jpg / webp / gif (first frame); auto-scaled to the bead grid. Solid/transparent backgrounds are left empty',
  ],
  '载入图片后自动生成拼豆图纸: 按真实色卡匹配色号, 可手工改色后导出打印': [
    '載入圖片後自動產生拼豆圖紙: 依真實色卡匹配色號, 可手工改色後匯出列印',
    'The pattern generates automatically after loading: colors are matched to a real bead chart and can be edited before export',
  ],
  '请选择图片文件': ['請選擇圖片檔案', 'Choose an image file'],
  '读取文件失败': ['讀取檔案失敗', 'Failed to read the file'],
  '图片解析失败, 请确认文件格式': ['圖片解析失敗, 請確認檔案格式', 'Failed to decode the image — check the file format'],
  '无法创建画布': ['無法建立畫布', 'Could not create canvas'],
  '已载入 {name} ({w}×{h}px)': ['已載入 {name} ({w}×{h}px)', 'Loaded {name} ({w}×{h}px)'],
  '载入失败': ['載入失敗', 'Load failed'],
  '品牌色卡': ['品牌色卡', 'Brand chart'],
  '图纸宽 (颗粒数)': ['圖紙寬 (顆粒數)', 'Width (beads)'],
  '图纸高 (颗粒数)': ['圖紙高 (顆粒數)', 'Height (beads)'],
  '单颗尺寸': ['單顆尺寸', 'Bead size'],
  '按原图比例': ['依原圖比例', 'Keep source ratio'],
  '用色数': ['用色數', 'Max colors'],
  '抖动': ['抖動', 'Dither'],
  '去背景': ['去背景', 'Remove background'],
  '亮度': ['亮度', 'Brightness'],
  '对比度': ['對比度', 'Contrast'],
  '饱和度': ['飽和度', 'Saturation'],
  '显示色号': ['顯示色號', 'Show codes'],
  '网格': ['網格', 'Grid'],
  '行列编号': ['行列編號', 'Row / column numbers'],
  '格子大小': ['格子大小', 'Cell size'],
  '自动': ['自動', 'Auto'],
  '小豆': ['小豆', 'mini'],
  '大豆': ['大豆', 'midi'],
  '已识别背景色 {hex}': ['已識別背景色 {hex}', 'Detected background {hex}'],
  '未识别到纯色背景': ['未識別到純色背景', 'No solid background detected'],
  '编辑工具': ['編輯工具', 'Edit tools'],
  '画笔': ['畫筆', 'Brush'],
  '橡皮': ['橡皮擦', 'Eraser'],
  '换色': ['換色', 'Recolor'],
  '魔棒': ['魔棒', 'Fill'],
  '撤销': ['復原', 'Undo'],
  '重做': ['重做', 'Redo'],
  '重置': ['重設', 'Reset'],
  '镜像': ['鏡像', 'Mirror'],
  '当前颜色': ['目前顏色', 'Current color'],
  '图纸预览 (点击格子可用上方工具修改)': [
    '圖紙預覽 (點擊格子可用上方工具修改)',
    'Pattern preview (click a cell to edit with the tools above)',
  ],
  '放大': ['放大', 'Zoom in'],
  '缩小': ['縮小', 'Zoom out'],
  '归位': ['歸位', 'Reset view'],
  '减小图纸宽': ['減小圖紙寬', 'Decrease width'],
  '增大图纸宽': ['增大圖紙寬', 'Increase width'],
  '减小图纸高': ['減小圖紙高', 'Decrease height'],
  '增大图纸高': ['增大圖紙高', 'Increase height'],
  '载入图片后显示图纸预览': ['載入圖片後顯示圖紙預覽', 'Load an image to see the pattern preview'],
  '统计': ['統計', 'Stats'],
  '总豆数': ['總豆數', 'Total beads'],
  '成品尺寸': ['成品尺寸', 'Finished size'],
  '拼豆板': ['拼豆板', 'Pegboards'],
  '{n} 种': ['{n} 種', '{n} colors'],
  '29×29 拼豆板 {x}×{y} ({n} 块)': ['29×29 拼豆板 {x}×{y} ({n} 塊)', '29x29 pegboards {x}x{y} ({n} pcs)'],
  '单颗 {mm}mm ({size})': ['單顆 {mm}mm ({size})', 'Bead {mm}mm ({size})'],
  '成品 {w} × {h} cm': ['成品 {w} × {h} cm', 'Finished {w} x {h} cm'],
  '用量清单': ['用量清單', 'Color usage'],
  '色号': ['色號', 'Code'],
  '颜色名': ['顏色名', 'Name'],
  '颗': ['顆', ' beads'],
  '颜色': ['顏色', 'Color'],
  '数量': ['數量', 'Count'],
  '占比': ['佔比', 'Ratio'],
  '合计': ['合計', 'Total'],
  '导出图纸 PNG': ['匯出圖紙 PNG', 'Export pattern PNG'],
  '导出色号 CSV': ['匯出色號 CSV', 'Export codes CSV'],
  '导出用量 CSV': ['匯出用量 CSV', 'Export usage CSV'],
  '复制清单': ['複製清單', 'Copy list'],
  '保存 {name}': ['儲存 {name}', 'Save {name}'],
  '已保存 {name}': ['已儲存 {name}', 'Saved {name}'],
  '已复制清单到剪贴板': ['已複製清單到剪貼簿', 'Usage list copied to clipboard'],
  '复制失败, 请手动选中文本复制': ['複製失敗, 請手動選取文字複製', 'Copy failed — select the text and copy manually'],
  'CSV 文件': ['CSV 檔案', 'CSV file'],
  'PNG 图片': ['PNG 圖片', 'PNG image'],
  '画布创建失败, 无法导出 PNG': ['無法建立畫布，無法匯出 PNG', 'Canvas unavailable — cannot export PNG'],
  '提示: 用色数越少越省豆; 熨烫需翻面, 可用「镜像」查看翻面后的效果': [
    '提示: 用色數越少越省豆; 熨燙需翻面, 可用「鏡像」檢視翻面後的效果',
    'Tip: fewer colors means fewer beads to buy; ironing flips the piece, so use "Mirror" to preview the flipped side',
  ],
};

// 取词: 无命中回退 zh 原文 (与共享 image-lang 行为一致)
export const im = (locale: string, zh: string): string => {
  const e = beadlangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
