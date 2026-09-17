import { buildRegexCode, REGEX_CODE_LANGS, type RegexCodeLang } from './codegen';
import { highlightCode } from './highlight';

/** 去掉高亮标签并把实体还原成纯文本 */
const plain = (html: string): string =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

const sample = (lang: RegexCodeLang) => buildRegexCode(lang, { pattern: '^1[3-9]\\d{9}$', flags: 'gi', text: 'a\nb' });

describe('highlightCode 21 种语言语法高亮', () => {
  test('每种语言都能高亮出标签, 且高亮不改变原始代码内容', () => {
    for (const lang of REGEX_CODE_LANGS) {
      const code = sample(lang);
      const html = highlightCode(code, lang);
      expect(`[${lang}] ${html.includes('hljs-')}`).toBe(`[${lang}] true`); // 至少一个 token 被包上 hljs-* 类名
      expect(`[${lang}] ${plain(html)}`).toBe(`[${lang}] ${code}`);        // 文本内容与生成代码完全一致
    }
  });

  test('关键字 / 字符串按语言分别着色的例子', () => {
    expect(highlightCode(sample('python'), 'python')).toContain('hljs-keyword');
    expect(highlightCode(sample('python'), 'python')).toContain('hljs-string');
    expect(highlightCode(sample('rust'), 'rust')).toContain('hljs-keyword');
    expect(highlightCode(sample('java'), 'java')).toContain('hljs-keyword');
    expect(highlightCode(sample('csharp'), 'csharp')).toContain('hljs-keyword');
    expect(highlightCode(sample('javascript'), 'javascript')).toContain('hljs-keyword');
    expect(highlightCode(sample('php'), 'php')).toContain('hljs-variable');
    expect(highlightCode(sample('perl'), 'perl')).toContain('hljs-keyword');
    expect(highlightCode(sample('go'), 'go')).toContain('hljs-keyword');
    expect(highlightCode(sample('c'), 'c')).toContain('hljs-keyword');
    expect(highlightCode(sample('cpp'), 'cpp')).toContain('hljs-keyword');
    expect(highlightCode(sample('r'), 'r')).toContain('hljs-keyword');
    expect(highlightCode(sample('ruby'), 'ruby')).toContain('hljs-keyword');
    expect(highlightCode(sample('swift'), 'swift')).toContain('hljs-keyword');
    expect(highlightCode(sample('objectivec'), 'objectivec')).toContain('hljs-keyword');
    expect(highlightCode(sample('kotlin'), 'kotlin')).toContain('hljs-keyword');
    expect(highlightCode(sample('typescript'), 'typescript')).toContain('hljs-keyword');
    expect(highlightCode(sample('erlang'), 'erlang')).toContain('hljs-keyword');
    expect(highlightCode(sample('lua'), 'lua')).toContain('hljs-keyword');
    expect(highlightCode(sample('powershell'), 'powershell')).toContain('hljs-variable');
    expect(highlightCode(sample('julia'), 'julia')).toContain('hljs-keyword');
    expect(highlightCode(sample('delphi'), 'delphi')).toContain('hljs-keyword');
  });

  test('代码里的尖括号 / & 会被转义, 显示出来仍是原文', () => {
    const html = highlightCode(sample('erlang'), 'erlang');
    expect(html).toContain('&gt;');
    expect(plain(html)).toContain('->');
  });

  test('未注册的语言名走兜底: 原样转义输出', () => {
    const html = highlightCode('a < b && c > d', 'plaintext' as RegexCodeLang);
    expect(html).toBe('a &lt; b &amp;&amp; c &gt; d');
  });
});
