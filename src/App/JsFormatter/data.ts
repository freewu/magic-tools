// JavaScript 格式化 工具静态数据

/** 四种工作模式 */
export type JsMode = 'beautify' | 'minify' | 'obfuscate' | 'deobfuscate';

export const JS_MODES: { key: JsMode; label: string }[] = [
  { key: 'beautify', label: '代码美化' },
  { key: 'minify', label: '代码压缩' },
  { key: 'obfuscate', label: '混淆加密' },
  { key: 'deobfuscate', label: '解密还原' },
];

/** 缩进选项 */
export const INDENT_OPTIONS: { value: string; label: string }[] = [
  { value: '  ', label: '2 空格' },
  { value: '    ', label: '4 空格' },
  { value: '\t', label: 'Tab' },
];

/** 混淆方式 */
export type ObfuscateMode = 'pack' | 'escape' | 'unicode';

export const OBFUSCATE_MODES: { value: ObfuscateMode; label: string; desc: string }[] = [
  { value: 'pack', label: '词表打包 + 转义', desc: '先把字符串逐字符转义, 再把标识符换成词表下标并包进 eval, 体积最小, 可一键还原' },
  { value: 'escape', label: '仅字符串转义 (\\xNN)', desc: '只把字符串内容转成 \\xNN / \\uNNNN 形式, 代码结构不变' },
  { value: 'unicode', label: '仅字符串转义 (\\uNNNN)', desc: '只把字符串里的非 ASCII 字符转成 \\uNNNN 形式, 中文最常用' },
];

/** 示例 JS 代码 */
export const SAMPLE_JS = `// 示例: 一个打招呼的小函数
function greet(name, lang) {
  if (!name) {
    return '你好呀';
  }
  const msg = lang === 'en' ? 'Hello, ' + name : \`你好, \${name}\`;
  return msg;
}

const users = [ { id: 1, name: 'Tom' }, { id: 2, name: '小明' } ];
users.forEach((u) => console.log(greet(u.name, 'zh')));
`;

/** 结果面板默认高度 */
export const RESULT_HEIGHT = 'calc(100vh - 520px)';
