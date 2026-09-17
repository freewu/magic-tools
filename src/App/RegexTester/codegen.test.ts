import '@testing-library/jest-dom';
import {
  buildRegexCode,
  REGEX_CODE_LABELS,
  REGEX_CODE_LANGS,
  MAX_TEXT_LINES,
  type RegexCodeLang,
} from './codegen';

/** 生成一段代码 (默认输入: 手机号 + g/i 标志位 + 三行文本) */
const gen = (lang: RegexCodeLang, pattern = '^1[3-9]\\d{9}$', flags = 'gi', text = 'zhangsan@example.com\n13800138000\nnot-a-phone') =>
  buildRegexCode(lang, { pattern, flags, text });

describe('codegen 语言清单', () => {
  test('覆盖约定的 21 种语言且顺序与需求一致', () => {
    expect(REGEX_CODE_LANGS).toEqual([
      'python', 'c', 'cpp', 'java', 'csharp', 'javascript', 'r', 'rust', 'delphi', 'php',
      'go', 'ruby', 'swift', 'perl', 'objectivec', 'julia', 'kotlin', 'typescript',
      'erlang', 'lua', 'powershell',
    ]);
    expect(REGEX_CODE_LANGS.length).toBe(21);
  });

  test('每种语言都有展示名', () => {
    for (const lang of REGEX_CODE_LANGS) {
      expect(REGEX_CODE_LABELS[lang]).toBeTruthy();
    }
    expect(REGEX_CODE_LABELS.csharp).toBe('C#');
    expect(REGEX_CODE_LABELS.powershell).toBe('PowerShell');
  });

  test('21 种语言都能生成代码, 且不含 undefined / [object', () => {
    for (const lang of REGEX_CODE_LANGS) {
      const code = gen(lang);
      expect(code.length).toBeGreaterThan(20);
      expect(code).not.toContain('undefined');
      expect(code).not.toContain('[object');
      expect(code.endsWith('\n')).toBe(false);
    }
  });
});

describe('codegen 标志位映射', () => {
  test('python: 原始字符串 + re.IGNORECASE (g 由 finditer 体现)', () => {
    const code = gen('python');
    expect(code).toContain('pattern = re.compile(r"^1[3-9]\\d{9}$", re.IGNORECASE)');
    expect(code).toContain('for m in pattern.finditer(text):');
    expect(code).not.toContain('re.GLOBAL');
  });

  test('python: 无标志位时不带第二个参数, m/s 分别映射 MULTILINE / DOTALL', () => {
    expect(gen('python', '^a$', '')).toContain('re.compile(r"^a$")');
    const code = gen('python', '^a$', 'ms');
    expect(code).toContain('re.MULTILINE | re.DOTALL');
  });

  test('c: REG_EXTENDED 与 REG_ICASE 用 | 连接, 并提示 POSIX 语法差异', () => {
    const code = gen('c');
    expect(code).toContain('regcomp(&re, pattern, REG_EXTENDED | REG_ICASE)');
    expect(code).not.toContain('REG_EXTENDED, REG_ICASE');
    expect(code).toContain('POSIX ERE');
    expect(code).toContain('const char *text = "zhangsan@example.com\\n13800138000\\nnot-a-phone";');
    expect(code).toContain('#include <regex.h>');
  });

  test('cpp: R"(...)" 原始字符串 + ECMAScript/icase, s 标志位给出提示', () => {
    expect(gen('cpp')).toContain('std::regex re(R"(^1[3-9]\\d{9}$)", std::regex::ECMAScript | std::regex::icase);');
    const code = gen('cpp', 'a.b', 's');
    expect(code).toContain('use [\\s\\S] instead of . for s');
  });

  test('java: Pattern.CASE_INSENSITIVE / MULTILINE / DOTALL', () => {
    expect(gen('java')).toContain('Pattern.compile("^1[3-9]\\\\d{9}$", Pattern.CASE_INSENSITIVE)');
    expect(gen('java', '^a$', 'gims')).toContain('Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL');
    expect(gen('java', '^a$', 'g')).toContain('Pattern.compile("^a$")');
  });

  test('csharp: 逐字字符串 + RegexOptions', () => {
    expect(gen('csharp')).toContain('new Regex(@"^1[3-9]\\d{9}$", RegexOptions.IgnoreCase)');
    expect(gen('csharp', '^a$', 'gims')).toContain('RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Singleline');
  });

  test('javascript: 正则字面量自动补 g, 并给出注释说明', () => {
    const code = gen('javascript', '^a$', 'i');
    expect(code).toContain('// matchAll requires the g flag');
    expect(code).toContain('const re = /^a$/ig;');
    expect(gen('javascript')).not.toContain('requires the g flag');
    expect(gen('javascript')).toContain('const re = /^1[3-9]\\d{9}$/gi;');
    expect(gen('javascript')).toContain('for (const m of text.matchAll(re)) {');
  });

  test('javascript: 含 / 的正则退化为 new RegExp, typescript 用数组收集结果', () => {
    expect(gen('javascript', 'a/b', 'i')).toContain('const re = new RegExp("a/b", "ig");');
    expect(gen('typescript', '^1[3-9]\\d{9}$', 'gi')).toContain('[ ...text.matchAll(re) ].map((m) => m[0])');
  });

  test('r: perl=TRUE + ignore.case, m/s 用内联标志', () => {
    expect(gen('r')).toContain('pattern <- r"(^1[3-9]\\d{9}$)"');
    expect(gen('r')).toContain('gregexpr(pattern, text, perl = TRUE, ignore.case = TRUE)');
    const code = gen('r', '^a$', 'gs');
    expect(code).toContain('# m / s apply as the inline flag (?s)');
    expect(code).toContain('r"((?s)^a$)"');
    expect(code).not.toContain('ignore.case');
  });

  test('rust / go: 内联 (?i) 前缀 + 原始字符串', () => {
    expect(gen('rust')).toContain('Regex::new(r"(?i)^1[3-9]\\d{9}$").unwrap()');
    expect(gen('go')).toContain('regexp.MustCompile(`(?i)^1[3-9]\\d{9}$`)');
    expect(gen('rust', '^a$', 'g')).toContain('Regex::new(r"^a$")');
    expect(gen('go', '^a$', 'g')).toContain('regexp.MustCompile(`^a$`)');
  });

  test('delphi: 文本用 sLineBreak 拼接, 字符串不用内嵌换行', () => {
    const code = gen('delphi');
    expect(code).toContain("Text := 'zhangsan@example.com' + sLineBreak + '13800138000' + sLineBreak + 'not-a-phone';");
    expect(code).toContain("TRegEx.Create('^1[3-9]\\d{9}$', [roIgnoreCase]);");
    expect(gen('delphi', '^a$', 'gims')).toContain('[roIgnoreCase, roMultiLine, roSingleLine]');
    expect(gen('delphi', '^a$', 'g')).toContain("TRegEx.Create('^a$');");
  });

  test('php: 丢掉 g (用 preg_match_all), 含 / 时换分隔符', () => {
    expect(gen('php')).toContain("$pattern = '/^1[3-9]\\d{9}$/i';");
    expect(gen('php')).toContain('preg_match_all($pattern, $text, $matches);');
    expect(gen('php', 'a/b', 'g')).toContain("$pattern = '~a/b~';");
    expect(gen('php', 'a~b/c', 'g')).toContain("$pattern = '#a~b/c#';");
  });

  test('ruby: s 映射为 m, 单独的 m 只需注释说明', () => {
    expect(gen('ruby')).toContain('pattern = /^1[3-9]\\d{9}$/i');
    expect(gen('ruby', '^a$', 'gs')).toContain('pattern = /^a$/m');
    const code = gen('ruby', '^a$', 'gm');
    expect(code).toContain('# Ruby: ^ and $ already match at line boundaries');
    expect(code).toContain('pattern = /^a$/');
  });

  test('swift / objectivec / kotlin / julia / erlang / powershell 的关键写法', () => {
    expect(gen('swift')).toContain('let pattern = #"^1[3-9]\\d{9}$"#');
    expect(gen('swift')).toContain('NSRegularExpression(pattern: pattern, options: [.caseInsensitive])');
    expect(gen('objectivec')).toContain('NSString *pattern = @"^1[3-9]\\\\d{9}$";');
    expect(gen('objectivec')).toContain('NSRegularExpressionOptions options = NSRegularExpressionCaseInsensitive;');
    expect(gen('kotlin')).toContain('Regex("""^1[3-9]\\d{9}$""", setOf(RegexOption.IGNORE_CASE))');
    expect(gen('julia')).toContain('pattern = r"^1[3-9]\\d{9}$"i');
    expect(gen('erlang')).toContain('Pattern = "^1[3-9]\\\\d{9}$"');
    expect(gen('erlang')).toContain('re:compile(Pattern, [unicode, caseless])');
    expect(gen('powershell')).toContain("$pattern = '^1[3-9]\\d{9}$'");
    expect(gen('powershell')).toContain('$text = @\'');
    expect(gen('powershell')).toContain('[regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase) |');
    expect(gen('powershell', '^a$', 'g')).toContain('[regex]::Matches($text, $pattern) |');
  });

  test('perl: qr// 只带 i/m/s, 循环里用 /g', () => {
    expect(gen('perl')).toContain('my $pattern = qr/^1[3-9]\\d{9}$/i;');
    expect(gen('perl')).toContain('while ($text =~ /$pattern/g) {');
    expect(gen('perl', 'a/b', 'gims')).toContain('my $pattern = qr/a\\/b/ims;');
  });

  test('lua: 长字符串 + PCRE 语法差异提示', () => {
    const code = gen('lua');
    expect(code).toContain('local pattern = [=[^1[3-9]\\d{9}$]=]');
    expect(code).toContain('Lua built-in patterns are not PCRE');
    expect(code).toContain('string.gmatch(text, pattern)');
  });
});

describe('codegen 示例文本与转义', () => {
  test('文本为空时用占位示例', () => {
    const code = gen('python', '^a$', 'g', '');
    expect(code).toContain('text = """example text 123"""');
  });

  test('文本超过上限时只取前 MAX_TEXT_LINES 行, 并归一化 CRLF', () => {
    const many = Array.from({ length: MAX_TEXT_LINES + 4 }, (_, i) => `line${i + 1}`).join('\r\n');
    const code = gen('python', '^a$', 'g', many);
    expect(code).toContain('line1');
    expect(code).toContain(`line${MAX_TEXT_LINES}`);
    expect(code).not.toContain(`line${MAX_TEXT_LINES + 1}`);
    expect(code).not.toContain('\\r');
  });

  test('python 正则含双引号时改用单引号原始字符串', () => {
    expect(gen('python', '"quoted"', 'g')).toContain(`re.compile(r'"quoted"')`);
  });

  test('模式与文本里的引号 / 反斜杠按各语言规则转义', () => {
    expect(gen('python', 'a"b\'c', 'g')).toContain('re.compile("a\\"b\'c")');   // 两种引号都有 → 普通转义字符串
    expect(gen('csharp', 'a"b', 'g')).toContain('new Regex(@"a""b")');
    expect(gen('cpp', 'a)"b', 'g')).toContain('std::regex re("a)\\"b"');
    expect(gen('rust', 'a"b', 'g')).toContain('Regex::new(r#"a"b"#)');
    expect(gen('go', 'a`b', 'g')).toContain('regexp.MustCompile("a`b")');
    expect(gen('powershell', "a'b", 'g')).toContain("$pattern = 'a''b'");
    expect(gen('objectivec')).toContain('@"zhangsan@example.com\\n13800138000\\nnot-a-phone"');
  });
});
