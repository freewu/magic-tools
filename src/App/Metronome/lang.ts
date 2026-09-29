// Metronome 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '節拍器' },
  en: { appName: 'Metronome' },
} as const;

// 界面文案词条 (zh 短语即 key; 无命中回退 zh 原文)
const uilangRows: Record<string, [string, string]> = {
  // 顶部操作
  '开始': ['開始', 'Start'],
  '停止': ['停止', 'Stop'],
  '全屏': ['全屏', 'Fullscreen'],
  '退出全屏': ['退出全屏', 'Exit fullscreen'],
  '保存为默认设置': ['儲存為預設設定', 'Save as defaults'],
  '已保存为默认设置': ['已儲存為預設設定', 'Saved as defaults'],
  '键盘: 空格 开始 / 停止 · ↑↓ 调整速度 · Esc 退出全屏': [
    '鍵盤: 空白鍵 開始 / 停止 · ↑↓ 調整速度 · Esc 退出全屏',
    'Keys: Space start/stop · ↑↓ tempo · Esc exit fullscreen',
  ],

  // 参数区
  '速度 (BPM)': ['速度 (BPM)', 'Tempo (BPM)'],
  '拍号': ['拍號', 'Time signature'],
  '细分': ['細分', 'Subdivision'],
  '音量': ['音量', 'Volume'],
  '音色': ['音色', 'Timbre'],
  '首拍重音': ['首拍重音', 'Accent first beat'],
  '背景闪烁': ['背景閃爍', 'Flash background'],
  '倒计时': ['倒計時', 'Count-in'],
  '关闭': ['關閉', 'Off'],
  '{n} 拍': ['{n} 拍', '{n} beats'],
  '开始前先打 N 个预排拍, 再用不同音高提示正拍开始': [
    '開始前先打 N 個預排拍, 再用不同音高提示正拍開始',
    'Plays N count-in clicks first, then the regular beat starts (with a different pitch)',
  ],
  '常用速度': ['常用速度', 'Common tempos'],
  '连击测速': ['連擊測速', 'Tap tempo'],
  '点击此处测速 (至少 2 次)': ['點擊此處測速 (至少 2 次)', 'Tap here to measure (2+ taps)'],
  '再点一次开始新的一次测速': ['再點一次開始新的一次測速', 'Tap again to start a new measurement'],
  '已取样 {n} 次': ['已取樣 {n} 次', '{n} taps'],
  '重置': ['重置', 'Reset'],
  '静音': ['靜音', 'Muted'],

  // 拍号 / 细分 / 音色选项
  '{n} 拍 / 小节': ['{n} 拍 / 小節', '{n} beats / bar'],
  '不细分': ['不細分', 'None'],
  '{n} 连音': ['{n} 連音', '{n} per beat'],
  '电子嘀嗒': ['電子嘀嗒', 'Click'],
  '正弦蜂鸣': ['正弦蜂鳴', 'Beep'],
  '木鱼': ['木魚', 'Wood block'],

  // 舞台
  '第 {bar} 小节 · 第 {beat} 拍': ['第 {bar} 小節 · 第 {beat} 拍', 'Bar {bar} · beat {beat}'],
  '已播放 {t} · {n} 拍': ['已播放 {t} · {n} 拍', '{t} · {n} beats'],
  '倒数 {n} 拍': ['倒數 {n} 拍', '{n} beats to start'],
  '倒数中': ['倒數中', 'Counting in…'],
  '点击「开始」后这里会跟着节拍闪烁': ['點擊「開始」後這裡會跟著節拍閃爍', 'Hit Start and this dot will pulse with the beat'],
  '按 Esc 退出全屏': ['按 Esc 退出全屏', 'Press Esc to exit fullscreen'],
  '{bpm} BPM · {term}': ['{bpm} BPM · {term}', '{bpm} BPM · {term}'],

  // 异常
  '当前浏览器不支持 Web Audio, 无法播放节拍音': [
    '目前瀏覽器不支援 Web Audio, 無法播放節拍音',
    'This browser does not support Web Audio — the click sound is unavailable',
  ],
  '音频被浏览器挂起, 请再次点击「开始」': ['音訊被瀏覽器掛起, 請再次點擊「開始」', 'Audio was suspended by the browser — press Start again'],

  // 说明区标题
  ' 节拍器说明 ': [' 節拍器說明 ', ' About the metronome '],
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
