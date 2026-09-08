import {
  parsePathsTextToRoots, rootsToPaths, rootsToIndentedText,
  parseIndentedTextToRoots, rootsToJson, jsonToRoots, textToPathList,
} from './lib';
import type { PNode } from './lib';

const sortPaths = (a: string[]) => [...a].sort();

describe('路径 → 树', () => {
  test('合并共享前缀分支', () => {
    const roots = parsePathsTextToRoots([
      'src/components/App.tsx',
      'src/index.tsx',
      'docs/readme.md',
    ].join('\n'));
    expect(roots).toHaveLength(2);
    expect(roots[0].name).toBe('src');
    expect(roots[1].name).toBe('docs');
    expect(roots[0].children.map((c) => c.name)).toEqual(['components', 'index.tsx']);
  });
  test('Windows 反斜杠与 ./ 前缀兼容', () => {
    const roots = parsePathsTextToRoots('.\\src\\a.ts\n./lib/b.ts');
    expect(roots[0].children[0].path).toBe('src/a.ts');
    expect(roots[1].children[0].path).toBe('lib/b.ts');
  });
  test('空行 / 空白文本', () => {
    expect(parsePathsTextToRoots('')).toEqual([]);
    expect(parsePathsTextToRoots('  \n\n')).toEqual([]);
  });
  test('去重提取路径列表', () => {
    expect(textToPathList('a\nb\na', true)).toEqual(['a', 'b']);
    expect(textToPathList('a\nb\na', false)).toEqual(['a', 'b', 'a']);
  });
  test('树 → 缩进文本 / 全路径 (含目录节点)', () => {
    const roots = parsePathsTextToRoots('a/b/c\na/d\ne');
    expect(rootsToIndentedText(roots)).toBe('a\n  b\n    c\n  d\ne');
    expect(sortPaths(rootsToPaths(roots))).toEqual(['a', 'a/b', 'a/b/c', 'a/d', 'e']);
  });
});

describe('树 → 路径', () => {
  test('缩进树文本解析并回填完整路径', () => {
    const text = 'src\n  components\n    App.tsx\n    Button.tsx\n  index.tsx\ndocs\n  readme.md';
    const roots = parseIndentedTextToRoots(text);
    expect(roots).toHaveLength(2);
    expect(sortPaths(rootsToPaths(roots))).toEqual([
      'docs', 'docs/readme.md',
      'src', 'src/components', 'src/components/App.tsx', 'src/components/Button.tsx', 'src/index.tsx',
    ]);
  });
  test('兼容 ├── └── │ 目录树前缀', () => {
    const text = 'src\n├── components\n│   └── App.tsx\n└── index.tsx';
    const roots = parseIndentedTextToRoots(text);
    expect(sortPaths(rootsToPaths(roots))).toEqual([
      'src', 'src/components', 'src/components/App.tsx', 'src/index.tsx',
    ]);
  });
  test('tab 缩进识别', () => {
    const roots = parseIndentedTextToRoots('a\n\tb\n\t\tc');
    expect(sortPaths(rootsToPaths(roots))).toEqual(['a', 'a/b', 'a/b/c']);
  });
});

describe('JSON 树 ↔ 路径', () => {
  test('树 → JSON (叶子 null)', () => {
    const roots = parsePathsTextToRoots('src/components/App.tsx\nsrc/index.tsx');
    expect(rootsToJson(roots)).toEqual({
      src: { components: { 'App.tsx': null }, 'index.tsx': null },
    });
  });
  test('JSON → 树', () => {
    const roots = jsonToRoots('{"src":{"components":{"App.tsx":null},"index.tsx":null},"docs":null}');
    expect(rootsToJson(roots)).toEqual({
      src: { components: { 'App.tsx': null }, 'index.tsx': null },
      docs: null,
    });
    expect(sortPaths(rootsToPaths(roots))).toEqual(['docs', 'src', 'src/components', 'src/components/App.tsx', 'src/index.tsx']);
  });
  test('非法 JSON 抛错', () => {
    expect(() => jsonToRoots('{bad')).toThrow();
  });
});

const checkRoundTrip = (paths: string[], roots: PNode[]) => {
  const a = sortPaths(paths);
  const b = sortPaths(rootsToPaths(roots));
  for (const p of a) expect(b).toContain(p);
};
test('往返一致: 路径→树→路径包含全部原路径', () => {
  const input = ['lib/a.ts', 'lib/util/b.ts', 'tests/x.test.ts'];
  checkRoundTrip(input, parsePathsTextToRoots(input.join('\n')));
});
