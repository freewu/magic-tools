// Teleprompter 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '提詞器' },
  en: { appName: 'Teleprompter' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  // 脚本
  '提词脚本': ['提詞腳本', 'Script'],
  '在此粘贴或输入提词脚本…': ['在此貼上或輸入提詞腳本…', 'Paste or type your script here…'],
  '载入示例': ['載入範例', 'Load sample'],
  '随机换一首示例 (中英文各有两首示范诗)': [
    '隨機換一首範例 (中英文各有兩首示範詩)',
    'Load another sample (two demo poems per language)',
  ],
  '清空': ['清空', 'Clear'],
  '{l} 行 / {c} 字符 / 全文约 {time}': ['{l} 行 / {c} 字元 / 全文約 {time}', '{l} lines / {c} chars / about {time} in total'],

  // 排版
  '字号': ['字號', 'Font size'],
  '行距': ['行距', 'Line height'],
  '淡入淡出': ['淡入淡出', 'Fade edges'],
  '逐行高亮': ['逐行高亮', 'Line focus'],
  '逐行焦点: 高亮当前阅读行, 并按阅读进度从左到右逐字点亮; 离它越远的行越透明、颜色越淡': [
    '逐行焦點: 高亮目前閱讀行, 並依閱讀進度由左至右逐字點亮; 離它越遠的行越透明、顏色越淡',
    'The line at the reading point is highlighted and lit word by word from left to right; the further away a line is, the more transparent and dimmer it becomes',
  ],
  '基准线': ['基準線', 'Guide line'],
  '阅读基准线: 在阅读线位置显示一条横线, 方便对准视线; 可自定义颜色, 也可上下调整位置': [
    '閱讀基準線: 在閱讀線位置顯示一條橫線, 方便對準視線; 可自訂顏色, 也可上下調整位置',
    'Reading guide line: a horizontal line at the reading point so you can aim your eyes; pick any colour and move it up or down',
  ],
  '基准线位置': ['基準線位置', 'Guide line position'],
  '基准线位置: 拖动滑块或在舞台上直接上下拖这条线, 把视线定在舒服的高度 (占舞台高度的比例)': [
    '基準線位置: 拖動滑桿或在舞台上直接上下拖這條線, 把視線定在舒服的高度 (占舞台高度的比例)',
    'Guide line position: drag the slider, or drag the line itself up and down on the stage, to put it at a comfortable height (share of the stage height)',
  ],
  '按住上下拖动, 调整基准线位置': ['按住上下拖動, 調整基準線位置', 'Drag up / down to move the guide line'],
  '保存为默认设置': ['儲存為預設設定', 'Save as defaults'],
  '已保存为默认设置, 下次打开提词器时生效': [
    '已儲存為預設設定, 下次開啟提詞器時生效',
    'Saved as defaults — it will apply next time you open the teleprompter',
  ],
  '把当前的速度 / 字号 / 行距 / 淡入淡出 / 逐行高亮 / 基准线(颜色·位置) / 倒计时存为默认值, 下次打开时沿用; 也可在 设置 → 其它 → 提词器 中修改': [
    '把目前的速度 / 字號 / 行距 / 淡入淡出 / 逐行高亮 / 基準線(顏色·位置) / 倒計時存為預設值, 下次開啟時沿用; 也可在 設定 → 其他 → 提詞器 中修改',
    'Store the current speed / font size / line height / fade / line focus / guide line (colour · position) / countdown as the defaults used next time; they can also be edited in Settings → Utilities → Teleprompter',
  ],

  // 倒计时
  '倒计时': ['倒計時', 'Countdown'],
  '关闭': ['關閉', 'Off'],
  '{n} 秒': ['{n} 秒', '{n} s'],
  '取消倒计时': ['取消倒計時', 'Cancel countdown'],
  '倒计时 {n} 秒': ['倒計時 {n} 秒', '{n}s to start'],
  '开始前先倒数, 留出时间看向镜头 / 做好准备; 再点一次「开始」或按空格可取消': [
    '開始前先倒數, 留出時間看向鏡頭 / 做好準備; 再點一次「開始」或按空白鍵可取消',
    'Counts down before scrolling starts, giving you a moment to look at the camera and get ready; press Start or Space again to cancel',
  ],
  '边缘淡入淡出: 文字在上下边缘渐隐, 更接近真实提词器': [
    '邊緣淡入淡出: 文字在上下邊緣漸隱, 更接近真實提詞器',
    'Fade the top and bottom edges so lines dissolve in and out, like a real teleprompter',
  ],

  // 播放控制
  '提词器': ['提詞器', 'Prompter'],
  '开始': ['開始', 'Start'],
  '暂停': ['暫停', 'Pause'],
  '重新播放': ['重新播放', 'Play again'],
  '回到开头': ['回到開頭', 'Back to start'],
  '全屏': ['全屏', 'Fullscreen'],
  '退出全屏': ['退出全屏', 'Exit fullscreen'],
  '速度': ['速度', 'Speed'],
  '剩余 {time}': ['剩餘 {time}', '{time} left'],
  '播放结束': ['播放結束', 'Finished'],
  '请先在上方输入提词脚本': ['請先在上方輸入提詞腳本', 'Type a script above to begin'],
  '空格 开始/暂停/取消倒计时 · ↑↓ 调速 · Shift+↑↓ 移动基准线 · Esc 退出全屏': [
    '空格 開始/暫停/取消倒計時 · ↑↓ 調速 · Shift+↑↓ 移動基準線 · Esc 退出全屏',
    'Space: start / pause / cancel countdown · ↑↓: speed · Shift+↑↓: move guide line · Esc: exit fullscreen',
  ],

  // 说明区标题
  ' 提词器说明 ': [' 提詞器說明 ', ' About the teleprompter '],
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
