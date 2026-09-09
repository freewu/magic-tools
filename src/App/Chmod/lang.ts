// Chmod 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "Chmod 權限" },
  en: { appName: "chmod Permissions" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已解读: {a} / {b}': ['已解讀: {a} / {b}', 'Parsed: {a} / {b}'],
  '解读失败: {m}': ['解讀失敗: {m}', 'Parse failed: {m}'],
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '对象': ['物件', 'Object'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  '读': ['讀', 'Read'],
  '写': ['寫', 'Write'],
  '执行': ['執行', 'Execute'],
  '属主 (u)': ['屬主 (u)', 'Owner (u)'],
  '属组 (g)': ['屬組 (g)', 'Group (g)'],
  '其它 (o)': ['其它 (o)', 'Others (o)'],
  '属主 (user / u)': ['屬主 (user / u)', 'Owner (user / u)'],
  '属组 (group / g)': ['屬組 (group / g)', 'Group (group / g)'],
  '其它 (other / o)': ['其它 (other / o)', 'Others (other / o)'],
  '输入 755 / 4755 / -rwxr-xr-x / chmod 命令': ['輸入 755 / 4755 / -rwxr-xr-x / chmod 命令', 'Enter 755 / 4755 / -rwxr-xr-x / a chmod command'],
  '解读': ['解讀', 'Parse'],
  '解读结果会同步到下方勾选区': ['解讀結果會同步到下方勾選區', 'The parsed result is synced to the checkboxes below'],
  '配置权限 (勾选后实时生成命令)': ['設定權限 (勾選後即時產生命令)', 'Set permissions (the command is generated live)'],
  '特殊位': ['特殊位', 'Special bits'],
  'setuid (4)': ['setuid (4)', 'setuid (4)'],
  'setgid (2)': ['setgid (2)', 'setgid (2)'],
  'sticky (1)': ['sticky (1)', 'sticky (1)'],
  '数值': ['數值', 'Numeric'],
  '符号': ['符號', 'Symbols'],
  '权限含义': ['權限含義', 'Permission meaning'],
  '无权限': ['無權限', 'No permission'],
  '文件名:': ['檔名:', 'File name:'],
  '复制命令': ['複製命令', 'Copy command'],
  '符号写法:': ['符號寫法:', 'Symbolic mode:'],
  'ls 显示:': ['ls 顯示:', 'ls display:'],
  '数字:': ['數字:', 'Numeric:'],
  ' chmod 权限说明 ': [' chmod 權限說明 ', ' chmod notes '],
  '数字': ['數字', 'Numeric'],
  '含义': ['含義', 'Meaning'],
  'Linux 权限分三组：属主 (u)、属组 (g)、其它 (o)，每组含读 (r=4)、写 (w=2)、执行 (x=1) 三个位，数值求和即为 0-7 的数字权限。数字串从左到右依次为 u/g/o，如': ['Linux 權限分三組：屬主 (u)、屬組 (g)、其它 (o)，每組含讀 (r=4)、寫 (w=2)、執行 (x=1) 三個位，數值求和即為 0-7 的數字權限。數字串從左到右依序為 u/g/o，如', 'Linux permissions have three scopes: owner (u), group (g) and others (o). Each scope has read (r=4), write (w=2) and execute (x=1) bits; summing them gives the 0-7 numeric permission. The digits map to u/g/o from left to right, e.g.'],
  '= u:rwx, g:r-x, o:r-x。': ['= u:rwx, g:r-x, o:r-x。', '= u:rwx, g:r-x, o:r-x.'],
  '首位为特殊位：4 = setuid（执行时以属主身份运行，如 passwd）、2 = setgid（目录内新建文件继承属组）、1 = sticky（仅属主可删除，如 /tmp）。ls 显示时 setuid/setgid 使 x 变为小写 s（无执行则为大写 S），sticky 使其它执行位变为 t/T。': ['首位為特殊位：4 = setuid（執行時以屬主身份執行，如 passwd）、2 = setgid（目錄內新建檔案繼承屬組）、1 = sticky（僅屬主可刪除，如 /tmp）。ls 顯示時 setuid/setgid 使 x 變成小寫 s（無執行則為大寫 S），sticky 使其它執行位變成 t/T。', 'The first digit is the special bit: 4 = setuid (runs with the owner identity, e.g. passwd), 2 = setgid (new files in the directory inherit the group), 1 = sticky (only the owner may delete, e.g. /tmp). In ls output, setuid/setgid turns x into lowercase s (uppercase S when not executable) and sticky turns the others-execute bit into t/T.'],
  'px': ['px', 'px'],
  '生成': ['產生', 'Generate'],
  '次': ['次', 'times'],
  '位': ['位', 'bits'],
  '校验': ['校驗', 'Verify'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '字符': ['字元', 'Characters'],
  '删除': ['刪除', 'Delete'],
  '个': ['個', ''],
  '每': ['每', 'Every'],
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

