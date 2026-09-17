/**
 * 极简 JavaScript 词法扫描器 (美化 / 压缩 / 混淆 三类功能共用)
 *
 * 只做「词法」层面的事: 把源码切成 token 并记录每个 token 前的换行数。
 * 不解析语法树, 因此对任意片段 (甚至不完整的代码) 都能安全处理。
 *
 * 关键点:
 * - 正则字面量 / 除号 的区分: 依赖前一个有效 token (关键字白名单 + 括号栈)
 * - 模板字符串整体作为一个 token (其内部 ${} 不单独格式化)
 * - 每个 token 记录 nl (之前的换行数), 供 ASI (自动分号) 保护规则使用
 */

export type JsTokenType = 'name' | 'number' | 'string' | 'template' | 'regex' | 'comment' | 'punct';

export interface JsToken {
  type: JsTokenType;
  /** 源码原文 (含引号 / 除号 / 注释标记) */
  value: string;
  /** 该 token 之前出现的换行数 (0 = 与上一个 token 同行) */
  nl: number;
  start: number;
  end: number;
  /** 闭合括号是否结束了一个「语句块」(仅 '}' 有意义, 用于判断其后能否直接跟正则) */
  block?: boolean;
  /** 闭合圆括号是否结束了一个控制流条件 (仅 ')' 有意义, 如 if (x) /re/.test(y)) */
  ctrl?: boolean;
}

/** 保留字 (可用于「正则上下文」判断, 也用于空格规则) */
export const JS_KEYWORDS = new Set([
  'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'finally', 'for', 'function', 'if',
  'import', 'in', 'instanceof', 'let', 'new', 'of', 'return', 'static', 'super', 'switch',
  'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  // 字面量关键字 (自身即完整表达式, 后面应视为「除法」)
  'this', 'true', 'false', 'null',
]);

/** 关键字里「后面可以跟正则」的那些 (值上下文) */
const REGEX_AFTER_KEYWORD = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'case', 'do',
  'else', 'yield', 'await', 'throw', 'default',
]);

/** 控制流关键字: 其后的 (...) 结束时, 允许直接跟正则 (如 if (x) /re/.test(y)) */
const CONTROL_KEYWORD = new Set([ 'if', 'while', 'for', 'switch', 'catch', 'with' ]);

/** 多字符运算符 (按长度从长到短匹配) */
const PUNCTS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=',
  '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
];

const isIdStart = (ch: string): boolean => /[A-Za-z_$\u0080-\uffff]/.test(ch);
const isIdPart = (ch: string): boolean => /[A-Za-z0-9_$\u0080-\uffff]/.test(ch);
const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

interface Group { char: string; block: boolean; ctrl: boolean }

/** 扫描字符串字面量 (单/双引号), 返回结束位置 (含引号); 未闭合则到文末 */
function scanString(code: string, start: number): number {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === quote) return i + 1;
    if (ch === '\n') return i; // 未闭合: 不吞掉换行
    i += 1;
  }
  return code.length;
}

/** 扫描模板字符串 (反引号), 处理 \ 转义与 ${} 嵌套 */
function scanTemplate(code: string, start: number): number {
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '`') return i + 1;
    if (ch === '$' && code[i + 1] === '{') {
      i = scanBraced(code, i + 2);
      continue;
    }
    i += 1;
  }
  return code.length;
}

/** 跳过 ${ 之后的表达式 (到匹配的 }) */
function scanBraced(code: string, start: number): number {
  let depth = 1;
  let i = start;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '\'' || ch === '"') { i = scanString(code, i); continue; }
    if (ch === '`') { i = scanTemplate(code, i); continue; }
    if (ch === '/' && code[i + 1] === '/') { i = code.indexOf('\n', i); if (i < 0) return code.length; continue; }
    if (ch === '/' && code[i + 1] === '*') { const e = code.indexOf('*/', i + 2); i = e < 0 ? code.length : e + 2; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') { depth -= 1; if (depth === 0) return i + 1; }
    i += 1;
  }
  return code.length;
}

/** 扫描正则字面量, 失败 (换行 / 到文末) 返回 -1 */
function scanRegex(code: string, start: number): number {
  let i = start + 1;
  let inClass = false;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '\n') return -1;
    if (inClass) {
      if (ch === ']') inClass = false;
    } else if (ch === '[') {
      inClass = true;
    } else if (ch === '/') {
      i += 1;
      while (i < code.length && isIdPart(code[i])) i += 1; // flags
      return i;
    }
    i += 1;
  }
  return -1;
}

/** 前一个有效 token 之后, `/` 是否应视为正则开头 */
function regexAllowed(prev: JsToken | undefined): boolean {
  if (!prev) return true;
  if (prev.type === 'name') return REGEX_AFTER_KEYWORD.has(prev.value);
  if (prev.type === 'number' || prev.type === 'string' || prev.type === 'template' || prev.type === 'regex') return false;
  if (prev.type !== 'punct') return false;
  if (prev.value === ')') return Boolean(prev.ctrl);
  if (prev.value === ']' || prev.value === '++' || prev.value === '--') return false;
  if (prev.value === '}') return Boolean(prev.block);
  return true;
}

/** `{` 是语句块 (而非对象字面量) */
function isBlockBrace(prev: JsToken | undefined): boolean {
  if (!prev) return true;
  if (prev.type === 'punct') return [ '{', '}', ';', ')' , '=>' ].includes(prev.value);
  if (prev.type === 'name') return [ 'else', 'do', 'try', 'finally' ].includes(prev.value);
  return false;
}

export function tokenizeJs(code: string): JsToken[] {
  const out: JsToken[] = [];
  const stack: Group[] = [];
  let i = 0;
  let nl = 0;

  const prevSig = (): JsToken | undefined => {
    for (let k = out.length - 1; k >= 0; k -= 1) if (out[k].type !== 'comment') return out[k];
    return undefined;
  };
  const push = (type: JsTokenType, start: number, end: number) => {
    out.push({ type, value: code.slice(start, end), nl, start, end });
    nl = 0;
  };

  while (i < code.length) {
    const ch = code[i];

    // 空白 (含换行)
    if (ch === '\n') { nl += 1; i += 1; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v' || ch === '\u00a0') { i += 1; continue; }

    // 注释
    if (ch === '/' && code[i + 1] === '/') {
      let end = code.indexOf('\n', i);
      if (end < 0) end = code.length;
      push('comment', i, end);
      i = end;
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close < 0 ? code.length : close + 2;
      push('comment', i, end);
      i = end;
      continue;
    }

    const prev = prevSig();

    // 字符串
    if (ch === '\'' || ch === '"') {
      const end = scanString(code, i);
      push('string', i, end);
      i = end;
      continue;
    }
    // 模板字符串
    if (ch === '`') {
      const end = scanTemplate(code, i);
      push('template', i, end);
      i = end;
      continue;
    }
    // 正则 / 除号
    if (ch === '/' && code[i + 1] !== '=') {
      const end = regexAllowed(prev) ? scanRegex(code, i) : -1;
      if (end > 0) {
        push('regex', i, end);
        i = end;
        continue;
      }
    }
    // 数字
    if (isDigit(ch) || (ch === '.' && isDigit(code[i + 1] ?? ''))) {
      let end = i;
      if (ch === '0' && /[xXbBoO]/.test(code[i + 1] ?? '')) {
        end = i + 2;
        while (end < code.length && /[0-9a-fA-F_]/.test(code[end])) end += 1;
      } else {
        while (end < code.length && /[0-9_]/.test(code[end])) end += 1;
        if (code[end] === '.') {
          end += 1;
          while (end < code.length && /[0-9_]/.test(code[end])) end += 1;
        }
        if (code[end] === 'e' || code[end] === 'E') {
          let k = end + 1;
          if (code[k] === '+' || code[k] === '-') k += 1;
          if (isDigit(code[k] ?? '')) {
            end = k;
            while (end < code.length && /[0-9_]/.test(code[end])) end += 1;
          }
        }
      }
      if (code[end] === 'n') end += 1; // BigInt
      push('number', i, end);
      i = end;
      continue;
    }
    // 标识符 / 关键字
    if (isIdStart(ch) || (ch === '\\' && code[i + 1] === 'u')) {
      let end = i;
      while (end < code.length) {
        if (isIdPart(code[end])) { end += 1; continue; }
        if (code[end] === '\\' && code[end + 1] === 'u') { end += 6; continue; } // \uXXXX
        break;
      }
      push('name', i, end);
      i = end;
      continue;
    }

    // 运算符 / 标点
    const punct = PUNCTS.find((p) => code.startsWith(p, i));
    const value = punct ?? ch;
    push('punct', i, i + value.length);
    if (value === '(' || value === '[' || value === '{') {
      stack.push({ char: value, block: value === '{' ? isBlockBrace(prev) : false, ctrl: Boolean(prev && prev.type === 'name' && CONTROL_KEYWORD.has(prev.value)) });
    } else if (value === ')' || value === ']' || value === '}') {
      const closed = stack.pop();
      const cur = out[out.length - 1];
      if (closed) {
        cur.block = closed.block;
        cur.ctrl = closed.ctrl;
      }
    }
    i += value.length;
  }

  return out;
}

/** 有效 token (去掉注释) */
export function significant(tokens: JsToken[]): JsToken[] {
  return tokens.filter((t) => t.type !== 'comment');
}

/** 结束一个表达式的 token (ASI 判断用) */
export const exprEnd = (t: JsToken | undefined): boolean => {
  if (!t) return false;
  if (t.type === 'number' || t.type === 'string' || t.type === 'template' || t.type === 'regex') return true;
  if (t.type === 'name') {
    // 运算符型关键字不算表达式结束 (return / typeof / in / new ...)
    return !OPERATOR_LIKE_KEYWORDS.has(t.value);
  }
  return t.value === ')' || t.value === ']' || t.value === '}' || t.value === '++' || t.value === '--';
};

/** 运算符型关键字: 其后必然还要跟操作数, 因此不构成表达式结束 */
const OPERATOR_LIKE_KEYWORDS = new Set([
  'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'await', 'yield', 'case',
  'do', 'else', 'return', 'throw', 'break', 'continue', 'function', 'class', 'var', 'let',
  'const', 'if', 'for', 'while', 'switch', 'try', 'catch', 'finally', 'with', 'import',
  'export', 'default', 'extends', 'static', 'as', 'from', 'debugger',
]);

/**
 * 该换行是否具有 ASI (自动分号) 语义 —— 有则必须保留, 否则会改变代码含义
 * 覆盖: 受限产生式 (return/throw/break/continue/yield)、++/--、正则前的除号 /
 * 以及「表达式结束后又出现一个值或语句开头」的情形
 */
export const asiHazard = (prev: JsToken | undefined, cur: JsToken): boolean => {
  if (!prev || cur.nl === 0) return false;
  if (prev.type === 'name' && [ 'return', 'throw', 'break', 'continue', 'yield' ].includes(prev.value)) return true;
  if (cur.value === '++' || cur.value === '--') return exprEnd(prev);
  // 只有对象字面量的 '}' 才能被后续名字/值继续 (块级 '}' 已结束语句)
  if (prev.value === '}') return !prev.block;
  if ((cur.type === 'regex' || cur.value === '/' || cur.value === '/=') && exprEnd(prev)) return true;
  if (exprEnd(prev) && (cur.type === 'name' || cur.type === 'number' || cur.type === 'string'
    || cur.type === 'template' || cur.type === 'regex' || cur.value === '!' || cur.value === '~'
    || cur.value === '{')) return true;
  return false;
};

/** 从 from 开始按 step 方向找下一个有效 token (跳过注释) */
export const significantAt = (toks: JsToken[], from: number, step: number): JsToken | undefined => {
  for (let i = from; i >= 0 && i < toks.length; i += step) if (toks[i].type !== 'comment') return toks[i];
  return undefined;
};

/**
 * token 指纹: 用于校验「美化 / 压缩」前后代码的词法序列完全一致
 * (即只改了空白与注释, 没有增删改任何 token)
 */
export function jsSignature(code: string, keepComments = false): string {
  const list = keepComments ? tokenizeJs(code) : significant(tokenizeJs(code));
  return list.map((t) => `${t.type}:${t.value}`).join('\u0001');
}
