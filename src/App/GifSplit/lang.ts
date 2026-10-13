// GifSplit 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'GIF 拆解' },
  en: { appName: 'GIF Splitter' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 选择 GIF
  '点击选择 GIF 图片, 或把 .gif 文件拖到这里': ['點擊選擇 GIF 圖片，或把 .gif 檔案拖到這裡', 'Click to choose a GIF, or drag a .gif file here'],
  '松开鼠标即可载入 GIF': ['放開滑鼠即可載入 GIF', 'Release to load the GIF'],
  '选择 GIF': ['選擇 GIF', 'Choose GIF'],
  '清空': ['清空', 'Clear'],
  '还没有载入 GIF': ['還沒有載入 GIF', 'No GIF loaded yet'],
  '请选择 .gif 文件': ['請選擇 .gif 檔案', 'Please choose a .gif file'],
  'GIF 文件过大 ({size}), 请选择小于 {max} 的文件': ['GIF 檔案過大 ({size})，請選擇小於 {max} 的檔案', 'The GIF is too large ({size}); please pick one under {max}'],
  'GIF 解析失败: {msg}': ['GIF 解析失敗: {msg}', 'Failed to parse the GIF: {msg}'],
  'GIF 帧数过多 (超过 {n} 帧), 已拒绝载入': ['GIF 影格過多 (超過 {n} 格)，已拒絕載入', 'Too many frames (over {n}); loading refused'],
  'GIF 尺寸过大 (超过 16384 像素), 已拒绝载入': ['GIF 尺寸過大 (超過 16384 像素)，已拒絕載入', 'The GIF is too large (over 16384 px); loading refused'],
  '不是有效的 GIF 图片': ['不是有效的 GIF 圖片', 'Not a valid GIF image'],
  'GIF 中没有可用的帧': ['GIF 中沒有可用的影格', 'The GIF contains no usable frames'],

  // 概览
  '尺寸 {w} × {h} px, 共 {n} 帧, 时长 {dur}, 平均 {fps} fps, {loop}, 文件 {size}': [
    '尺寸 {w} × {h} px，共 {n} 格，時長 {dur}，平均 {fps} fps，{loop}，檔案 {size}',
    '{w} × {h} px, {n} frames, {dur}, {fps} fps on average, {loop}, file {size}',
  ],
  '只播放一次': ['只播放一次', 'Plays once'],
  '无限循环': ['無限循環', 'Loops forever'],
  '循环 {n} 次': ['循環 {n} 次', 'Loops {n} times'],

  // 预览与回放
  '动画预览': ['動畫預覽', 'Animation preview'],
  '播放': ['播放', 'Play'],
  '暂停': ['暫停', 'Pause'],
  '上一帧': ['上一格', 'Previous frame'],
  '下一帧': ['下一格', 'Next frame'],
  '第 {i} / {n} 帧, 延时 {delay}': ['第 {i} / {n} 格，延時 {delay}', 'Frame {i} / {n}, delay {delay}'],
  '播放速度': ['播放速度', 'Playback speed'],

  // 帧列表与选择
  '帧列表': ['影格列表', 'Frames'],
  '已选 {n} 帧': ['已選 {n} 格', '{n} frames selected'],
  '全选': ['全選', 'Select all'],
  '反选': ['反選', 'Invert'],
  '取消选择': ['取消選擇', 'Clear selection'],
  '缩略图': ['縮圖', 'Thumbnail'],
  '帧号': ['影格編號', 'No.'],
  '延时': ['延時', 'Delay'],
  '区域': ['區域', 'Region'],
  '处置方式': ['處置方式', 'Disposal'],
  '保留': ['保留', 'Keep'],
  '还原背景': ['還原背景', 'Restore to background'],
  '还原上一帧': ['還原上一格', 'Restore to previous'],
  '处置方式决定下一帧绘制前如何处理本帧画面 (保留 / 还原背景 / 还原上一帧)': [
    '處置方式決定下一格繪製前如何處理本格畫面 (保留 / 還原背景 / 還原上一格)',
    'Disposal decides how this frame is handled before the next one is drawn (keep / restore to background / restore to previous)',
  ],
  '导出': ['匯出', 'Export'],
  '导出此帧': ['匯出此格', 'Export this frame'],
  '只显示前 {n} 帧 (导出不受影响)': ['只顯示前 {n} 格 (匯出不受影響)', 'Only the first {n} frames are listed (exporting is unaffected)'],

  // 导出
  '导出选中帧 (PNG)': ['匯出選中格 (PNG)', 'Export selected frames (PNG)'],
  '导出精灵图': ['匯出精靈圖', 'Export sprite sheet'],
  '精灵图列数': ['精靈圖欄數', 'Sprite columns'],
  '间隔 (px)': ['間隔 (px)', 'Gap (px)'],
  '精灵图把选中帧按行列拼成一张 PNG, 列数与间隔会记住上次设置': [
    '精靈圖把選中格依列與行拼成一張 PNG，欄數與間隔會記住上次設定',
    'The sprite sheet tiles the selected frames into one PNG; columns and gap are remembered',
  ],
  '正在导出…': ['正在匯出…', 'Exporting…'],
  '请先选择要导出的帧': ['請先選擇要匯出的影格', 'Select the frames to export first'],
  '当前环境不支持 Canvas, 无法导出图片': ['目前環境不支援 Canvas，無法匯出圖片', 'Canvas is unavailable here, so images cannot be exported'],
  '已导出 {n} 个文件': ['已匯出 {n} 個檔案', 'Exported {n} files'],
  '精灵图已保存': ['精靈圖已儲存', 'Sprite sheet saved'],
  '导出失败: {msg}': ['匯出失敗: {msg}', 'Export failed: {msg}'],
  '有 {n} 个文件写入失败, 详见控制台': ['有 {n} 個檔案寫入失敗，詳見主控台', '{n} files failed to be written; see the console for details'],
  '导出完成: 共 {n} 个文件': ['匯出完成: 共 {n} 個檔案', 'Export finished: {n} files'],

  // 说明
  'GIF 拆解说明': ['GIF 拆解說明', 'About the GIF splitter'],
  '读取 GIF 的每一帧并按处置方式 (保留 / 还原背景 / 还原上一帧) 合成出完整画面, 全部在本地浏览器 / WebView 内完成, GIF 不会上传到任何服务器。': [
    '讀取 GIF 的每一格，並依處置方式 (保留 / 還原背景 / 還原上一格) 合成出完整畫面，全部在本機瀏覽器 / WebView 內完成，GIF 不會上傳到任何伺服器。',
    'Every frame of the GIF is read and composited into a full picture according to its disposal method (keep / restore to background / restore to previous) — all done locally in the browser or WebView; the GIF is never uploaded.',
  ],
  '预览可播放 / 暂停 / 逐帧步进, 并能调整播放速度; 帧列表给出延时、绘制区域与处置方式, 便于检查合成结果。': [
    '預覽可播放 / 暫停 / 逐格前進，並能調整播放速度; 影格列表提供延時、繪製區域與處置方式，便於檢查合成結果。',
    'The preview supports play / pause / step-by-step with adjustable speed; the frame list shows delay, drawing region and disposal method so you can verify the compositing.',
  ],
  '「导出选中帧」会为每帧输出一个 PNG, 桌面版选择一个文件夹后按「GIF 文件名/帧序号」写入; Web 演示版会逐个触发下载。': [
    '「匯出選中格」會為每格輸出一个 PNG，桌面版選擇一個資料夾後依「GIF 檔名/影格編號」寫入; Web 示範版會逐個觸發下載。',
    '"Export selected frames" writes one PNG per frame; the desktop build asks for a folder and writes them as "GIF name/frame number", while the web demo downloads them one by one.',
  ],
  '「导出精灵图」把选中帧按行列拼成一张 PNG (列数与间隔可调), 适合做素材图集或对照检查。': [
    '「匯出精靈圖」把選中格依列與行拼成一張 PNG (欄數與間隔可調)，適合做素材圖集或對照檢查。',
    '"Export sprite sheet" tiles the selected frames into a single PNG (columns and gap are adjustable) — handy as an asset sheet or for comparison.',
  ],
};

// 取词: 无命中回退 zh 原文
export const im = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
