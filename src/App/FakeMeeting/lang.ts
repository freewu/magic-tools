// FakeMeeting 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "假裝開會" },
  en: { appName: "Fake Meeting" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
// 注: 会议软件自身的按钮文案在 lib.ts 中按产品配置 (三语), 这里只放本工具界面用词
const fmLangRows: Record<string, [string, string]> = {
  '界面风格': ['介面風格', 'Interface'],
  '会议主题': ['會議主題', 'Meeting topic'],
  '我的名字': ['我的名字', 'My name'],
  '点击改名': ['點擊改名', 'Click to rename'],
  '参会人数': ['參會人數', 'Participants'],
  '会议号': ['會議號', 'Meeting ID'],
  '起始时长 (分钟)': ['起始時長 (分鐘)', 'Start offset (min)'],
  '暂停计时': ['暫停計時', 'Pause timer'],
  '继续计时': ['繼續計時', 'Resume timer'],
  '计时': ['計時', 'Timer'],
  '录制红点': ['錄製紅點', 'Recording dot'],
  '沉浸模式': ['沉浸模式', 'Immersive'],
  '退出沉浸': ['退出沉浸', 'Exit immersive'],
  '我的画面': ['我的畫面', 'My video'],
  '打开摄像头': ['開啟攝影機', 'Start camera'],
  '关闭摄像头': ['關閉攝影機', 'Stop camera'],
  '上传画面图片': ['上傳畫面圖片', 'Upload image'],
  '清除画面': ['清除畫面', 'Clear'],
  '背景人声': ['背景人聲', 'Background murmur'],
  '音量': ['音量', 'Volume'],
  '人声不可用 (当前环境不支持音频)': [
    '人聲無法使用 (目前環境不支援音訊)',
    'Murmur unavailable (audio not supported here)',
  ],
  '摄像头不可用或未授权': ['攝影機無法使用或未授權', 'Camera unavailable or not permitted'],
  '读取文件失败': ['讀取檔案失敗', 'Failed to read the file'],
  '图片解析失败, 请确认文件格式': ['圖片解析失敗, 請確認檔案格式', 'Failed to decode the image — check the file format'],
  '正在共享屏幕': ['正在共享螢幕', 'sharing the screen'],
  '参会者': ['參會者', 'Participants'],
  '聊天': ['聊天', 'Chat'],
  '主持人': ['主持人', 'Host'],
  '我': ['我', 'Me'],
  '(我)': ['(我)', '(me)'],
  '已加密': ['已加密', 'Encrypted'],
  '会议中': ['會議中', 'In meeting'],
  '说点什么…': ['說點什麼…', 'Type a message'],
  '发送': ['傳送', 'Send'],
  '邀请': ['邀請', 'Invite'],
  '一键演示: 点击「沉浸模式」全屏展示, 按 Esc 退出; 界面完全在本地渲染, 不上传任何数据': [
    '一鍵演示: 點擊「沉浸模式」全螢幕展示, 按 Esc 退出; 介面完全在本機渲染, 不上傳任何資料',
    'Present it: click "Immersive" for a fullscreen view, Esc to exit. Everything renders locally — nothing is uploaded',
  ],
  '摄像头与麦克风仅在本机使用, 不会上传': [
    '攝影機與麥克風僅在本機使用, 不會上傳',
    'Camera and mic stay on this device and are never uploaded',
  ],
};

// 取词: 无命中回退 zh 原文 (与共享 image-lang 行为一致)
export const im = (locale: string, zh: string): string => {
  const e = fmLangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
