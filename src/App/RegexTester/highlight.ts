// 「代码生成」页签的语法高亮: highlight.js 核心包 + 按需注册 21 种语言,
// 主题与 JsonFormatter / SQLFormatter / JSON5Formatter 保持同一套 monokai。
import 'highlight.js/styles/monokai-sublime.css';
import highlight from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import javascript from 'highlight.js/lib/languages/javascript';
import r from 'highlight.js/lib/languages/r';
import rust from 'highlight.js/lib/languages/rust';
import delphi from 'highlight.js/lib/languages/delphi';
import php from 'highlight.js/lib/languages/php';
import go from 'highlight.js/lib/languages/go';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import perl from 'highlight.js/lib/languages/perl';
import objectivec from 'highlight.js/lib/languages/objectivec';
import julia from 'highlight.js/lib/languages/julia';
import kotlin from 'highlight.js/lib/languages/kotlin';
import typescript from 'highlight.js/lib/languages/typescript';
import erlang from 'highlight.js/lib/languages/erlang';
import lua from 'highlight.js/lib/languages/lua';
import powershell from 'highlight.js/lib/languages/powershell';
import { REGEX_CODE_LANGS, type RegexCodeLang } from './codegen';
import type { LanguageFn } from 'highlight.js';

/** 语言 key (与 REGEX_CODE_LANGS 同名) -> highlight.js 语言定义 */
const DEFS: Record<RegexCodeLang, LanguageFn> = {
  python, c, cpp, java, csharp, javascript, r, rust, delphi, php, go, ruby,
  swift, perl, objectivec, julia, kotlin, typescript, erlang, lua, powershell,
};

for (const name of REGEX_CODE_LANGS) {
  highlight.registerLanguage(name, DEFS[name]);
}

/** 转义 HTML (highlight 失败时的兜底) */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 把生成代码转成带高亮标签的 HTML; 语言未注册或解析失败时原样转义输出 */
export const highlightCode = (code: string, lang: RegexCodeLang): string => {
  try {
    return highlight.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(code);
  }
};
