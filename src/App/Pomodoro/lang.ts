// Pomodoro 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '番茄鐘' },
  en: { appName: 'Pomodoro timer' },
} as const;

// 界面文案词条 (zh 短语即 key)
const uilangRows: Record<string, [string, string]> = {
  '番茄时钟': ['番茄鐘', 'Pomodoro timer'],
  '专注': ['專注', 'Focus'],
  '短休息': ['短休息', 'Short break'],
  '长休息': ['長休息', 'Long break'],
  '开始': ['開始', 'Start'],
  '全屏': ['全屏', 'Fullscreen'],
  '退出全屏': ['退出全屏', 'Exit fullscreen'],
  '暂停': ['暫停', 'Pause'],
  '重置': ['重置', 'Reset'],
  '跳过当前阶段': ['跳過目前階段', 'Skip phase'],
  '第 {n} 轮': ['第 {n} 輪', 'Round {n}'],
  '专注 {m} 分钟': ['專注 {m} 分鐘', '{m} min focus'],
  '短休 {m} 分钟': ['短休 {m} 分鐘', '{m} min short break'],
  '长休 {m} 分钟': ['長休 {m} 分鐘', '{m} min long break'],
  '进行中': ['進行中', 'Running'],
  '已暂停': ['已暫停', 'Paused'],
  '专注时长 (分钟)': ['專注時長 (分鐘)', 'Focus length (min)'],
  '短休息 (分钟)': ['短休息 (分鐘)', 'Short break (min)'],
  '长休息 (分钟)': ['長休息 (分鐘)', 'Long break (min)'],
  '每几个专注后长休': ['每幾個專注後長休', 'Long break after'],
  '完成提示音': ['完成提示音', 'Alert sound'],
  '提示次数': ['提示次數', 'Repeat count'],
  '自定义音频文件': ['自訂音訊檔案', 'Custom audio file'],
  '选择音频文件…': ['選擇音訊檔…', 'Choose audio…'],
  '更改音频文件': ['更改音訊檔', 'Change audio'],
  '音量': ['音量', 'Volume'],
  '背景颜色': ['背景顏色', 'Background color'],
  '背景': ['背景', 'Background'],
  '纯色': ['純色', 'Solid color'],
  '图片': ['圖片', 'Image'],
  '专注/休息同一张': ['專注/休息同一張', 'Same image for focus & break'],
  '背景图片': ['背景圖片', 'Background image'],
  '专注背景图': ['專注背景圖', 'Focus background'],
  '休息背景图': ['休息背景圖', 'Break background'],
  '选择图片…': ['選擇圖片…', 'Choose image…'],
  '更换图片…': ['更換圖片…', 'Change image'],
  '清除': ['清除', 'Clear'],
  '遮罩': ['遮罩', 'Overlay'],
  '模糊': ['模糊', 'Blur'],
  '正在处理图片…': ['正在處理圖片…', 'Processing image…'],
  '请选择图片文件…': ['請選擇圖片檔…', 'Please choose an image file'],
  '图片过大, 请换一张或先压缩': ['圖片過大, 請換一張或先壓縮', 'Image is too large — pick another or compress it first'],
  '图片读取失败, 请重试': ['圖片讀取失敗, 請重試', 'Failed to read the image — please try again'],
  '默认设置已应用, 但本地存储写入失败 (图片过大?), 重开后可能丢失': ['預設設定已套用, 但本機儲存寫入失敗 (圖片過大?), 重開後可能遺失', 'Defaults applied, but saving to local storage failed (image too large?) — they may be lost after reopening'],
  '专注颜色': ['專注顏色', 'Focus color'],
  '休息颜色': ['休息顏色', 'Break color'],
  '完成时弹通知': ['完成時彈通知', 'Notify on finish'],
  '自动开始下一阶段': ['自動開始下一階段', 'Auto-start next phase'],
  '保存为默认设置': ['儲存為預設設定', 'Save as defaults'],
  '已保存为默认设置': ['已儲存為預設設定', 'Saved as defaults'],
  '阶段结束提醒': ['階段結束提醒', 'Phase finished'],
  '该休息一下了 / 该开始专注了': ['該休息一下了 / 該開始專注了', 'Time to take a break / time to focus'],
  '浏览器通知被拒绝, 已在页面内提示': ['瀏覽器通知被拒絕, 已在頁面內提示', 'Notifications are blocked — showing an on-page notice instead'],
  '完成 {n} 个番茄, 进入长休息': ['完成 {n} 個番茄, 進入長休息', '{n} pomodoros done — take a long break'],
  '音频文件仅本机播放, 不会上传': ['音訊檔僅本機播放, 不會上傳', 'The audio file is played locally and never uploaded'],
  // 音色
  '叮 — 清脆': ['叮 — 清脆', 'Ding — crisp'],
  '钟声 — 悠长': ['鐘聲 — 悠長', 'Bell — lingering'],
  '哔哔哔 — 三连': ['嗶嗶嗶 — 三連', 'Beep — triple'],
  '木鱼 — 短促': ['木魚 — 短促', 'Wood block — short'],
  '风铃 — 清脆高音': ['風鈴 — 清脆高音', 'Chime — light highs'],
  '自定义音频': ['自訂音訊', 'Custom audio'],
  ' 番茄时钟说明 ': [' 番茄鐘說明 ', ' About the pomodoro timer '],
  '提示音重复播放次数 (1-5)': ['提示音重複播放次數 (1-5)', 'How many times the alert sound repeats (1-5)'],
};

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
