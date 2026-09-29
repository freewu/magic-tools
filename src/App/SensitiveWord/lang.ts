// SensitiveWord 语言包: 名称 + 界面文案 (zh 原文即 key, 无命中回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '敏感詞檢測' },
  en: { appName: 'Sensitive word check' },
} as const;

/** 界面文案词条 (zh 短语即 key; 无命中回退 zh 原文) */
const uilangRows: Record<string, [ string, string ]> = {
  // 词库 / 等级
  '通用': [ '通用', 'General' ],
  '小红书': [ '小紅書', 'Xiaohongshu' ],
  '微信公众号': [ '微信公眾號', 'WeChat Official Account' ],
  '高危': [ '高危', 'High risk' ],
  '中危': [ '中危', 'Medium risk' ],
  '低危': [ '低危', 'Low risk' ],
  '平台通常直接限流 / 删除 / 封号, 发布前务必改写': [
    '平台通常直接限流 / 刪除 / 封號, 發布前務必改寫',
    'Usually limited, removed or banned by the platform — rewrite before publishing',
  ],
  '容易被判定为诱导、夸大宣传, 建议改写': [
    '容易被判定為誘導、誇大宣傳, 建議改寫',
    'Often flagged as inducement or exaggeration — rewriting is recommended',
  ],
  '轻度营销夸张用词, 视平台风控宽严处理': [
    '輕度行銷誇張用詞, 視平台風控寬嚴處理',
    'Mild marketing exaggeration — treat according to how strict the platform is',
  ],

  // 操作
  '载入示例': [ '載入範例', 'Load sample' ],
  '清空': [ '清空', 'Clear' ],
  '复制打码文本': [ '複製打碼文字', 'Copy masked text' ],
  '复制检测报告': [ '複製檢測報告', 'Copy report' ],
  '保存打码文本': [ '儲存打碼文字', 'Save masked text' ],
  '保存检测报告': [ '儲存檢測報告', 'Save report' ],
  '已复制打码文本': [ '已複製打碼文字', 'Masked text copied' ],
  '已复制检测报告': [ '已複製檢測報告', 'Report copied' ],
  '已复制敏感词 {word}': [ '已複製敏感詞 {word}', 'Copied “{word}”' ],
  '复制失败, 请手动选择复制': [ '複製失敗, 請手動選擇複製', 'Copy failed — please copy manually' ],
  '已保存 {file}': [ '已儲存 {file}', 'Saved {file}' ],
  '保存失败: {msg}': [ '儲存失敗: {msg}', 'Save failed: {msg}' ],
  '文本文件': [ '文字檔', 'Text file' ],

  // 匹配选项
  '宽松匹配 (忽略间隔符)': [ '寬鬆匹配 (忽略間隔符)', 'Loose matching (ignore separators)' ],
  '拉丁词边界': [ '拉丁詞邊界', 'Latin word boundary' ],
  '打码字符': [ '打碼字元', 'Mask character' ],
  '开启后「微 信」「ｖｘ」这类插入间隔符 / 全角的绕过写法也会被检出': [
    '開啟後「微 信」「ｖｘ」這類插入間隔符 / 全角的繞過寫法也會被檢出',
    'Catches bypass tricks such as “微 信” or full-width “ｖｘ”',
  ],
  '开启后纯字母词要求左右不是字母, 避免「v」命中 version 这类英文单词': [
    '開啟後純字母詞要求左右不是字母, 避免「v」命中 version 這類英文單詞',
    'Pure-letter words must not be surrounded by letters, so “v” no longer matches inside “version”',
  ],

  // 输入区
  '把文案 / 标题 / 商品详情粘贴到这里, 自动检测敏感词': [
    '把文案 / 標題 / 商品詳情貼到這裡, 自動檢測敏感詞',
    'Paste your copy, title or product description here — it is checked automatically',
  ],
  '共 {n} 字': [ '共 {n} 字', '{n} characters' ],
  '命中 {n} 处': [ '命中 {n} 處', '{n} matches' ],
  '命中 {hits} 处 / {words} 个词': [ '命中 {hits} 處 / {words} 個詞', '{hits} matches / {words} words' ],
  '未命中': [ '未命中', 'No match' ],

  // 结果区
  '命中明细': [ '命中明細', 'Matches' ],
  '敏感词': [ '敏感詞', 'Word' ],
  '等级': [ '等級', 'Level' ],
  '次数': [ '次數', 'Count' ],
  '位置': [ '位置', 'Position' ],
  '建议替换': [ '建議替換', 'Suggestion' ],
  '全部': [ '全部', 'All' ],
  '第 {line} 行第 {col} 字': [ '第 {line} 行第 {col} 字', 'line {line}, col {col}' ],
  '等 {n} 处': [ '等 {n} 處', 'and {n} in total' ],
  '点击「复制」按钮可取到该词, 便于批量替换': [
    '點擊「複製」按鈕可取到該詞, 便於批次替換',
    'Use the copy button to grab the word for a bulk replace',
  ],
  '未命中该词库的敏感词': [ '未命中該詞庫的敏感詞', 'No word from this list was found' ],
  '换个词库试试, 或检查文案是否需要放宽松': [
    '換個詞庫試試, 或檢查文案是否需要放寬鬆',
    'Try another word list, or review whether the options are too strict',
  ],
  '命中高亮': [ '命中高亮', 'Highlighted text' ],
  '打码预览': [ '打碼預覽', 'Masked text' ],
  '词库预览': [ '詞庫預覽', 'Word list' ],
  '共 {n} 条词条, 命中的词条排在最前': [
    '共 {n} 條詞條, 命中的詞條排在最前',
    '{n} entries, matched ones first',
  ],
  '词条': [ '詞條', 'Entry' ],
  '命中 {n} 次': [ '命中 {n} 次', '{n} matches' ],
  '词库说明': [ '詞庫說明', 'About the lists' ],
  '检测说明': [ '檢測說明', 'About this tool' ],

  '打码 / 报告都按「通用」词库 (小红书 + 微信公众号的并集) 处理, 避免漏词': [
    '打碼 / 報告都按「通用」詞庫 (小紅書 + 微信公眾號的聯集) 處理, 避免漏詞',
    'Masking and the report use the General list (Xiaohongshu + WeChat combined) so nothing is missed',
  ],
  '先在上面粘贴一段文案, 这里会立刻给出检测结果': [
    '先在上面貼上一段文案, 這裡會立刻給出檢測結果',
    'Paste some copy above and the check runs instantly',
  ],

  // 说明区标题
  ' 敏感词检测说明 ': [ ' 敏感詞檢測說明 ', ' About the sensitive word check ' ],
};

/** 取词: 无命中回退 zh 原文 */
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};

/** 含 {var} 占位符的取词 */
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};
