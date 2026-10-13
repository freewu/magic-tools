// GifGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'GIF 生成' },
  en: { appName: 'GIF Generator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 选择图片
  '点击选择图片, 或把多张图片拖到这里': ['點擊選擇圖片，或把多張圖片拖到這裡', 'Click to choose images, or drag several images here'],
  '松开鼠标即可载入图片': ['放開滑鼠即可載入圖片', 'Release to load the images'],
  '按添加顺序排列, 可用上移 / 下移 / 反转调整帧顺序; 最多 {n} 张': [
    '依加入順序排列，可用上移 / 下移 / 反轉調整影格順序; 最多 {n} 張',
    'Frames follow the order they were added; use move up / move down / reverse to rearrange (max {n})',
  ],
  '选择图片': ['選擇圖片', 'Choose images'],
  '清空': ['清空', 'Clear'],
  '还没有选择图片': ['還沒有選擇圖片', 'No images selected yet'],
  '读取图片失败: {msg}': ['讀取圖片失敗: {msg}', 'Failed to read the image: {msg}'],
  '图片过多 (最多 {n} 张), 已忽略多余的图片': [
    '圖片過多 (最多 {n} 張)，已忽略多餘的圖片',
    'Too many images (max {n}); the extra ones were ignored',
  ],
  '已添加 {n} 张图片': ['已加入 {n} 張圖片', 'Added {n} images'],

  // 概览与输出设置
  '共 {n} 帧, 画布 {w} × {h} px, 总时长 {dur}, {loop}': [
    '共 {n} 格，畫布 {w} × {h} px，總時長 {dur}，{loop}',
    '{n} frames, canvas {w} × {h} px, total {dur}, {loop}',
  ],
  '无限循环': ['無限循環', 'Loops forever'],
  '循环 {n} 次': ['循環 {n} 次', 'Loops {n} times'],
  '输出设置': ['輸出設定', 'Output settings'],
  '尺寸模式': ['尺寸模式', 'Sizing mode'],
  '画布宽度': ['畫布寬度', 'Canvas width'],
  '画布高度': ['畫布高度', 'Canvas height'],
  '帧延时 (ms)': ['影格延時 (ms)', 'Frame delay (ms)'],
  '延时 (ms)': ['延時 (ms)', 'Delay (ms)'],
  '改动后应用到所有帧': ['改動後套用到所有影格', 'Applying it updates every frame'],
  '应用到全部帧': ['套用到全部影格', 'Apply to all frames'],
  '循环次数': ['循環次數', 'Loop count'],
  '0 表示无限循环': ['0 表示無限循環', '0 means loop forever'],
  '最大颜色数': ['最大顏色數', 'Max colors'],
  '抖动': ['抖動', 'Dithering'],
  '透明': ['透明', 'Transparent'],
  '背景透明': ['背景透明', 'Transparent background'],
  '背景色 {c}': ['背景色 {c}', 'Background {c}'],

  // 尺寸模式 / 抖动方式
  '完整显示 (留白)': ['完整顯示 (留白)', 'Fit (letterbox)'],
  '裁剪填满': ['裁切填滿', 'Cover (crop)'],
  '拉伸铺满': ['拉伸鋪滿', 'Stretch'],
  '跟随第一张图': ['跟隨第一張圖', 'Follow the first image'],
  '图片整张放进画布, 比例不变, 空隙用背景色 / 透明填充': [
    '圖片整張放進畫布，比例不變，空隙用背景色 / 透明填充',
    'The whole image is placed on the canvas without distortion; gaps take the background colour or stay transparent',
  ],
  '图片放大到铺满画布, 超出部分裁掉, 比例不变': [
    '圖片放大到鋪滿畫布，超出部分裁掉，比例不變',
    'The image is scaled up to fill the canvas and cropped, keeping its aspect ratio',
  ],
  '图片拉伸到画布尺寸, 比例可能变形': [
    '圖片拉伸到畫布尺寸，比例可能變形',
    'The image is stretched to the canvas size, which may distort it',
  ],
  '画布尺寸跟随第一张图, 后面的图片按比例放入': [
    '畫布尺寸跟隨第一張圖，後面的圖片依比例放入',
    'The canvas matches the first image and later images are fitted into it',
  ],
  '不抖动': ['不抖動', 'None'],
  'Floyd-Steinberg': ['Floyd-Steinberg', 'Floyd-Steinberg'],
  'Atkinson': ['Atkinson', 'Atkinson'],
  'Stucki': ['Stucki', 'Stucki'],

  // 预览
  '动画预览': ['動畫預覽', 'Animation preview'],
  '播放': ['播放', 'Play'],
  '暂停': ['暫停', 'Pause'],
  '第 {i} / {n} 帧, 延时 {delay}': ['第 {i} / {n} 格，延時 {delay}', 'Frame {i} / {n}, delay {delay}'],

  // 帧列表
  '帧列表': ['影格列表', 'Frames'],
  '共 {n} 帧': ['共 {n} 格', '{n} frames'],
  '反转顺序': ['反轉順序', 'Reverse order'],
  '缩略图': ['縮圖', 'Thumbnail'],
  '帧号': ['影格編號', 'No.'],
  '文件名': ['檔名', 'File name'],
  '原始尺寸': ['原始尺寸', 'Source size'],
  '顺序 / 删除': ['順序 / 刪除', 'Order / Delete'],
  '上移': ['上移', 'Move up'],
  '下移': ['下移', 'Move down'],
  '删除': ['刪除', 'Delete'],

  // 生成与保存
  '生成 GIF': ['產生 GIF', 'Generate GIF'],
  '正在生成…': ['正在產生…', 'Generating…'],
  '保存 GIF': ['儲存 GIF', 'Save GIF'],
  '请先添加图片': ['請先加入圖片', 'Add some images first'],
  '当前环境不支持 Canvas, 无法生成 GIF': ['目前環境不支援 Canvas，無法產生 GIF', 'Canvas is unavailable here, so the GIF cannot be generated'],
  '已生成 GIF ({size})': ['已產生 GIF ({size})', 'GIF generated ({size})'],
  '文件名 {name}, 点「保存 GIF」写入磁盘 (Web 演示版会触发下载)': [
    '檔名 {name}，點「儲存 GIF」寫入磁碟 (Web 示範版會觸發下載)',
    'File name {name}; press “Save GIF” to write it to disk (the web demo downloads it instead)',
  ],
  '生成失败: {msg}': ['產生失敗: {msg}', 'Generation failed: {msg}'],
  '保存失败: {msg}': ['儲存失敗: {msg}', 'Saving failed: {msg}'],
  '已保存 {name}': ['已儲存 {name}', 'Saved {name}'],

  // 说明
  'GIF 生成说明': ['GIF 產生說明', 'About the GIF generator'],
  '把多张图片按添加顺序合成动画帧, 用 modern-gif 在本地编码成 GIF 文件, 图片不会上传到任何服务器。': [
    '把多張圖片依加入順序合成動畫影格，用 modern-gif 在本機編碼成 GIF 檔案，圖片不會上傳到任何伺服器。',
    'Images are turned into animation frames in the order they were added and encoded into a GIF locally with modern-gif; nothing is uploaded.',
  ],
  '多张图片尺寸不一致时按「尺寸模式」放入画布: 完整显示会留白, 裁剪填满会去掉多余部分, 拉伸铺满可能变形, 跟随第一张图则用首图尺寸当画布。': [
    '多張圖片尺寸不一致時依「尺寸模式」放入畫布: 完整顯示會留白，裁切填滿會去掉多餘部分，拉伸鋪滿可能變形，跟隨第一張圖則用首圖尺寸當畫布。',
    'When the images differ in size they are fitted according to the sizing mode: fit leaves gaps, cover crops the extra, stretch may distort, and “follow the first image” uses the first image as the canvas.',
  ],
  '帧延时决定动画速度, 逐帧可单独调整; 循环次数为 0 表示无限循环。颜色数越少文件越小, 抖动可让渐变更自然。': [
    '影格延時決定動畫速度，逐格可單獨調整; 循環次數為 0 表示無限循環。顏色數越少檔案越小，抖動可讓漸層更自然。',
    'Frame delay controls the animation speed and can be tuned per frame; a loop count of 0 means loop forever. Fewer colours make a smaller file, and dithering smooths gradients.',
  ],
  '背景透明时留白处没有像素 (棋盘格显示), 如需实色背景请关闭「透明」并选择背景色。': [
    '背景透明時留白處沒有像素 (棋盤格顯示)，如需實色背景請關閉「透明」並選擇背景色。',
    'With a transparent background the gaps hold no pixels (shown as a checkerboard); turn “Transparent” off and pick a colour for a solid background.',
  ],
  '生成后可先看预览确认顺序与速度, 再「保存 GIF」; 聊天表情包常用 240×240 / 320×320 的画布。': [
    '產生後可先看預覽確認順序與速度，再「儲存 GIF」; 聊天表情包常用 240×240 / 320×320 的畫布。',
    'Check the preview to confirm the order and speed, then save the GIF; chat stickers usually use a 240×240 or 320×320 canvas.',
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
