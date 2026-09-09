// KeyboardKeyInfo 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "鍵盤按鍵資訊" },
  en: { appName: "Keyboard Key Info" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '清空': ['清空', 'Clear'],
  '格式化': ['格式化', 'Format'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  '读': ['讀', 'Read'],
  '数字': ['數字', 'Numeric'],
  '刷新': ['重新整理', 'Refresh'],
  '次': ['次', 'times'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  '字符': ['字元', 'Characters'],
  '标准': ['標準', 'Standard'],
  '小键盘': ['數字鍵盤', 'Keypad'],
  '移动端': ['行動端', 'Mobile'],
  '游戏手柄': ['遊戲手把', 'Gamepad'],
  'Space (空格)': ['Space (空白)', 'Space'],
  '(无字符)': ['(無字元)', '(no char)'],
  '(无 code)': ['(無 code)', '(no code)'],
  '时间': ['時間', 'Time'],
  '按键': ['按鍵', 'Key'],
  '位置': ['位置', 'Location'],
  '修饰键': ['修飾鍵', 'Modifiers'],
  '时长': ['時長', 'Duration'],
  '按键信息会实时捕获: 无需聚焦本页面, 在应用任意位置按下/松开键盘即可看到结果。': ['按鍵資訊會即時擷取: 無需聚焦本頁面, 在應用任意位置按下/放開鍵盤即可看到結果。', 'Keys are captured in real time: without focusing this page, press/release any key anywhere in the app to see results.'],
  '按任意键查看按键信息…': ['按任意鍵查看按鍵資訊…', 'Press any key to inspect…'],
  '位置: {l}': ['位置: {l}', 'Location: {l}'],
  '修饰键: {m}': ['修飾鍵: {m}', 'Modifiers: {m}'],
  '按住: {d}': ['按住: {d}', 'Held: {d}'],
  '自动重复 ×{n}': ['自動重複 ×{n}', 'Auto-repeat ×{n}'],
  '(按键时同步刷新; 修饰键组合见上方 Tag)': ['(按鍵時同步更新; 修飾鍵組合見上方 Tag)', '(refreshes on key press; modifier combos shown in the tags above)'],
  '最近按键记录': ['最近按鍵記錄', 'Recent key history'],
  '清空记录': ['清空記錄', 'Clear history'],
  '每': ['每', 'Every'],
  '秒': ['秒', 's'],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
  '或': ['或', 'OR'],
};

// 取词: 无命中回退 zh 原文 (与共享 ui-lang 行为一致)
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

