/**
 * JS 美化 / 压缩 (基于自研词法扫描器, 见 tokenize.ts)
 */

import { tokenizeJs, JS_KEYWORDS, asiHazard, exprEnd, significantAt, type JsToken } from './tokenize';

export interface BeautifyOptions {
  /** 缩进字符串, 默认两个空格; '\t' 表示制表符 */
  indent?: string;
  /** 保留原文空行 (默认 true) */
  blankLines?: boolean;
}

export interface MinifyOptions {
  /** 删除注释 (默认 true) */
  removeComments?: boolean;
  /** 压缩成一行 (默认 true); false 时只去掉行内多余空白 */
  oneLine?: boolean;
}

/** 后面需要跟空格的保留字 (值关键字 this/true/false/null/super 除外) */
const SPACE_AFTER_KEYWORD = new Set(
  [ ...JS_KEYWORDS ].filter((k) => ![ 'this', 'true', 'false', 'null', 'super' ].includes(k)),
);

const BINARY_OPS = new Set([
  '=', '==', '===', '!=', '!==', '+', '-', '*', '/', '%', '**', '<', '>', '<=', '>=', '&&', '||',
  '??', '&', '|', '^', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '%=', '**=', '&=', '|=', '^=',
  '<<=', '>>=', '>>>=', '&&=', '||=', '??=', '=>', 'in', 'instanceof',
]);

/** 逗号 / 关键字后不需要再加空格的情形 */
const NO_PAD_BEFORE = new Set([ ';', ',', ')', ']', '}', '.', ':' ]);
const TIGHT_AFTER_OPEN = new Set([ '(', '[', '{' ]);
const CASE_LABEL_TAIL = new Set([ 'else', 'catch', 'finally', 'while' ]);

export function beautifyJs(code: string, opts: BeautifyOptions = {}): string {
  const unit = opts.indent === undefined ? '  ' : opts.indent;
  const keepBlank = opts.blankLines !== false;
  const toks = tokenizeJs(code);

  let out = '';
  let level = 0;
  const stack: string[] = [];

  const atLineStart = () => out === '' || out.endsWith('\n');
  const pad = () => { if (!atLineStart() && !out.endsWith(' ')) out += ' '; };
  const write = (text: string) => {
    if (atLineStart()) out += unit.repeat(level);
    out += text;
  };
  const newline = () => {
    out = out.replace(/[ \t]+$/, '');
    if (!out.endsWith('\n')) out += '\n';
  };
  const blankLine = () => { if (out === '') return; newline(); if (!out.endsWith('\n\n')) out += '\n'; };

  let prevSig: JsToken | undefined;
  let afterCloseBrace = false;
  let caseIndent = 0;   // 当前 case 体额外缩进
  let caseDepth = -1;   // 该 case 体所属块的栈深度

  for (let i = 0; i < toks.length; i += 1) {
    const t = toks[i];

    // ---- 注释 ----
    if (t.type === 'comment') {
      const lineComment = t.value.startsWith('//');
      const multi = t.value.includes('\n');
      if (t.nl > 0 || multi) newline();
      else pad();
      write(t.value.trim());
      if (lineComment || multi) newline();
      else pad();
      afterCloseBrace = false;
      continue;
    }

    const nextSig = significantAt(toks, i + 1, 1);
    const nextRaw = toks[i + 1];
    const prevPrev = significantAt(toks, i - 2, -1);
    const top = stack[stack.length - 1];

    if (keepBlank && t.nl >= 2 && atLineStart()) blankLine();

    // ---- 上一个 token 是 '}' 时的收尾 ----
    if (afterCloseBrace) {
      afterCloseBrace = false;
      if (t.type === 'name' && CASE_LABEL_TAIL.has(t.value)) pad();
      else if (!(t.type === 'punct' && NO_PAD_BEFORE.has(t.value))) newline();
    }

    // ---- ASI 保护: 该换行有语义, 必须保留 ----
    if (asiHazard(prevSig, t)) newline();

    // ---- 回到同一个 switch 的下一个 case: 收回 case 体缩进 ----
    if (caseIndent > 0 && stack.length === caseDepth && t.type === 'name'
      && (t.value === 'case' || t.value === 'default')) {
      level -= 1;
      caseIndent = 0;
    }

    // ---- 标点 ----
    if (t.type === 'punct') {
      const v = t.value;
      switch (v) {
        case '{':
          if (!(prevSig && prevSig.type === 'punct' && TIGHT_AFTER_OPEN.has(prevSig.value))) pad();
          write('{');
          stack.push('{');
          level += 1;
          if (!(nextSig && nextSig.value === '}')) newline();
          break;
        case '}':
          if (caseIndent > 0 && stack.length === caseDepth) { level -= 1; caseIndent = 0; }
          level = Math.max(0, level - 1);
          if (!(prevSig && prevSig.type === 'punct' && prevSig.value === '{')) newline();
          write('}');
          stack.pop();
          afterCloseBrace = true;
          break;
        case ';':
          write(';');
          if (top === '(' || top === '[') pad();
          // 行尾注释跟在同一行
          else if (nextRaw && nextRaw.type === 'comment' && nextRaw.nl === 0) pad();
          else if (!(nextSig && (nextSig.value === '}' || nextSig.value === ';'))) newline();
          break;
        case ',':
          write(',');
          if (top === '{') newline();
          else if (!(nextSig && nextSig.type === 'punct' && (nextSig.value === ')' || nextSig.value === ']' || nextSig.value === '}'))) pad();
          break;
        case '(':
        case '[':
          if (prevSig && prevSig.type === 'name' && SPACE_AFTER_KEYWORD.has(prevSig.value)) pad();
          write(v);
          stack.push(v);
          break;
        case ')':
        case ']':
          write(v);
          stack.pop();
          if (v === ')' && t.ctrl && nextSig && !(nextSig.type === 'punct' && NO_PAD_BEFORE.has(nextSig.value))) pad();
          break;
        case '.':
        case '?.':
          if (prevSig && prevSig.type === 'number' && !/[.eExXbBoOn]/.test(prevSig.value)) pad();
          write(v);
          break;
        case '++':
        case '--':
          write(v);
          break;
        case ':': {
          // 对象键 (a: 1 / 'a': 1 / [x]: 1 / case 1: / default: ) 前不加空格
          const isKey = prevSig?.value === ']' || ((prevSig?.type === 'name' || prevSig?.type === 'number'
            || prevSig?.type === 'string')
            && (!prevPrev || prevPrev.value === '{' || prevPrev.value === ',' || prevPrev.value === ';'
              || prevPrev.value === 'case'));
          if (!isKey) pad();
          write(':');
          if (prevPrev && prevPrev.value === 'case') {
            newline();
            if (caseIndent === 0) { caseIndent = 1; caseDepth = stack.length; level += 1; }
          } else if (prevSig && prevSig.value === 'default') {
            newline();
            if (caseIndent === 0) { caseIndent = 1; caseDepth = stack.length; level += 1; }
          } else pad();
          break;
        }
        case '?':
          if (nextSig && nextSig.value === ':' && prevSig && prevSig.type === 'name') write('?');
          else { pad(); write('?'); pad(); }
          break;
        case '*':
          if (prevSig && prevSig.type === 'name' && (prevSig.value === 'function' || prevSig.value === 'yield')) {
            write('*');
            pad();
          } else if (prevSig && prevSig.type === 'punct' && (prevSig.value === '{' || prevSig.value === ',' || prevSig.value === ';')) {
            write('*');
          } else {
            pad();
            write('*');
            pad();
          }
          break;
        default:
          if (v === '!' || v === '~') { pad(); write(v); break; }
          if (BINARY_OPS.has(v)) {
            if ((v === '+' || v === '-') && !exprEnd(prevSig)) { pad(); write(v); break; }
            pad();
            write(v);
            pad();
            break;
          }
          write(v);
          break;
      }
      prevSig = t;
      continue;
    }

    // ---- 标识符 / 字面量 ----
    if (t.type === 'name' && BINARY_OPS.has(t.value)) {
      pad();
      write(t.value);
      pad();
    } else {
      // 相邻的「词」之间必须有空格: async function / x of y / A extends B
      if (prevSig?.type === 'name' && (t.type === 'name' || t.type === 'number' || t.type === 'regex')) pad();
      write(t.value);
      if (t.type === 'name' && SPACE_AFTER_KEYWORD.has(t.value)
        && !(nextSig && nextSig.type === 'punct' && NO_PAD_BEFORE.has(nextSig.value))) pad();
    }
    prevSig = t;
  }

  const trimmed = out.replace(/[ \t]+$/, '').replace(/\n+$/, '');
  return trimmed === '' ? '' : `${trimmed}\n`;
}

/* ------------------------------------------------------------------ *
 * 压缩
 * ------------------------------------------------------------------ */

/** 拼在末尾会变成另一个 token 的字符对 */
const FORBIDDEN_PAIRS = new Set([
  '//', '/*', '*/', '++', '--', '&&', '||', '??', '?.', '==', '!=', '<=', '>=', '=>', '**',
  '<<', '>>', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
]);

const isWordPart = (ch: string): boolean => /[A-Za-z0-9_$\u0080-\uffff]/.test(ch);

/** 两个 token 相邻拼接时是否需要插入空格 */
export function needsSpace(out: string, token: JsToken): boolean {
  if (out === '') return false;
  const last = out[out.length - 1];
  const first = token.value[0];
  if (last === '\n' || last === ' ' || last === '\t') return false;
  if (isWordPart(last) && isWordPart(first)) return true;
  if (last >= '0' && last <= '9' && first === '.') return true;
  if (FORBIDDEN_PAIRS.has(last + first)) return true;
  return false;
}

export function minifyJs(code: string, opts: MinifyOptions = {}): string {
  const removeComments = opts.removeComments !== false;
  const oneLine = opts.oneLine !== false;
  const toks = tokenizeJs(code);

  let out = '';
  let prevSig: JsToken | undefined;
  let afterLineComment = false;
  const newline = () => {
    out = out.replace(/[ \t]+$/, '');
    if (!out.endsWith('\n')) out += '\n';
  };

  for (const t of toks) {
    if (t.type === 'comment' && removeComments) continue;
    if (asiHazard(prevSig, t) || afterLineComment) newline();
    else if (!oneLine && t.nl > 0) newline();
    else if (needsSpace(out, t)) out += ' ';
    out += t.value;
    if (t.type === 'comment') afterLineComment = t.value.startsWith('//') && !removeComments;
    else { afterLineComment = false; prevSig = t; }
  }

  return out.replace(/[ \t]+$/, '').replace(/^\n+/, '');
}
