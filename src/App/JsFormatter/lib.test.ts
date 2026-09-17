import {
  asiHazard, beautifyJs, decodeEscapes, escapeJsStrings, exprEnd, extractCallArgs, jsSignature,
  matchBracket, minifyJs, needsSpace, packJs, parseStringLiteral, quoteJsString, significant,
  significantAt, tokenizeJs, unpackJs, type JsToken,
} from './lib';

const types = (code: string): string[] => tokenizeJs(code).map((t) => t.type);
const values = (code: string): string[] => tokenizeJs(code).map((t) => t.value);

describe('tokenizeJs 词法扫描', () => {
  it('识别标识符 / 数字 / 标点', () => {
    expect(types('const re = /a\\d+/gi; let n = 1.5e3;')).toEqual([
      'name', 'name', 'punct', 'regex', 'punct', 'name', 'name', 'punct', 'number', 'punct',
    ]);
    expect(types('0xFF 0b1010 0o17 1_000')).toEqual([ 'number', 'number', 'number', 'number' ]);
  });

  it('按前一个 token 判定除号与正则', () => {
    expect(values('a / b / c').filter((v) => v === '/').length).toBe(2);
    expect(types('const r = /ab+/g;')).toContain('regex');
    expect(types('if (x) /re/.test(y);')).toContain('regex');
    expect(types('return /re/;')).toContain('regex');
    expect(values('a /= 2;').includes('/=')).toBe(true);
  });

  it('模板字符串整体作为一个 token (含 ${} 嵌套)', () => {
    const toks = tokenizeJs('const t = `a${b + `${c}`}d`;');
    const tpl = toks.filter((t) => t.type === 'template');
    expect(tpl.length).toBe(1);
    expect(tpl[0].value).toBe('`a${b + `${c}`}d`');
  });

  it('字符串 token 保留原始转义写法', () => {
    expect(values("const s = 'a\\'b\\u4e2d';").includes("'a\\'b\\u4e2d'")).toBe(true);
  });

  it('注释单独成 token 并记录前置换行数', () => {
    const comments = tokenizeJs('a; // one\n\n// two\nb;').filter((t) => t.type === 'comment');
    expect(comments.map((t) => t.value)).toEqual([ '// one', '// two' ]);
    expect(comments.map((t) => t.nl)).toEqual([ 0, 2 ]);
  });

  it('记录块的 ctrl / block 标记', () => {
    const toks = tokenizeJs('if (a) {} a = {b: 1}');
    const ctrl = toks.find((t) => t.value === ')' );
    expect(ctrl?.ctrl).toBe(true);
    const braces = toks.filter((t) => t.value === '}');
    expect(braces[0].block).toBe(true);
    expect(braces[1].block).toBeFalsy();
  });

  it('处理空输入与仅注释输入', () => {
    expect(tokenizeJs('')).toEqual([]);
    expect(types('// only')).toEqual([ 'comment' ]);
    expect(types('/* a */ /* b */')).toEqual([ 'comment', 'comment' ]);
  });

  it('significant / significantAt 过滤注释', () => {
    const toks = tokenizeJs('a /* c */ b');
    expect(significant(toks).map((t) => t.value)).toEqual([ 'a', 'b' ]);
    expect(significantAt(toks, 1, 1)?.value).toBe('b');
    expect(significantAt(toks, 1, -1)?.value).toBe('a');
  });
});

describe('ASI 自动分号保护', () => {
  /** 找出 code 中某个 token 并判定其前面的换行是否危险 */
  const hazardAt = (code: string, tokenValue: string): boolean => {
    const toks = tokenizeJs(code);
    const idx = toks.findIndex((t) => t.type !== 'comment' && t.value === tokenValue);
    expect(idx).toBeGreaterThanOrEqual(0);
    return asiHazard(significantAt(toks, idx - 1, -1), toks[idx]);
  };

  it('受限产生式 (return / continue)', () => {
    expect(hazardAt('function f(){\nreturn\n1\n}', '1')).toBe(true);
    expect(hazardAt('while(a){\ncontinue\nc()\n}', 'c')).toBe(true);
    expect(hazardAt('function f(){ return 1 }', '1')).toBe(false);
  });

  it('表达式结束后又出现新值 / 语句开头', () => {
    expect(hazardAt('a = b\n(c) = d', '(')).toBe(false);
    expect(hazardAt('a = b\n[1]', '[')).toBe(false);
    expect(hazardAt('a = b\n!c', '!')).toBe(true);
    expect(hazardAt('a = b\n`t`', '`t`')).toBe(true);
    expect(hazardAt('return\n/re/.test(c)', '/re/')).toBe(true);
    expect(hazardAt('a\n++b', '++')).toBe(true);
  });

  it('对象字面量的 } 之后是危险点, 块级 } 之后不是', () => {
    expect(hazardAt('a = {b:1}\nfoo()', 'foo')).toBe(true);
    expect(hazardAt('if(a){}\nfoo()', 'foo')).toBe(false);
  });

  it('exprEnd 判定运算符型关键字不算表达式结束', () => {
    const name = (v: string): JsToken => ({ type: 'name', value: v, nl: 0, start: 0, end: 0 });
    expect(exprEnd(name('return'))).toBe(false);
    expect(exprEnd(name('typeof'))).toBe(false);
    expect(exprEnd(name('foo'))).toBe(true);
    expect(exprEnd({ type: 'number', value: '1', nl: 0, start: 0, end: 0 })).toBe(true);
    expect(exprEnd({ type: 'punct', value: ';', nl: 0, start: 0, end: 0 })).toBe(false);
  });
});

describe('beautifyJs 代码美化', () => {
  it('缩进与换行', () => {
    expect(beautifyJs('function add(a,b){if(a>b){return a+b}else{return a-b}}')).toBe(
      'function add(a, b) {\n  if (a > b) {\n    return a + b\n  } else {\n    return a - b\n  }\n}\n',
    );
  });

  it('支持自定义缩进', () => {
    expect(beautifyJs('if(a){b}', { indent: '\t' })).toBe('if (a) {\n\tb\n}\n');
    expect(beautifyJs('if(a){b}', { indent: '    ' })).toBe('if (a) {\n    b\n}\n');
  });

  it('对象字面量每个属性独占一行', () => {
    expect(beautifyJs('const o={a:1,b:2};')).toBe('const o = {\n  a: 1,\n  b: 2\n};\n');
  });

  it('for 头部保持单行', () => {
    expect(beautifyJs('for(let i=0;i<3;i++){f(i)}')).toBe('for (let i = 0; i < 3; i++) {\n  f(i)\n}\n');
  });

  it('switch 的 case 体额外缩进', () => {
    expect(beautifyJs('switch(x){case 1:f();break;default:g()}')).toBe(
      'switch (x) {\n  case 1:\n    f();\n    break;\n  default:\n    g()\n}\n',
    );
  });

  it('关键字之间自动补空格', () => {
    expect(beautifyJs('async function m(){for await (const x of y){}}')).toContain('async function m()');
    expect(beautifyJs('class A extends B{m(){return this.x}}')).toContain('class A extends B {');
    expect(beautifyJs('const o={get p(){return 1}}')).toContain('get p()');
    expect(beautifyJs('x = {[k]:1}')).toContain('[k]: 1');
  });

  it('保留行尾注释与块注释', () => {
    expect(beautifyJs('a=1;/* c */b=2;')).toBe('a = 1; /* c */ b = 2;\n');
    expect(beautifyJs('a; // one\nb;')).toBe('a; // one\nb;\n');
    expect(beautifyJs('/* head */\nvar a = 1;')).toBe('/* head */ var a = 1;\n');
  });

  it('保留空行 (最多一个), blankLines=false 时删除', () => {
    expect(beautifyJs('a; // one\n\n\nb;')).toBe('a; // one\n\nb;\n');
    expect(beautifyJs('a; // one\n\n\nb;', { blankLines: false })).toBe('a; // one\nb;\n');
  });

  it('ASI 保护: return 换行不被合并', () => {
    expect(beautifyJs('function f(){\n  return\n  1\n}')).toBe('function f() {\n  return\n  1\n}\n');
  });

  it('空输入返回空串, 输出无行尾空格且以换行结尾', () => {
    expect(beautifyJs('')).toBe('');
    expect(beautifyJs('   \n  ')).toBe('');
    const out = beautifyJs('const a=1;   \n\n');
    expect(out).toBe('const a = 1;\n');
    expect(/[ \t]+\n/.test(out)).toBe(false);
  });
});

describe('minifyJs 代码压缩', () => {
  it('去掉注释与多余空白', () => {
    expect(minifyJs('a = 1; /* c */ b = 2;\n// tail\nc = 3')).toBe('a=1;b=2;c=3');
    expect(minifyJs('a=1;\n\n\n\nb=2;')).toBe('a=1;b=2;');
  });

  it('removeComments=false 保留注释 (行注释后强制换行)', () => {
    expect(minifyJs('a = 1; /* c */ b = 2;\n// tail\nc = 3', { removeComments: false }))
      .toBe('a=1;/* c */b=2;// tail\nc=3');
  });

  it('oneLine=false 保留原换行', () => {
    expect(minifyJs('a=1;\nb=2;', { oneLine: false })).toBe('a=1;\nb=2;');
    expect(minifyJs('a=1;\nb=2;')).toBe('a=1;b=2;');
  });

  it('ASI 保护: 需要换行的地方保留换行', () => {
    expect(minifyJs('function f(){\nreturn\n1\n}')).toBe('function f(){return\n1}');
    expect(minifyJs('a = {b:1}\nfoo()')).toBe('a={b:1}\nfoo()');
    expect(minifyJs('if(a){x=1}\ny=2')).toBe('if(a){x=1}y=2');
  });

  it('避免相邻 token 粘连', () => {
    expect(minifyJs('x = a + +b; y = a - -b; z = 1 .toString();')).toBe('x=a+ +b;y=a- -b;z=1 .toString();');
    expect(minifyJs('for (const k in obj) {}')).toBe('for(const k in obj){}');
    expect(minifyJs('typeof a === "number"')).toBe('typeof a==="number"');
  });

  it('needsSpace 判定规则', () => {
    const tok = (type: JsToken['type'], value: string): JsToken => ({ type, value, nl: 0, start: 0, end: 0 });
    expect(needsSpace('a', tok('name', 'b'))).toBe(true);
    expect(needsSpace('1', tok('punct', '.'))).toBe(true);
    expect(needsSpace('+', tok('punct', '+'))).toBe(true);
    expect(needsSpace('=', tok('punct', '='))).toBe(true);
    expect(needsSpace('(', tok('name', 'a'))).toBe(false);
    expect(needsSpace('a', tok('punct', ')'))).toBe(false);
  });
});

describe('jsSignature token 指纹', () => {
  it('忽略空白与注释', () => {
    expect(jsSignature('const x = 1; // c\nfunction f(){return x}'))
      .toBe(jsSignature('const x = 1;function f(){ return x }'));
  });

  it('token 变化时不同', () => {
    expect(jsSignature('const x = 1;')).not.toBe(jsSignature('const x = 2;'));
  });

  it('keepComments 时注释参与比较', () => {
    expect(jsSignature('a; // 1', true)).not.toBe(jsSignature('a;', true));
    expect(jsSignature('a; // 1')).toBe(jsSignature('a;'));
  });
});

describe('字符串字面量工具', () => {
  it('parseStringLiteral 解析各类转义', () => {
    expect(parseStringLiteral("'a\\u4e2d\\x41\\'b'")).toEqual({ value: "a\u4e2dA'b", end: 16 });
    expect(parseStringLiteral('"a\\n\\t"')).toEqual({ value: 'a\n\t', end: 7 });
    expect(parseStringLiteral("'\\u{1f600}'")?.value).toBe('\u{1f600}');
    expect(parseStringLiteral('123')).toBeNull();
    expect(parseStringLiteral("'unterminated")).toBeNull();
  });

  it('quoteJsString 做最小转义', () => {
    expect(quoteJsString("a'b")).toBe("'a\\'b'");
    expect(quoteJsString('a"b', '"')).toBe('"a\\"b"');
    expect(quoteJsString('a\\b\nc')).toBe("'a\\\\b\\nc'");
    expect(quoteJsString('\u4e2d\u6587')).toBe("'\u4e2d\u6587'");
  });

  it('matchBracket 跳过字符串与模板', () => {
    expect(matchBracket('f(a{', 1)).toBe(-1);
    expect(matchBracket('f({a:1}, b)', 1)).toBe(10);
    expect(matchBracket('f(`x${ y }z`)', 1)).toBe(12);
    expect(matchBracket('f("(", 2)', 1)).toBe(8);
  });

  it('extractCallArgs 拆分实参', () => {
    expect(extractCallArgs("f('a',b,(c),'d')", 1)).toEqual([ "'a'", 'b', '(c)', "'d'" ]);
    expect(extractCallArgs("f('a(b', 1)", 1)).toEqual([ "'a(b'", '1' ]);
    expect(extractCallArgs('x y', 0)).toBeNull();
  });
});

describe('字符串转义加密', () => {
  it('escape 模式逐字符转义为 \\xNN / \\uNNNN', () => {
    const out = escapeJsStrings("var s='ab中';", 'escape');
    expect(out).toBe("var s='\\x61\\x62\\u4e2d';");
  });

  it('unicode 模式只转义非 ASCII (保留换行等常用转义)', () => {
    expect(escapeJsStrings("var s='中文\\n';", 'unicode')).toBe("var s='\\u4e2d\\u6587\\n';");
    expect(escapeJsStrings("var s='ab';", 'unicode')).toBe("var s='ab';");
  });

  it('保留指令与模板字符串', () => {
    const out = escapeJsStrings("'use strict';\nvar s = `中文`;", 'unicode');
    expect(out).toContain("'use strict'");
    expect(out).toContain('`中文`');
  });

  it('decodeEscapes 会还原字符串内的转义 (含原有转义)', () => {
    const src = "var s='中文';var t='abc';";
    const enc = escapeJsStrings(src, 'escape');
    expect(enc).not.toBe(src);
    expect(decodeEscapes(enc)).toBe(src);
    // 原代码里已有的转义也会被还原 (解密场景的预期行为)
    expect(decodeEscapes("var s='a\\u4e2d';")).toBe("var s='a中';");
    expect(decodeEscapes('var s="中文";')).toBe('var s="中文";');
  });

  it('注释中的转义文本不参与还原', () => {
    const src = '// \\u4e2d\\u6587\nvar s = 1;';
    expect(decodeEscapes(src)).toBe(src);
  });
});

describe('packJs 词表打包', () => {
  it('输出形态为 eval(function(m,d){...}("payload"))', () => {
    const packed = packJs('var a = 1;');
    expect(packed.startsWith('eval(function(m,d){')).toBe(true);
    expect(packed).toContain('.split(\'|\')');
    expect(packed.slice(-3)).toBe("'))");
  });

  it('重复出现的词在词表里只计一次', () => {
    const packed = packJs('a = a + a;');
    const dict = /d='([^']*)'\.split/.exec(packed);
    expect(dict?.[1]).toBe('a');
    expect(packed).toContain("('0 = 0 + 0;'))");
  });

  it('非 ASCII 与引号会被转义, 打包结果是纯 ASCII', () => {
    const packed = packJs("var s = '中文\\n' + \"引号\";");
    // eslint-disable-next-line no-control-regex
    expect(/^[\x00-\x7f]*$/.test(packed)).toBe(true);
    expect(packed).toContain('\\u4e2d');
  });

  it('空输入不报错', () => {
    expect(packJs('')).toBe("eval(function(m,d){d=''.split('|');return m.replace(/\\d+/g,function(x){return d[+x]})}(''))");
  });
});

describe('unpackJs 解密还原', () => {
  it('还原本工具的打包结果', () => {
    const src = "function f(a){return a + 1}\nf('中文');";
    expect(unpackJs(packJs(src))).toEqual({ code: src, kinds: [ 'packer' ] });
  });

  it('逐层还原多次打包', () => {
    const src = 'var a = 1 + 2;';
    const once = packJs(src);
    const twice = packJs(once);
    const res = unpackJs(twice);
    expect(res.code).toBe(src);
    expect(res.kinds.filter((k) => k === 'packer').length).toBe(2);
  });

  it('还原经典 eval packer (Dean Edwards)', () => {
    const packed = "eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c])}}return p}('0 1(2){3.4(\"5 \" + 2);}1(\"6\");',36,7,'function|hello|name|console|log|hi|world'.split('|'),0,{}))";
    expect(unpackJs(packed)).toEqual({
      code: 'function hello(name){console.log("hi " + name);}hello("world");',
      kinds: [ 'classic-packer' ],
    });
  });

  it('还原经典 packer 的 unescape 变体', () => {
    const packed = "eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c])}}return p}('0(1);',2,2,'unescape|alert'.split('|'),0,{}))";
    expect(unpackJs(packed).kinds).toEqual([ 'classic-packer' ]);
    expect(unpackJs(packed).code).toBe('unescape(alert);');
  });

  it('还原 eval / new Function 字符串包裹', () => {
    expect(unpackJs("eval('var a = 1;')")).toEqual({ code: 'var a = 1;', kinds: [ 'eval' ] });
    expect(unpackJs('new Function("var a = 1;")')).toEqual({ code: 'var a = 1;', kinds: [ 'eval' ] });
    expect(unpackJs('window.eval(`var a = 1;`);').code).toBe('var a = 1;');
    expect(unpackJs("eval('var a = 1;' + more)").kinds).toEqual([]);
  });

  it('还原字符串转义', () => {
    expect(unpackJs("var s = '\\u4e2d\\u6587';")).toEqual({ code: "var s = '中文';", kinds: [ 'escape' ] });
  });

  it('无法识别时原样返回', () => {
    expect(unpackJs('var a = 1;\n')).toEqual({ code: 'var a = 1;\n', kinds: [] });
    expect(unpackJs('')).toEqual({ code: '', kinds: [] });
    expect(unpackJs('   ')).toEqual({ code: '   ', kinds: [] });
  });
});

/** 覆盖常见语法结构, 用于端到端回归 */
const SAMPLES = [
  'function add(a,b){if(a>b){return a+b}else{return a-b}}',
  'for(let i=0;i<3;i++){console.log(i)}',
  'const o={a:1,b:[1,2,{c:3}],d:function(){return 1}};',
  'switch(x){case 1:f();break;default:g()}',
  'try{a()}catch(e){console.error(e)}finally{b()}',
  'const f=(a,b)=>a+b;const g=async()=>{await h()};',
  'do{x++}while(x<10)',
  'a=b\n(c)\n',
  'function f(){\nreturn\n1\n}',
  'label: for(;;){break label}',
  'class A extends B{constructor(){super()}m(){return this.x}}',
  'var s=\'a\\\'b"c\'+"d";var r=/[a-z]+\\/*/g;var t=`x${1+2}y`;',
  'if(a)/re/.test(b);else c();',
  'x = a ? b : c; y = {k: v ? 1 : 2};',
  '!function(){console.log(1)}();',
  "(function(){'use strict';var a=1;return a})();",
  'obj.if = 1; obj.class = 2;',
  'async function main(){for await (const x of y){}}',
  'x?.y?.z ?? (a ?? b);',
  'new Foo(1,2).bar()',
  "x = {['a'+1]: 2, m(){}, get p(){return 1}};",
  'if (a) b(); else if (c) d(); else e();',
  'while(a-->0){if(b)break;else continue}',
  'function* gen(){yield 1;yield* other()}',
  'const re=/^1[3-9]\\d{9}$/gim; re.test(x);',
  'let n=1.5e3; let h=0xFF; let b=0b1010; let o=0o17;',
  'throw new Error("boom")',
  'const s="中文\'引号\\"与反斜杠\\\\n";',
];

const parses = (code: string): boolean => {
  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
    return true;
  } catch {
    return false;
  }
};

describe('端到端: 美化 / 压缩 / 打包 / 转义', () => {
  it('美化与压缩后仍是合法 JS, 且 token 指纹不变', () => {
    SAMPLES.forEach((src) => {
      const pretty = beautifyJs(src);
      const mini = minifyJs(src);
      expect([ src, parses(pretty) ]).toEqual([ src, true ]);
      expect([ src, parses(mini) ]).toEqual([ src, true ]);
      expect([ src, jsSignature(pretty) ]).toEqual([ src, jsSignature(src) ]);
      expect([ src, jsSignature(mini) ]).toEqual([ src, jsSignature(src) ]);
    });
  });

  it('打包混淆可无损还原', () => {
    SAMPLES.forEach((src) => {
      expect(unpackJs(packJs(src))).toEqual({ code: src, kinds: [ 'packer' ] });
    });
  });

  it('字符串转义可无损还原', () => {
    SAMPLES.forEach((src) => {
      ([ 'escape', 'unicode' ] as const).forEach((mode) => {
        const enc = escapeJsStrings(src, mode);
        const back = unpackJs(enc);
        if (enc === src) expect(back).toEqual({ code: src, kinds: [] });
        else {
          expect([ src, back.kinds ]).toEqual([ src, [ 'escape' ] ]);
          expect([ src, back.code ]).toEqual([ src, src.trim() ]);
        }
      });
    });
  });

  it('压缩后的代码仍然可以运行', () => {
    const src = 'function add(a, b) { return a + b; }\nwindow.__jsfmt = add(1, 2);';
    // eslint-disable-next-line no-new-func
    new Function(minifyJs(src))();
    expect((globalThis as unknown as { __jsfmt?: number }).__jsfmt).toBe(3);
    delete (globalThis as unknown as { __jsfmt?: number }).__jsfmt;
  });
});
