// JsFormatter 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "JavaScript 格式化" },
  en: { appName: "JavaScript Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  // 通用
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '复制结果': ['複製結果', 'Copy result'],
  '示例': ['範例', 'Sample'],
  '清除': ['清除', 'Clear'],
  '保存为 .js': ['儲存為 .js', 'Save as .js'],
  '打开 .js': ['開啟 .js', 'Open .js'],
  'JavaScript 文件': ['JavaScript 檔案', 'JavaScript file'],
  '已保存 JavaScript 文件': ['已儲存 JavaScript 檔案', 'JavaScript file saved'],
  '保存失败: {m}': ['儲存失敗: {m}', 'Save failed: {m}'],
  '请选择 .js / .mjs / .cjs / .txt 文件': ['請選擇 .js / .mjs / .cjs / .txt 檔案', 'Please choose a .js / .mjs / .cjs / .txt file'],
  '输入 JavaScript 代码, 或拖拽 .js 文件到框内打开': ['輸入 JavaScript 程式碼，或拖曳 .js 檔案到框內開啟', 'Enter JavaScript code, or drop a .js file into the box'],
  '结果 (点击可复制)': ['結果 (點擊可複製)', 'Result (click to copy)'],
  '结果会显示在这里': ['結果會顯示在這裡', 'The result appears here'],
  '字符数': ['字元數', 'Characters'],
  '语义未变 (token 指纹一致)': ['語意未變 (token 指紋一致)', 'Semantics unchanged (token fingerprint matches)'],
  '注意: 结果与原代码的 token 指纹不一致, 请检查后再使用': ['注意: 結果與原程式碼的 token 指紋不一致，請檢查後再使用', 'Warning: the result\'s token fingerprint differs from the source — please review before use'],
  '解析失败, 请检查代码': ['解析失敗，請檢查程式碼', 'Parse failed — please check the code'],
  '请先输入 JavaScript 代码': ['請先輸入 JavaScript 程式碼', 'Enter JavaScript code first'],
  // 模式
  '代码美化': ['程式碼美化', 'Beautify'],
  '代码压缩': ['程式碼壓縮', 'Minify'],
  '混淆加密': ['混淆加密', 'Obfuscate'],
  '解密还原': ['解密還原', 'Deobfuscate'],
  '美化': ['美化', 'Beautify'],
  '压缩': ['壓縮', 'Minify'],
  '加密': ['加密', 'Encrypt'],
  '解密': ['解密', 'Decrypt'],
  '缩进': ['縮排', 'Indent'],
  '2 空格': ['2 空格', '2 spaces'],
  '4 空格': ['4 空格', '4 spaces'],
  'Tab': ['Tab', 'Tab'],
  '保留空行': ['保留空行', 'Keep blank lines'],
  '移除注释': ['移除註解', 'Remove comments'],
  '单行输出': ['單行輸出', 'Single line output'],
  '混淆方式': ['混淆方式', 'Obfuscation mode'],
  '词表打包 + 转义': ['詞表打包 + 轉義', 'Dictionary packing + escaping'],
  '仅字符串转义 (\\xNN)': ['僅字串轉義 (\\xNN)', 'String escaping only (\\xNN)'],
  '仅字符串转义 (\\uNNNN)': ['僅字串轉義 (\\uNNNN)', 'String escaping only (\\uNNNN)'],
  '先把字符串逐字符转义, 再把标识符换成词表下标并包进 eval, 体积最小, 可一键还原': ['先把字串逐字元轉義，再把識別字換成詞表下標並包進 eval，體積最小，可一鍵還原', 'Escapes every string character first, then replaces identifiers with dictionary indexes wrapped in eval — smallest output, one-click restore'],
  '只把字符串内容转成 \\xNN / \\uNNNN 形式, 代码结构不变': ['只把字串內容轉成 \\xNN / \\uNNNN 形式，程式碼結構不變', 'Converts only string contents into \\xNN / \\uNNNN form; the code structure is untouched'],
  '只把字符串里的非 ASCII 字符转成 \\uNNNN 形式, 中文最常用': ['只把字串裡的非 ASCII 字元轉成 \\uNNNN 形式，中文最常用', 'Converts only non-ASCII characters inside strings into \\uNNNN form — the usual choice for Chinese text'],
  '自动识别混淆特征并逐层还原 (词表打包 / 经典 packer / eval 包裹 / 字符串转义), 全过程本地完成, 不会执行代码': ['自動識別混淆特徵並逐層還原 (詞表打包 / 經典 packer / eval 包裹 / 字串轉義)，全過程在本機完成，不會執行程式碼', 'Detects obfuscation signatures and unwraps them layer by layer (dictionary packing / classic packer / eval wrapper / string escaping). Everything runs locally and the code is never executed'],
  '未检测到可还原的混淆特征, 已原样返回': ['未偵測到可還原的混淆特徵，已原樣返回', 'No restorable obfuscation signature found — returned unchanged'],
  '已还原: {n} 层': ['已還原: {n} 層', 'Restored: {n} layer(s)'],
  '还原层': ['還原層', 'Layers'],
  '全部本地完成, 不上传任何代码': ['全部在本機完成，不上傳任何程式碼', 'Everything runs locally — no code is uploaded'],
  '美化结果': ['美化結果', 'Beautified result'],
  '压缩结果': ['壓縮結果', 'Minified result'],
  '混淆结果': ['混淆結果', 'Obfuscated result'],
  '还原结果': ['還原結果', 'Restored result'],
  '格式化后的代码会显示在这里 (点击可复制)': ['格式化後的程式碼會顯示在這裡 (點擊可複製)', 'The formatted code appears here (click to copy)'],
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
