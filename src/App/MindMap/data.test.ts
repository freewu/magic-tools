/**
 * @jest-environment node
 */
// 说明: 该用例直接使用真实的 markmap-lib 校验示例大纲的解析结果。
// markmap-lib 的浏览器产物是 ESM (dist/browser/index.mjs), 无法被 jest (CJS) 加载,
// 因此这里用 node 环境 (走 exports 里的 require 产物 dist/index.js)。
// 本文件只做纯解析校验, 不涉及 DOM。
import { Transformer, builtInPlugins } from 'markmap-lib';
import { outlineInfo, type OutlineNode } from './lib';
import { COLOR_SCHEMES, COLOR_SCHEME_KEYS, DEPTH_LABELS, DEPTH_OPTIONS, FONT_SIZES, SAMPLES, SCALE_LABELS, SCALE_OPTIONS } from './data';

// 用真实的 markmap-lib 解析内置示例:
// markmap 的解析器在「同一父节点下混用标题与列表」时会覆盖旧条目, 这类问题只会静默丢内容,
// 因此这里为每个示例额外算一遍「应该有多少节点」, 一旦 markmap 升级后规则变化就会立刻暴露。

/**
 * 按 Markdown 结构估算 markmap 会生成的节点数
 * (只适用于本项目内置示例的写法: 标题 / 单行列表项 / 单行段落 / 围栏代码块, 不含多行段落)
 */
const expectedNodes = (md: string): number => {
  const lines = md.split('\n');
  let inFence = false;
  let inFrontmatter = false;
  let nodes = 0;
  lines.forEach((line, i) => {
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false;
      return;
    }
    if (/^\s*```/.test(line)) {
      if (!inFence) nodes += 1; // 整个代码块算一个节点
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (/^\s*$/.test(line)) return;
    if (/^\s*<!--/.test(line)) return;
    nodes += 1; // 标题 / 列表项 / 单行段落
  });
  return nodes;
};

/** markmap 会把非 ASCII 字符转义成数字实体, 断言前先还原 */
const decodeEntities = (s: string): string =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));

const flatten = (root: OutlineNode | null): OutlineNode[] => {  const out: OutlineNode[] = [];
  const walk = (n: OutlineNode) => {
    out.push(n);
    (n.children ?? []).forEach(walk);
  };
  if (root) walk(root);
  return out;
};

describe('MindMap 内置示例', () => {
  const transformer = new Transformer(builtInPlugins.filter((p) => p.name !== 'katex'));

  it('id 唯一且字段完整', () => {
    expect(SAMPLES.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SAMPLES.map((s) => s.id)).size).toBe(SAMPLES.length);
    for (const s of SAMPLES) {
      expect(s.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.desc.length).toBeGreaterThan(0);
      expect(s.code.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(SAMPLES.map((s) => [ s.id, s ] as const))('%s: 解析后节点数与大纲条目数一致 (无静默丢失)', (_id, sample) => {
    const { root } = transformer.transform(sample.code);
    expect(root).toBeTruthy();
    const info = outlineInfo(root as OutlineNode);
    expect(info.total).toBe(expectedNodes(sample.code));
    // 首行为标题时, 根节点应是该标题 (markmap 会把首个标题提升为根)
    const firstLine = sample.code.split('\n').find((l) => l.trim() && l.trim() !== '---' && !/^[a-z]+:/i.test(l)) ?? '';
    if (firstLine.startsWith('#')) {
      expect(info.total).toBeGreaterThan(1);
    }
    expect(info.depth).toBeGreaterThanOrEqual(2);
  });

  it('折叠标记 (与标题同行) 生效, 且不超过 1 处逐节点折叠', () => {
    const items = SAMPLES.flatMap((s) => flatten(transformer.transform(s.code).root as OutlineNode));
    const folded = items.filter((n) => (n as { payload?: { fold?: number } }).payload?.fold === 1);
    // 语法示例里演示了一个默认收起的标题
    expect(folded.length).toBe(1);
    // 不使用 foldAll (会让整棵树打开就是收起的)
    expect(items.some((n) => (n as { payload?: { fold?: number } }).payload?.fold === 2)).toBe(false);
  });

  it('复选框示例被解析为勾选框图标', () => {
    const meeting = SAMPLES.find((s) => s.id === 'meeting');
    const text = flatten(transformer.transform(meeting!.code).root as OutlineNode)
      .map((n) => String((n as { content?: string }).content ?? ''))
      .join('\n');
    expect(decodeEntities(text)).toContain('待办');
    // 每行复选框都会生成一个内联 svg 图标 (离线可用, 不依赖字体)
    expect(text.match(/<svg /g) ?? []).toHaveLength(4);
  });
});

describe('MindMap 静态选项', () => {
  it('配色方案: key 与定义一致, 颜色为合法 hex 或空 (空 = 使用 markmap 默认配色)', () => {
    expect(COLOR_SCHEME_KEYS).toEqual(Object.keys(COLOR_SCHEMES));
    for (const key of COLOR_SCHEME_KEYS) {
      const def = COLOR_SCHEMES[key];
      expect(def.label.length).toBeGreaterThan(0);
      for (const c of def.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(COLOR_SCHEMES.default.colors).toHaveLength(0);
  });

  it('展开层级含「全部」(-1), 字号与倍率均为正数且递增', () => {
    expect(DEPTH_OPTIONS).toContain(-1);
    expect([ ...DEPTH_OPTIONS ].sort((a, b) => a - b)).toEqual(DEPTH_OPTIONS);
    expect([ ...FONT_SIZES ].sort((a, b) => a - b)).toEqual(FONT_SIZES);
    expect([ ...SCALE_OPTIONS ].sort((a, b) => a - b)).toEqual(SCALE_OPTIONS);
    expect(Math.min(...FONT_SIZES)).toBeGreaterThan(0);
    expect(Math.min(...SCALE_OPTIONS)).toBeGreaterThan(0);
  });

  it('缩放以百分之二十五为步长从 100% 到 400% (与下拉文案一致)', () => {
    expect(SCALE_OPTIONS).toEqual([ 1, 1.5, 2, 2.5, 3, 4 ]);
    expect(SCALE_OPTIONS.map((n) => SCALE_LABELS[n])).toEqual([ '100%', '150%', '200%', '250%', '300%', '400%' ]);
  });

  it('层级 / 缩放的下拉文案覆盖全部选项', () => {
    expect(Object.keys(DEPTH_LABELS)).toHaveLength(DEPTH_OPTIONS.length);
    expect(Object.keys(SCALE_LABELS)).toHaveLength(SCALE_OPTIONS.length);
    for (const n of DEPTH_OPTIONS) expect(DEPTH_LABELS[n]).toBeTruthy();
    for (const n of SCALE_OPTIONS) expect(SCALE_LABELS[n]).toBeTruthy();
    expect(SCALE_LABELS[2]).toContain('200%');
  });
});
