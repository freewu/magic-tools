// KeywordDensity 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "關鍵詞密度" },
  en: { appName: "Keyword Density" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed — please select and copy manually'],
  '复制': ['複製', 'Copy'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '去重': ['去重', 'Deduplicate'],
  '关键词密度': ['關鍵詞密度', 'Keyword Density'],
  '密度 = 出现次数 × 关键词字符数 ÷ 有效字符总数 × 100% (有效字符不含空白与标点)。左侧输入文本, 下方可同时分析多个关键词(逗号分隔); 词频表按英文单词统计。': ['密度 = 出現次數 × 關鍵詞字元數 ÷ 有效字元總數 × 100% (有效字元不含空白與標點)。左側輸入文字, 下方可同時分析多個關鍵詞(逗號分隔); 詞頻表按英文單字統計。', 'Density = occurrences × keyword length ÷ total effective characters × 100% (blank and punctuation are excluded). Paste text on the left; below you can analyze several keywords at once (comma-separated). The frequency table counts English words.'],
  '文本与关键词': ['文字與關鍵詞', 'Text & Keywords'],
  '粘贴要分析的页面文本 / 文章正文…': ['貼上要分析的頁面文字 / 文章內文…', 'Paste the page text / article body to analyze…'],
  '有效字符 {n}': ['有效字元 {n}', '{n} effective chars'],
  '英文词 {n}': ['英文單字 {n}', '{n} English words'],
  '汉字 {n}': ['漢字 {n}', '{n} Han chars'],
  '段落 {n}': ['段落 {n}', '{n} paragraphs'],
  '句子 {n}': ['句子 {n}', '{n} sentences'],
  '关键词': ['關鍵詞', 'Keywords'],
  '关键词密度报告': ['關鍵詞密度報告', 'Keyword Density Report'],
  '出现 {n} 次': ['出現 {n} 次', '{n} occurrences'],
  '建议区间 0.5% ~ 3%': ['建議區間 0.5% ~ 3%', 'Suggested range 0.5% ~ 3%'],
  '未出现': ['未出現', 'Not found'],
  '密度偏低': ['密度偏低', 'Low'],
  '正常': ['正常', 'Normal'],
  '偏高': ['偏高', 'High'],
  '过高(疑似堆砌)': ['過高(疑似堆砌)', 'Too high (keyword stuffing)'],
  '英文词频 Top 50 ': ['英文單字頻率 Top 50 ', 'Top 50 English words '],
  '(词频按英文单词统计, 中文词组请用上方关键词密度)': ['(詞頻按英文單字統計, 中文詞組請用上方關鍵詞密度)', '(frequency counts English words; for Chinese phrases use the keyword density section above)'],
  '忽略停用词': ['忽略停用詞', 'Ignore stop words'],
  '已复制词频 CSV': ['已複製詞頻 CSV', 'Word-frequency CSV copied'],
  '复制 CSV': ['複製 CSV', 'Copy CSV'],
  '单词': ['單字', 'Word'],
  '次数': ['次數', 'Count'],
  '密度 %': ['密度 %', 'Density %'],
  '暂无英文单词 — 中文文本请使用上方关键词分析。': ['暫無英文單字 — 中文文字請使用上方關鍵詞分析。', 'No English words found — for Chinese text use the keyword analysis above.'],
  '多个关键词用逗号分隔, 例如: seo, 关键词密度, 数据分析': ['多個關鍵詞用逗號分隔, 例如: seo, keyword density, data analysis', 'Separate multiple keywords with commas, e.g. seo, keyword density, data analysis'],
  '输入': ['輸入', 'Input'],
  '是': ['是', 'Yes'],
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

