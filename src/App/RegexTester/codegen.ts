// 正则表达式 → 各语言调用代码生成 (纯函数, 便于单测)
// 注意: 生成代码里的注释统一用英文 (跨语言通用), 界面文案由页面做多语言

export const REGEX_CODE_LANGS = [
  'python', 'c', 'cpp', 'java', 'csharp', 'javascript', 'r', 'rust', 'delphi', 'php',
  'go', 'ruby', 'swift', 'perl', 'objectivec', 'julia', 'kotlin', 'typescript',
  'erlang', 'lua', 'powershell',
] as const;

export type RegexCodeLang = (typeof REGEX_CODE_LANGS)[number];

/** 语言展示名 (下拉框与标签用, 不随界面语言变化) */
export const REGEX_CODE_LABELS: Record<RegexCodeLang, string> = {
  python: 'Python',
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  csharp: 'C#',
  javascript: 'JavaScript',
  r: 'R',
  rust: 'Rust',
  delphi: 'Delphi',
  php: 'PHP',
  go: 'Go',
  ruby: 'Ruby',
  swift: 'Swift',
  perl: 'Perl',
  objectivec: 'Objective-C',
  julia: 'Julia',
  kotlin: 'Kotlin',
  typescript: 'TypeScript',
  erlang: 'Erlang',
  lua: 'Lua',
  powershell: 'PowerShell',
};

export interface RegexCodeInput {
  /** 当前正则表达式 (原样使用, 不做语法改写) */
  pattern: string;
  /** 标志位字符串, 如 'gi' (顺序不限, 不区分大小写) */
  flags: string;
  /** 上方的测试文本 (选填; 生成时最多取前几行) */
  text?: string;
}

/** 生成代码里示例文本最多取多少行 */
export const MAX_TEXT_LINES = 6;

/** 文本为空时的占位示例 */
const SAMPLE_TEXT = 'example text 123';

interface Ctx {
  pattern: string;
  flags: string;
  text: string;
}

// ---------------------------------------------------------------- 字面量工具

/** 双引号字符串转义 (\ " 换行 制表) */
const dq = (s: string): string => s
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r')
  .replace(/\t/g, '\\t');

/** 单引号字符串转义 ('' 表示一个单引号) */
const sq = (s: string): string => s.replace(/'/g, "''");

/** 三引号原始字符串 (python / julia / kotlin), 冲突时退化为普通转义字符串 */
const triple = (s: string): string => (s.includes('"""') ? `"${dq(s)}"` : `"""${s}"""`);

/** Lua 长字符串 [=[...]=], 冲突时退化为普通转义字符串 */
const luaLong = (s: string): string => (s.includes(']=]') ? `"${dq(s)}"` : `[=[${s}]=]`);

/** python r"..." / r'...' 原始字符串 (避免 \d 被二次转义) */
const pyRaw = (s: string): string => {
  if (!s.includes('"')) return `r"${s}"`;
  if (!s.includes("'")) return `r'${s}'`;
  return `"${dq(s)}"`;
};

/** rust r"..." / r#"..."# 原始字符串 */
const rustRaw = (s: string): string => (s.includes('"') ? `r#"${s}"#` : `r"${s}"`);

/** go 反引号原始字符串 (冲突时普通字符串 + 转义) */
const goRaw = (s: string): string => (s.includes('`') ? `"${dq(s)}"` : `\`${s}\``);

/** swift #"..."# 原始字符串 */
const swiftRaw = (s: string): string => (s.includes('"#') ? `"${dq(s)}"` : `#"${s}"#`);

/** R 原始字符串 r"(...)" */
const rRaw = (s: string): string => (s.includes(')"') ? `"${dq(s)}"` : `r"(${s})"`);

/** C++ 原始字符串 R"(...)" */
const cppRaw = (s: string): string => (s.includes(')"') ? `"${dq(s)}"` : `R"(${s})"`);

/** C# 逐字字符串 @"..." (内部引号翻倍) */
const csVerbatim = (s: string): string => `@"${s.replace(/"/g, '""')}"`;

/** Objective-C / Swift 风格 @"..." */
const objcStr = (s: string): string => `@"${dq(s)}"`;

/** JS / TS 正则字面量 (含 / 时退化为 new RegExp) */
const jsRegex = (pattern: string, flags: string): string =>
  (pattern.includes('/') ? `new RegExp("${dq(pattern)}", "${flags}")` : `/${pattern}/${flags}`);

/** Perl / Ruby 风格的 /.../flags 字面量 (前缀可给 qr) */
const slashRegex = (pattern: string, flags: string, prefix = ''): string =>
  `${prefix}/${pattern.replace(/\//g, '\\/')}/${flags}`;

/** PHP 的 '/.../flags' 字符串 (含 / 时换分隔符, 都冲突则转义) */
const phpRegex = (pattern: string, flags: string): string => {
  const delim = [ '/', '~', '#' ].find((d) => !pattern.includes(d));
  if (delim === undefined) return `'/${pattern.replace(/\//g, '\\/')}/${flags}'`;
  return delim === '/' ? `'/${pattern}/${flags}'` : `'${delim}${pattern}${delim}${flags}'`;
};

// ---------------------------------------------------------------- 标志位

const has = (flags: string, c: string): boolean => flags.includes(c);

/** 内联标志前缀 (?ims) — rust / go / R 等语言用 */
const inline = (flags: string): string => {
  const s = [ 'i', 'm', 's' ].filter((c) => has(flags, c)).join('');
  return s === '' ? '' : `(?${s})`;
};

/** 把非空标志位拼成 ", a | b" 形式 (无标志位时返回空串) */
const joinFlags = (flags: string[], sep: string): string => {
  const hit = flags.filter((x) => x !== '');
  return hit.length === 0 ? '' : `, ${hit.join(sep)}`;
};

/** 去掉空项后的标志位列表 */
const compact = (flags: string[]): string[] => flags.filter((x) => x !== '');

/** PHP preg 修饰符 (g 由 preg_match_all 体现, 不是修饰符) */
const phpFlags = (flags: string): string => [ 'i', 'm', 's' ].filter((x) => has(flags, x)).join('');

/** Perl qr// 修饰符 (g 由匹配循环里的 /g 体现) */
const perlFlags = (flags: string): string => [ 'i', 'm', 's' ].filter((x) => has(flags, x)).join('');

// ---------------------------------------------------------------- 生成器

const pythonCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 're.IGNORECASE' : '',
    has(c.flags, 'm') ? 're.MULTILINE' : '',
    has(c.flags, 's') ? 're.DOTALL' : '',
  ];
  return [
    'import re',
    '',
    `pattern = re.compile(${pyRaw(c.pattern)}${joinFlags(opts, ' | ')})`,
    `text = ${triple(c.text)}`,
    '',
    'for m in pattern.finditer(text):',
    '    print(m.group(0))',
  ].join('\n');
};

const cCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'REG_ICASE' : '',
    has(c.flags, 'm') ? 'REG_NEWLINE' : '',
  ];
  return [
    '#include <regex.h>',
    '#include <stdio.h>',
    '',
    'int main(void) {',
    '    /* POSIX ERE: \\d \\w \\s and lookarounds are not supported - rewrite them first */',
    '    regex_t re;',
    '    regmatch_t m[1];',
    `    const char *pattern = "${dq(c.pattern)}";`,
    `    const char *text = "${dq(c.text)}";`,
    '    const char *p = text;',
    '',
    `    if (regcomp(&re, pattern, ${[ 'REG_EXTENDED', ...compact(opts) ].join(' | ')}) != 0) {`,
    '        fprintf(stderr, "invalid regex\\n");',
    '        return 1;',
    '    }',
    '    while (regexec(&re, p, 1, m, 0) == 0) {',
    '        printf("%.*s\\n", (int)(m[0].rm_eo - m[0].rm_so), p + m[0].rm_so);',
    '        if (m[0].rm_eo == 0) break; /* guard against empty matches */',
    '        p += m[0].rm_eo;',
    '    }',
    '    regfree(&re);',
    '    return 0;',
    '}',
  ].join('\n');
};

const cppCode = (c: Ctx): string => {
  const opts = [
    'std::regex::ECMAScript',
    has(c.flags, 'i') ? 'std::regex::icase' : '',
    has(c.flags, 'm') ? 'std::regex::multiline' : '',
  ];
  return [
    '#include <iostream>',
    '#include <regex>',
    '#include <string>',
    ...(has(c.flags, 's') ? [ '// std::regex has no dotall flag: use [\\s\\S] instead of . for s' ] : []),
    '',
    'int main() {',
    `    std::regex re(${cppRaw(c.pattern)}, ${opts.filter((x) => x !== '').join(' | ')});`,
    `    std::string text = "${dq(c.text)}";`,
    '',
    '    for (auto it = std::sregex_iterator(text.begin(), text.end(), re); it != std::sregex_iterator(); ++it) {',
    '        std::cout << it->str() << std::endl;',
    '    }',
    '    return 0;',
    '}',
  ].join('\n');
};

const javaCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'Pattern.CASE_INSENSITIVE' : '',
    has(c.flags, 'm') ? 'Pattern.MULTILINE' : '',
    has(c.flags, 's') ? 'Pattern.DOTALL' : '',
  ];
  return [
    'import java.util.regex.Matcher;',
    'import java.util.regex.Pattern;',
    '',
    'public class Main {',
    '    public static void main(String[] args) {',
    `        Pattern pattern = Pattern.compile("${dq(c.pattern)}"${joinFlags(opts, ' | ')});`,
    `        String text = "${dq(c.text)}";`,
    '',
    '        Matcher matcher = pattern.matcher(text);',
    '        while (matcher.find()) {',
    '            System.out.println(matcher.group());',
    '        }',
    '    }',
    '}',
  ].join('\n');
};

const csharpCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'RegexOptions.IgnoreCase' : '',
    has(c.flags, 'm') ? 'RegexOptions.Multiline' : '',
    has(c.flags, 's') ? 'RegexOptions.Singleline' : '',
  ];
  return [
    'using System;',
    'using System.Text.RegularExpressions;',
    '',
    'class Program',
    '{',
    '    static void Main()',
    '    {',
    `        var pattern = new Regex(${csVerbatim(c.pattern)}${joinFlags(opts, ' | ')});`,
    `        var text = "${dq(c.text)}";`,
    '',
    '        foreach (Match m in pattern.Matches(text))',
    '        {',
    '            Console.WriteLine(m.Value);',
    '        }',
    '    }',
    '}',
  ].join('\n');
};

const jsCode = (c: Ctx, ts: boolean): string => {
  const flags = has(c.flags, 'g') ? c.flags : `${c.flags}g`;
  const head = has(c.flags, 'g') ? [] : [ '// matchAll requires the g flag - it was added below' ];
  const body = ts
    ? [ 'const matches = [ ...text.matchAll(re) ].map((m) => m[0]);', 'console.log(matches);' ]
    : [ 'for (const m of text.matchAll(re)) {', '  console.log(m[0]);', '}' ];
  return [
    ...head,
    `const re = ${jsRegex(c.pattern, flags)};`,
    `const text = "${dq(c.text)}";`,
    '',
    ...body,
  ].join('\n');
};

const rCode = (c: Ctx): string => {
  const ms = [ 'm', 's' ].filter((x) => has(c.flags, x)).join('');
  const pre = ms === '' ? '' : `(?${ms})`;
  const head = pre === '' ? [] : [ `# m / s apply as the inline flag ${pre}` ];
  return [
    ...head,
    `pattern <- ${rRaw(pre + c.pattern)}`,
    `text <- "${dq(c.text)}"`,
    '',
    `m <- gregexpr(pattern, text, perl = TRUE${has(c.flags, 'i') ? ', ignore.case = TRUE' : ''})`,
    'for (hit in regmatches(text, m)[[1]]) print(hit)',
  ].join('\n');
};

const rustCode = (c: Ctx): string => [
  'use regex::Regex;',
  '',
  'fn main() {',
  `    let re = Regex::new(${rustRaw(inline(c.flags) + c.pattern)}).unwrap();`,
  `    let text = "${dq(c.text)}";`,
  '',
  '    for m in re.find_iter(text) {',
  '        println!("{}", m.as_str());',
  '    }',
  '}',
].join('\n');

const delphiCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'roIgnoreCase' : '',
    has(c.flags, 'm') ? 'roMultiLine' : '',
    has(c.flags, 's') ? 'roSingleLine' : '',
  ];
  // Delphi 字符串字面量不用嵌入换行, 用 sLineBreak 拼接更稳
  const text = c.text.split('\n').map((line) => `'${sq(line)}'`).join(' + sLineBreak + ');
  return [
    'uses',
    '  System.RegularExpressions;',
    '',
    'procedure Run;',
    'var',
    '  Regex: TRegEx;',
    '  Text: string;',
    '  Match: TMatch;',
    'begin',
    `  Text := ${text};`,
    `  Regex := TRegEx.Create('${sq(c.pattern)}'${compact(opts).length === 0 ? '' : `, [${compact(opts).join(', ')}]`});`,
    '  for Match in Regex.Matches(Text) do',
    '    Writeln(Match.Value);',
    'end;',
  ].join('\n');
};

const phpCode = (c: Ctx): string => [
  '<?php',
  `$pattern = ${phpRegex(c.pattern, phpFlags(c.flags))};`,
  `$text = "${dq(c.text)}";`,
  '',
  'preg_match_all($pattern, $text, $matches);',
  'print_r($matches[0]);',
].join('\n');

const goCode = (c: Ctx): string => [
  'package main',
  '',
  'import (',
  '\t"fmt"',
  '\t"regexp"',
  ')',
  '',
  'func main() {',
  `\tre := regexp.MustCompile(${goRaw(inline(c.flags) + c.pattern)})`,
  `\ttext := "${dq(c.text)}"`,
  '',
  '\tfor _, m := range re.FindAllString(text, -1) {',
  '\t\tfmt.Println(m)',
  '\t}',
  '}',
].join('\n');

const rubyCode = (c: Ctx): string => {
  const flags = [ has(c.flags, 'i') ? 'i' : '', has(c.flags, 's') ? 'm' : '' ].join('');
  const head = has(c.flags, 'm')
    ? [ '# Ruby: ^ and $ already match at line boundaries, so no m flag is needed' ] : [];
  return [
    ...head,
    `pattern = ${slashRegex(c.pattern, flags)}`,
    `text = "${dq(c.text)}"`,
    '',
    'text.scan(pattern) do',
    '  puts Regexp.last_match(0)',
    'end',
  ].join('\n');
};

const swiftCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? '.caseInsensitive' : '',
    has(c.flags, 'm') ? '.anchorsMatchLines' : '',
    has(c.flags, 's') ? '.dotMatchesLineSeparators' : '',
  ];
  const list = compact(opts);
  return [
    'import Foundation',
    '',
    `let pattern = ${swiftRaw(c.pattern)}`,
    `let text = "${dq(c.text)}"`,
    '',
    `let regex = try! NSRegularExpression(pattern: pattern${list.length === 0 ? '' : `, options: [${list.join(', ')}]`})`,
    'let range = NSRange(text.startIndex..<text.endIndex, in: text)',
    '',
    'for m in regex.matches(in: text, range: range) {',
    '    if let r = Range(m.range, in: text) { print(text[r]) }',
    '}',
  ].join('\n');
};

const perlCode = (c: Ctx): string => [
  `my $pattern = ${slashRegex(c.pattern, perlFlags(c.flags), 'qr')};`,
  `my $text = "${dq(c.text)}";`,
  '',
  'while ($text =~ /$pattern/g) {',
  '    print "$&\\n";',
  '}',
].join('\n');

const objectivecCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'NSRegularExpressionCaseInsensitive' : '',
    has(c.flags, 'm') ? 'NSRegularExpressionAnchorsMatchLines' : '',
    has(c.flags, 's') ? 'NSRegularExpressionDotMatchesLineSeparators' : '',
  ];
  const list = compact(opts);
  return [
    '#import <Foundation/Foundation.h>',
    '',
    'int main(void) {',
    '    @autoreleasepool {',
    `        NSString *pattern = ${objcStr(c.pattern)};`,
    `        NSString *text = ${objcStr(c.text)};`,
    `        NSRegularExpressionOptions options = ${list.length === 0 ? '0' : list.join(' | ')};`,
    '        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:pattern options:options error:nil];',
    '        for (NSTextCheckingResult *m in [regex matchesInString:text options:0 range:NSMakeRange(0, text.length)]) {',
    '            NSLog(@"%@", [text substringWithRange:m.range]);',
    '        }',
    '    }',
    '    return 0;',
    '}',
  ].join('\n');
};

const juliaCode = (c: Ctx): string => {
  const flags = [ 'i', 'm', 's' ].filter((x) => has(c.flags, x)).join('');
  const lit = c.pattern.includes('"')
    ? `Regex("${dq(c.pattern)}", "${flags}")`
    : `r"${c.pattern}"${flags}`;
  return [
    `pattern = ${lit}`,
    `text = ${triple(c.text)}`,
    '',
    'for m in eachmatch(pattern, text)',
    '    println(m.match)',
    'end',
  ].join('\n');
};

const kotlinCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'RegexOption.IGNORE_CASE' : '',
    has(c.flags, 'm') ? 'RegexOption.MULTILINE' : '',
    has(c.flags, 's') ? 'RegexOption.DOT_MATCHES_ALL' : '',
  ];
  const list = compact(opts);
  return [
    `val pattern = Regex(${triple(c.pattern)}${list.length === 0 ? '' : `, setOf(${list.join(', ')})`})`,
    `val text = ${triple(c.text)}`,
    '',
    'pattern.findAll(text).forEach { println(it.value) }',
  ].join('\n');
};

const erlangCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'caseless' : '',
    has(c.flags, 'm') ? 'multiline' : '',
    has(c.flags, 's') ? 'dotall' : '',
  ];
  return [
    '-module(regex_match).',
    '-export([main/0]).',
    '',
    'main() ->',
    `    Pattern = "${dq(c.pattern)}",`,
    `    Text = "${dq(c.text)}",`,
    `    {ok, Re} = re:compile(Pattern, [unicode${joinFlags(opts, ', ')}]),`,
    '    case re:run(Text, Re, [global, {capture, first, list}]) of',
    '        {match, Matches} -> [ io:format("~s~n", [M]) || M <- Matches ];',
    '        nomatch -> ok',
    '    end.',
  ].join('\n');
};

const luaCode = (c: Ctx): string => [
  '-- Lua built-in patterns are not PCRE: \\d \\w \\s and lookarounds need rewriting (e.g. %d),',
  '-- or use a PCRE binding such as lrexlib for the pattern below.',
  `local pattern = ${luaLong(c.pattern)}`,
  `local text = ${luaLong(c.text)}`,
  '',
  'for m in string.gmatch(text, pattern) do',
  '  print(m)',
  'end',
].join('\n');

const powershellCode = (c: Ctx): string => {
  const opts = [
    has(c.flags, 'i') ? 'IgnoreCase' : '',
    has(c.flags, 'm') ? 'Multiline' : '',
    has(c.flags, 's') ? 'Singleline' : '',
  ];
  const list = compact(opts).map((x) => `[System.Text.RegularExpressions.RegexOptions]::${x}`);
  return [
    `$pattern = '${sq(c.pattern)}'`,
    "$text = @'",
    c.text,
    "'@",
    '',
    list.length === 0
      ? '[regex]::Matches($text, $pattern) |'
      : `[regex]::Matches($text, $pattern, ${list.join(' -bor ')}) |`,
    '    ForEach-Object { $_.Value }',
  ].join('\n');
};

// ---------------------------------------------------------------- 入口

/** 示例文本: 取上方输入的前 MAX_TEXT_LINES 行; 为空时用占位示例 */
const ctxOf = (input: RegexCodeInput): Ctx => {
  const raw = (input.text ?? '').replace(/\r\n/g, '\n').replace(/\n+$/, '');
  const lines = raw === '' ? SAMPLE_TEXT.split('\n') : raw.split('\n').slice(0, MAX_TEXT_LINES);
  return { pattern: input.pattern, flags: input.flags, text: lines.join('\n') };
};

const BUILDERS: Record<RegexCodeLang, (c: Ctx) => string> = {
  python: pythonCode,
  c: cCode,
  cpp: cppCode,
  java: javaCode,
  csharp: csharpCode,
  javascript: (c) => jsCode(c, false),
  r: rCode,
  rust: rustCode,
  delphi: delphiCode,
  php: phpCode,
  go: goCode,
  ruby: rubyCode,
  swift: swiftCode,
  perl: perlCode,
  objectivec: objectivecCode,
  julia: juliaCode,
  kotlin: kotlinCode,
  typescript: (c) => jsCode(c, true),
  erlang: erlangCode,
  lua: luaCode,
  powershell: powershellCode,
};

/** 生成所选语言的调用代码 (pattern / flags / 示例文本都来自当前输入) */
export const buildRegexCode = (lang: RegexCodeLang, input: RegexCodeInput): string =>
  BUILDERS[lang](ctxOf(input));
