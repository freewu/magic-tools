// RobotsTxtGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "robots.txt Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '清空': ['清空', 'Clear'],
  ' 行': [' 行', ' line'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '保存 robots.txt 文件': ['儲存 robots.txt 檔案', 'Save robots.txt file'],
  '爬虫 User-agent': ['爬蟲 User-agent', 'Crawler User-agent'],
  '为不同爬虫分组时, 请按此页生成多次再合并': ['為不同爬蟲分組時, 請依此頁生成多次再合併', 'To give each crawler its own rules, generate this page once per group and merge the results'],
  '抓取规则': ['抓取規則', 'Crawl rules'],
  '禁止 (Disallow)': ['禁止 (Disallow)', 'Disallow'],
  '允许 (Allow)': ['允許 (Allow)', 'Allow'],
  '清空规则': ['清空規則', 'Clear rules'],
  '禁止': ['禁止', 'Disallow'],
  '允许': ['允許', 'Allow'],
  '路径, 如 /admin/': ['路徑, 如 /admin/', 'Path, e.g. /admin/'],
  '当前无规则 = 允许爬虫抓取全部页面 (等效放行)': ['目前無規則 = 允許爬蟲抓取全部頁面 (等同放行)', 'No rules at all means crawlers may fetch every page (allow-all)'],
  '秒': ['秒', 'seconds'],
  '抓取间隔秒数 (留空不输出; 部分爬虫不支持)': ['抓取間隔秒數 (留空不輸出; 部分爬蟲不支援)', 'Seconds to wait between fetches (omit if blank; not supported by every crawler)'],
  '每行一个 Sitemap 地址, 如 https://example.com/sitemap.xml': ['每行一個 Sitemap 地址, 如 https://example.com/sitemap.xml', 'One Sitemap URL per line, e.g. https://example.com/sitemap.xml'],
  '快捷模板': ['快捷範本', 'Quick templates'],
  '预览': ['預覽', 'Preview'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy the content'],
  '保存为 robots.txt': ['儲存為 robots.txt', 'Save as robots.txt'],
  'robots.txt 生成说明': ['robots.txt 產生說明', 'About robots.txt'],
  '* (所有爬虫)': ['* (所有爬蟲)', '* (all crawlers)'],
  'Googlebot (谷歌)': ['Googlebot (谷歌)', 'Googlebot (Google)'],
  'Baiduspider (百度)': ['Baiduspider (百度)', 'Baiduspider (Baidu)'],
  'Bingbot (必应)': ['Bingbot (必應)', 'Bingbot (Bing)'],
  'Sogou (搜狗)': ['Sogou (搜狗)', 'Sogou (Sogou)'],
  '360Spider (360)': ['360Spider (360)', '360Spider (360)'],
  'Bytespider (字节跳动)': ['Bytespider (位元組跳動)', 'Bytespider (ByteDance)'],
  'YandexBot (Yandex)': ['YandexBot (Yandex)', 'YandexBot (Yandex)'],
  'PetalBot (华为)': ['PetalBot (華為)', 'PetalBot (Huawei)'],
  '示例: 禁止后台目录': ['範例: 禁止後台目錄', 'Example: block admin paths'],
  '允许全部抓取': ['允許全部抓取', 'Allow all crawlers'],
  '禁止全站抓取': ['禁止全站抓取', 'Block the whole site'],
  '抓取': ['抓取', 'Fetch'],
  '值': ['值', 'Value'],
  '是': ['是', 'Yes'],
  '生成': ['產生', 'Generate'],
  '双击复制内容': ['雙擊複製內容', 'Double-click to copy'],
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

