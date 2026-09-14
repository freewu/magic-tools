// MockData 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "資料產生" },
  en: { appName: "Mock Data" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  '生成数量': ['產生數量', 'Records'],
  '输出格式': ['輸出格式', 'Output format'],
  'SQL 表名': ['SQL 表名', 'SQL table name'],
  '表名': ['表名', 'Table name'],
  '包含 CREATE TABLE 建表语句': ['包含 CREATE TABLE 建表語句', 'Include CREATE TABLE statement'],
  'CSV 包含表头': ['CSV 包含表頭', 'CSV header row'],
  '模板 (Mock.js 语法)': ['範本 (Mock.js 語法)', 'Template (Mock.js syntax)'],
  '生成数据': ['產生資料', 'Generate'],
  '填充示例': ['填入範例', 'Load sample'],
  '复制': ['複製', 'Copy'],
  '下载': ['下載', 'Download'],
  '清空输出': ['清空輸出', 'Clear output'],
  '输出结果': ['輸出結果', 'Output'],
  '已复制到剪贴板': ['已複製到剪貼簿', 'Copied to clipboard'],
  '已保存 {n}': ['已儲存 {n}', 'Saved {n}'],
  '保存 {n}': ['儲存 {n}', 'Save {n}'],
  '共 {n} 条': ['共 {n} 筆', '{n} records'],
  '模板根节点需为对象 (表示一条记录); 兼容 Mock.js 的 list 写法: 单个带数量规则的数组字段会自动取其元素模板。': ['範本根節點需為物件 (表示一筆記錄); 相容 Mock.js 的 list 寫法: 單一帶數量規則的陣列欄位會自動取其元素範本。', 'The template root must be an object (one record); the Mock.js list style is also accepted — a single array field with a count rule automatically uses its element as the record template.'],
  '模板解析失败: {msg}': ['範本解析失敗: {msg}', 'Template parse failed: {msg}'],
  '模板语法: 字段名|规则 控制数量/范围/自增 (如 list|1-10, age|18-60, id|+1, score|60-100.1-2); 值里的 @占位符 生成随机数据 (如 @cname / @email / @integer(1,100) / @date("yyyy-MM-dd") / @pick([...])); 模板按 JSON5 解析, 支持单引号、注释与尾逗号, 不支持函数与正则。': ['範本語法: 欄位名|規則 控制數量/範圍/自增 (如 list|1-10, age|18-60, id|+1, score|60-100.1-2); 值裡的 @佔位符 產生隨機資料 (如 @cname / @email / @integer(1,100) / @date("yyyy-MM-dd") / @pick([...])); 範本以 JSON5 解析, 支援單引號、註解與尾逗號, 不支援函式與正規式。', 'Template syntax: field|rule controls count/range/increment (list|1-10, age|18-60, id|+1, score|60-100.1-2); @placeholders inside values generate random data (@cname / @email / @integer(1,100) / @date("yyyy-MM-dd") / @pick([...])). Templates are parsed as JSON5 — single quotes, comments and trailing commas are fine, functions and regex are not.'],
  '生成数量与默认格式 / 默认表名可在「设置 → 其它 → 数据生成」中调整; 数量上限 1000 条。': ['產生數量與預設格式 / 預設表名可在「設定 → 其他 → 資料產生」中調整; 數量上限 1000 筆。', 'The record count, default format and default table name can be changed under Settings → Others → Mock Data; the limit is 1000 records.'],
  '数据生成说明': ['資料產生說明', 'About mock data generation'],
};

// 取词: 无命中回退 zh 原文
export const md = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const mdT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = md(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
