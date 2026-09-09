// CookieAnalyzer 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "Cookie Analyzer" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed — please select and copy manually'],
  '复制': ['複製', 'Copy'],
  '清空': ['清空', 'Clear'],
  ' 行': [' 行', ' line'],
  '输入': ['輸入', 'Input'],
  '复制 JSON': ['複製 JSON', 'Copy JSON'],
  'Cookie 字符串': ['Cookie 字串', 'Cookie string'],
  'Cookie 分析': ['Cookie 分析', 'Cookie Analyzer'],
  '自动识别三种输入：Cookie 字符串、HTTP 请求/响应头（Cookie:/Set-Cookie: 行）、document.cookie 赋值语句。解析后可按 JSON 对象 / JSON 数组 / 表格三种视图查看，并一键拼回 Cookie 请求头。': ['自動辨識三種輸入：Cookie 字串、HTTP 請求/回應標頭（Cookie:/Set-Cookie: 行）、document.cookie 賦值語句。解析後可用 JSON 物件 / JSON 陣列 / 表格三種檢視查看，並一鍵組回 Cookie 請求標頭。', 'Automatically detects three input kinds: a Cookie string, HTTP request/response headers (Cookie: / Set-Cookie: lines), or document.cookie assignment statements. Results can be viewed as a JSON object, JSON array, or table, and reassembled into a Cookie request header with one click.'],
  '原始输入': ['原始輸入', 'Raw input'],
  '已载入 {label} 示例': ['已載入 {label} 範例', '{label} sample loaded'],
  '粘贴 Cookie 数据, 三种格式均可:\n\n1) sessionid=abc123; theme=dark; HttpOnly\n2) 含 Cookie: / Set-Cookie: 行的 HTTP 报文片段\n3) document.cookie = "a=1; b=2";': ['貼上 Cookie 資料, 三種格式皆可:\n\n1) sessionid=abc123; theme=dark; HttpOnly\n2) 含 Cookie: / Set-Cookie: 行的 HTTP 報文片段\n3) document.cookie = "a=1; b=2";', 'Paste Cookie data in any of three formats:\n\n1) sessionid=abc123; theme=dark; HttpOnly\n2) an HTTP message fragment with Cookie: / Set-Cookie: lines\n3) document.cookie = "a=1; b=2";'],
  '识别为 {k}': ['辨識為 {k}', 'Detected as {k}'],
  '{c} 字符': ['{c} 字元', '{c} characters'],
  '解析结果': ['解析結果', 'Parse results'],
  '已复制当前视图内容': ['已複製目前檢視內容', 'Current view copied'],
  '复制 Cookie 串': ['複製 Cookie 字串', 'Copy Cookie string'],
  '已复制 name=value JSON': ['已複製 name=value JSON', 'name=value JSON copied'],
  '暂无结果 — 粘贴 Cookie 数据后自动解析。若粘贴了 Cookie 头请确保带 Cookie: 前缀。': ['暫無結果 — 貼上 Cookie 資料後會自動解析。若貼上了 Cookie 標頭, 請確認帶有 Cookie: 前綴。', 'No results yet — pasting Cookie data parses it automatically. If you pasted a Cookie header, keep the Cookie: prefix.'],
  'JSON 对象 ({n})': ['JSON 物件 ({n})', 'JSON object ({n})'],
  'JSON 数组 ({n})': ['JSON 陣列 ({n})', 'JSON array ({n})'],
  '表格 ({n})': ['表格 ({n})', 'Table ({n})'],
  '共解析 {n} 个 Cookie；拼接请求头: ': ['共解析 {n} 個 Cookie；拼接請求標頭: ', 'Parsed {n} cookies; request header: '],
  '名称': ['名稱', 'Name'],
  '值': ['值', 'Value'],
  '来源': ['來源', 'Source'],
  '字符串': ['字串', 'String'],
  '会话': ['工作階段', 'Session'],
  '是': ['是', 'Yes'],
  '未知': ['未知', 'Unknown'],
  '解析': ['解析', 'Parse'],
};

// 取词: 无命中回退 zh 原文 (与共享 webmaster-lang 行为一致)
export const wm = (locale: string, zh: string): string => {
  const e = webmasterlangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const wmT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = wm(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};

