// GitignoreGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: ".gitignore 產生" },
  en: { appName: ".gitignore Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const gitignorelangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制全部': ['複製全部', 'Copy all'],
  '点击复制': ['點擊複製', 'Click to copy'],
  '已复制到粘贴板': ['已複製到剪貼簿', 'Copied to clipboard'],
  '保存为 .gitignore': ['儲存為 .gitignore', 'Save as .gitignore'],
  '保存 .gitignore 文件': ['儲存 .gitignore 檔案', 'Save .gitignore file'],
  '.gitignore 文件': ['.gitignore 檔案', '.gitignore file'],
  '保存成功': ['儲存成功', 'Saved'],
  '清空': ['清空', 'Clear'],
  '全选': ['全選', 'Select all'],
  '恢复默认': ['恢復預設', 'Restore defaults'],
  '搜索模板': ['搜尋範本', 'Search templates'],
  '选择模板 (可多选)': ['選擇範本 (可多選)', 'Select templates (multiple)'],
  '搜索结果': ['搜尋結果', 'Search results'],
  '共 {n} 个模板可选': ['共 {n} 個範本可選', '{n} templates available'],
  '已选 {n} 个模板': ['已選 {n} 個範本', '{n} templates selected'],
  '{n} 个已选模板被搜索条件隐藏': ['{n} 個已選範本被搜尋條件隱藏', '{n} selected templates hidden by the search'],
  '未找到匹配的模板': ['找不到符合的範本', 'No matching template'],
  '模板库': ['範本庫', 'Template library'],
  '常用组合': ['常用組合', 'Common stacks'],
  '选择常用组合 (一键套用)': ['選擇常用組合 (一鍵套用)', 'Pick a common stack (one click)'],
  '共 {n} 个常用组合': ['共 {n} 個常用組合', '{n} common stacks'],
  '自定义追加': ['自訂追加', 'Custom lines'],
  '选项': ['選項', 'Options'],
  '生成结果': ['產生結果', 'Result'],
  '顶部说明注释': ['頂部說明註解', 'Header comment'],
  '分组注释': ['分組註解', 'Section comments'],
  '按模板库顺序': ['依範本庫順序', 'Library order'],
  '自动去重': ['自動去重', 'Auto dedupe'],
  '每行一条, 直接追加到结果末尾 (支持 # 注释与 ! 例外)': ['每行一條, 直接追加到結果末尾 (支援 # 註解與 ! 例外)', 'One entry per line, appended at the end (# comments and ! negations supported)'],
  '勾选需要的技术栈, 生成的 .gitignore 可直接保存到仓库根目录': ['勾選需要的技術棧, 產生的 .gitignore 可直接儲存到倉庫根目錄', 'Pick the stacks you use — the generated .gitignore can be saved straight into the repository root'],
  '语言': ['語言', 'Languages'],
  '框架与工具': ['框架與工具', 'Frameworks & tools'],
  '编辑器 / IDE': ['編輯器 / IDE', 'Editors / IDEs'],
  '操作系统': ['作業系統', 'Operating systems'],
  '其它': ['其他', 'Misc'],
  '模板 {n} 个': ['範本 {n} 個', '{n} templates'],
  '规则 {m} 条': ['規則 {m} 條', '{m} rules'],
  '注释 {k} 行': ['註解 {k} 行', '{k} comments'],
  '已去重 {d} 行': ['已去重 {d} 行', '{d} duplicates removed'],
  // 校验 / 提示
  '未选择任何模板, 也没有自定义规则': ['未選擇任何範本, 也沒有自訂規則', 'No template selected and no custom rule'],
  '已自动去重 {n} 行重复规则': ['已自動去重 {n} 行重複規則', '{n} duplicate rules were removed automatically'],
  '未勾选「环境变量 / 密钥」, 建议加上以避免误提交 .env / *.pem': ['未勾選「環境變數 / 金鑰」, 建議加上以避免誤提交 .env / *.pem', 'The "env / secrets" template is not selected — add it to avoid committing .env / *.pem by accident'],
  '自定义规则里以 ! 开头的例外规则需放在对应忽略规则之后, 否则不生效': ['自訂規則裡以 ! 開頭的例外規則需放在對應忽略規則之後, 否則不生效', 'A "!" negation line must come after the rule that ignores the path, otherwise it has no effect'],
  '以 / 开头的规则只在仓库根目录生效, 需要匹配任意层级请去掉开头的 /': ['以 / 開頭的規則只在倉庫根目錄生效, 需要匹配任意層級請去掉開頭的 /', 'A rule starting with "/" only matches the repository root — drop the leading "/" to match any level'],
  // 常用组合预设
  '前端 (Node + Vite)': ['前端 (Node + Vite)', 'Frontend (Node + Vite)'],
  'Python 后端': ['Python 後端', 'Python backend'],
  'Java / Maven': ['Java / Maven', 'Java / Maven'],
  'Android / Kotlin': ['Android / Kotlin', 'Android / Kotlin'],
  'Go 服务': ['Go 服務', 'Go service'],
  'Rust 项目': ['Rust 專案', 'Rust project'],
  'C / C++ (CMake)': ['C / C++ (CMake)', 'C / C++ (CMake)'],
  'PHP / Laravel': ['PHP / Laravel', 'PHP / Laravel'],
  '移动端 (Flutter / 原生)': ['行動端 (Flutter / 原生)', 'Mobile (Flutter / native)'],
  '机器学习 / 数据科学': ['機器學習 / 資料科學', 'Machine learning / data science'],
  '通用基础 (系统 + 编辑器 + 密钥)': ['通用基礎 (系統 + 編輯器 + 金鑰)', 'Baseline (OS + editor + secrets)'],
};

// 取词: 无命中回退 zh 原文 (与项目其它语言包行为一致)
export const gg = (locale: string, zh: string): string => {
  const e = gitignorelangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const ggT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = gg(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
