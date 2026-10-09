// ChatGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '聊天產生器' },
  en: { appName: 'Chat Generator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // ---- 卡片 / 工具栏 ----
  '编辑对话': ['編輯對話', 'Edit conversation'],
  '预览与导出': ['預覽與匯出', 'Preview & export'],
  '添加文字': ['新增文字', 'Add text'],
  '添加图片': ['新增圖片', 'Add image'],
  '添加语音': ['新增語音', 'Add voice'],
  '添加时间': ['新增時間', 'Add timestamp'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '导出 PNG': ['匯出 PNG', 'Export PNG'],
  '导出中…': ['匯出中…', 'Exporting…'],
  '已导出 PNG': ['已匯出 PNG', 'PNG exported'],
  '导出失败: {msg}': ['匯出失敗: {msg}', 'Export failed: {msg}'],
  '已清空对话': ['已清空對話', 'Conversation cleared'],
  '已载入示例对话': ['已載入範例對話', 'Sample conversation loaded'],

  // ---- 会话信息 ----
  '聊天标题': ['聊天標題', 'Chat title'],
  '副标题': ['副標題', 'Subtitle'],
  '对方昵称': ['對方暱稱', 'Their name'],
  '我的昵称': ['我的暱稱', 'My name'],
  '对方头像': ['對方頭像', 'Their avatar'],
  '我的头像': ['我的頭像', 'My avatar'],
  '上传头像': ['上傳頭像', 'Upload avatar'],
  '移除头像': ['移除頭像', 'Remove avatar'],
  '头像仅本地使用, 不会上传': ['頭像僅在本機使用, 不會上傳', 'Avatars are used locally only and never uploaded'],
  '显示昵称': ['顯示暱稱', 'Show names'],
  '在气泡上方显示昵称': ['在氣泡上方顯示暱稱', 'Show the nickname above each bubble'],

  // ---- 手机状态栏 ----
  '手机状态栏': ['手機狀態列', 'Phone status bar'],
  '系统': ['系統', 'System'],
  '安卓': ['安卓', 'Android'],
  '时间': ['時間', 'Time'],
  '电量': ['電量', 'Battery'],
  '充电中': ['充電中', 'Charging'],
  '信号': ['訊號', 'Signal'],
  '格': ['格', 'bars'],
  '网络': ['網路', 'Network'],
  '显示底部输入栏': ['顯示底部輸入欄', 'Show bottom input bar'],
  '时间格式应为 HH:MM (如 9:41)': ['時間格式應為 HH:MM (如 9:41)', 'Time format should be HH:MM (e.g. 9:41)'],

  // ---- 消息列表 ----
  '消息 (共 {n} 条)': ['訊息 (共 {n} 則)', 'Messages ({n})'],
  '暂无消息, 点上方按钮添加一条吧': ['尚無訊息, 點上方按鈕新增一則吧', 'No messages yet — add one with the buttons above'],
  '请在左侧添加或编辑消息': ['請在左側新增或編輯訊息', 'Add or edit messages on the left'],
  '内容': ['內容', 'Content'],
  '对方': ['對方', 'Them'],
  '我': ['我', 'Me'],
  '文字': ['文字', 'Text'],
  '图片': ['圖片', 'Image'],
  '语音': ['語音', 'Voice'],
  '选择图片': ['選擇圖片', 'Choose image'],
  '替换图片': ['替換圖片', 'Replace image'],
  '时长 (秒)': ['時長 (秒)', 'Duration (s)'],
  '时间分隔文案': ['時間分隔文案', 'Timestamp label'],
  '上移': ['上移', 'Move up'],
  '下移': ['下移', 'Move down'],
  '删除': ['刪除', 'Delete'],
  '消息条数已达上限 {max} 条': ['訊息則數已達上限 {max} 則', 'Message limit of {max} reached'],
  '图片过大 (超过 {size} MB), 请压缩后重试': ['圖片過大 (超過 {size} MB), 請壓縮後重試', 'Image is too large (over {size} MB); please compress it and retry'],
  '读取图片失败: {msg}': ['讀取圖片失敗: {msg}', 'Failed to read the image: {msg}'],

  // ---- 导出 ----
  '导出倍率': ['匯出倍率', 'Export scale'],
  '输入消息': ['輸入訊息', 'Type a message'],

  // ---- 说明 ----
  '聊天生成器说明': ['聊天產生器說明', 'About the chat generator'],
  '可切换 9 个平台: 微信 / QQ / Slack / Telegram / Discord / WhatsApp / LINE / 钉钉 / 飞书': [
    '可切換 9 個平台: 微信 / QQ / Slack / Telegram / Discord / WhatsApp / LINE / 釘釘 / 飛書',
    'Switch between 9 platforms: WeChat / QQ / Slack / Telegram / Discord / WhatsApp / LINE / DingTalk / Feishu',
  ],
  '支持文字 / 图片 / 语音 / 时间分隔四类消息, 可上移下移调整顺序': [
    '支援文字 / 圖片 / 語音 / 時間分隔四類訊息, 可上移下移調整順序',
    'Text / image / voice / timestamp messages, reorderable with move up & down',
  ],
  '可设置标题、昵称、头像与手机状态栏 (系统 / 时间 / 电量 / 信号 / 网络) 等细节': [
    '可設定標題、暱稱、頭像與手機狀態列 (系統 / 時間 / 電量 / 訊號 / 網路) 等細節',
    'Configurable title, names, avatars and the phone status bar (system / time / battery / signal / network)',
  ],
  '全部内容在本地渲染并导出 PNG, 不联网、不上传任何数据': [
    '全部內容在本機渲染並匯出 PNG, 不連網、不上傳任何資料',
    'Everything is rendered locally and exported as PNG — no network, nothing uploaded',
  ],
  '样式为各平台风格的近似模拟, 与官方客户端存在差异; 请勿用于伪造真实聊天记录或任何违法用途': [
    '樣式為各平台風格的近似模擬, 與官方客戶端存在差異; 請勿用於偽造真實聊天紀錄或任何違法用途',
    'Styles are stylised approximations of each platform and differ from the official clients; do not use them to fake real chat records or for any unlawful purpose',
  ],
};

// 取词: 无命中回退 zh 原文
export const cr = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};

export const crT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = cr(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
