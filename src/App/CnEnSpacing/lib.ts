// 中英文自动排版 纯逻辑层
// 在中文字符与英文字母/数字之间自动插入空格, 让混排文本更易读。
// 规则: 仅处理"紧邻"边界 (已有空格或多空格处不再添加); 标点、换行、段落结构不动。

/** CJK 文字范围 (含扩展 A 与兼容区) */
const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
/** 英文字母与数字 (含全角字母数字) */
const LATIN_DIGIT = 'A-Za-z0-9\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF10-\\uFF19';

/** 中英混排自动加空格 */
export function spaceCnEn(input: string): string {
  const s = String(input ?? '');
  if (!s) return '';
  const cnThenLatin = new RegExp(`([${CJK}])(?=[${LATIN_DIGIT}])`, 'g');
  const latinThenCn = new RegExp(`([${LATIN_DIGIT}])(?=[${CJK}])`, 'g');
  return s
    .replace(cnThenLatin, '$1 ')
    .replace(latinThenCn, '$1 ');
}
