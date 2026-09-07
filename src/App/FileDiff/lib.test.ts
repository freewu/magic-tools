import { diffText, decodeText, splitLines, lineDiff, MAX_LINES } from './lib';

describe('文本解码 decodeText', () => {
  it('UTF-8 文本正确解码', () => {
    const s = '你好 world\n第二行';
    const buf = new TextEncoder().encode(s).buffer;
    expect(decodeText(buf)).toBe(s);
  });

  it('非 UTF-8 (GBK) 内容走 GBK 分支不乱码', () => {
    // '中文GBK' -> GBK 字节 (0xD6D0 0xCEC4)
    const gbk = new Uint8Array([0xd6, 0xd0, 0xce, 0xc4]);
    expect(decodeText(gbk.buffer as ArrayBuffer)).toBe('中文');
  });

  it('splitLines 统一 \\r\\n 与 \\r', () => {
    expect(splitLines('a\r\nb\rc')).toEqual(['a', 'b', 'c']);
    expect(splitLines('a\nb\n')).toEqual(['a', 'b', '']);
  });
});

describe('行级 diff lineDiff / diffText', () => {
  it('完全相同文本 -> 全部 same 行, 无增删', () => {
    const r = diffText('a\nb\nc', 'a\nb\nc');
    expect(r.rows).toHaveLength(3);
    expect(r.rows.every((x) => x.a && x.b && x.a.kind === 'same')).toBe(true);
    expect(r.delCount).toBe(0);
    expect(r.insCount).toBe(0);
  });

  it('删除中间一行', () => {
    const r = diffText('a\nb\nc', 'a\nc');
    const kinds = r.rows.map((x) => (x.a && x.b ? 'same' : x.a ? 'del' : 'ins'));
    expect(kinds).toEqual(['same', 'del', 'same']);
    expect(r.delCount).toBe(1);
    expect(r.insCount).toBe(0);
    // 删行左侧为 b, 右侧空
    const delRow = r.rows[1];
    expect(delRow.a?.text).toBe('b');
    expect(delRow.a?.n).toBe(2);
    expect(delRow.b).toBeUndefined();
  });

  it('新增一行', () => {
    const r = diffText('a\nc', 'a\nb\nc');
    const kinds = r.rows.map((x) => (x.a && x.b ? 'same' : x.a ? 'del' : 'ins'));
    expect(kinds).toEqual(['same', 'ins', 'same']);
    expect(r.rows[1].b?.text).toBe('b');
    expect(r.rows[1].a).toBeUndefined();
  });

  it('修改中间行 = 删除+新增相邻', () => {
    const r = diffText('a\nOLD\nc', 'a\nNEW\nc');
    const mids = r.rows.slice(1, 3);
    expect(mids[0].a?.text).toBe('OLD');
    expect(mids[0].a?.kind).toBe('del');
    expect(mids[1].b?.text).toBe('NEW');
    expect(mids[1].b?.kind).toBe('ins');
  });

  it('多行块移动不匹配 (简单 LCS 语义)', () => {
    const r = diffText('1\n2\n3', '3\n1\n2');
    // 按 LCS: 最长公共 '1','2' (或 '3'), 至少有一处变化
    expect(r.delCount + r.insCount).toBeGreaterThanOrEqual(2);
    // 每行最终成对一致 (两端行号自洽): 左行号与右行号各自单调递增
    const aNums = r.rows.filter((x) => x.a).map((x) => x.a!.n);
    const bNums = r.rows.filter((x) => x.b).map((x) => x.b!.n);
    expect(aNums).toEqual([...aNums].sort((p, q) => p - q));
    expect(bNums).toEqual([...bNums].sort((p, q) => p - q));
    // 行内容无丢失: 左侧文本集 = 原文 A, 右侧 = 原文 B
    const aTexts = r.rows.filter((x) => x.a).map((x) => x.a!.text);
    const bTexts = r.rows.filter((x) => x.b).map((x) => x.b!.text);
    expect(aTexts).toEqual(['1', '2', '3']);
    expect(bTexts).toEqual(['3', '1', '2']);
  });

  it('空文本与空行边界', () => {
    const r = diffText('', 'x');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].b?.text).toBe('x');
    expect(r.insCount).toBe(1);

    const r2 = diffText('x\n', 'x');
    expect(r2.delCount + r2.insCount).toBe(1); // 尾部空行差异
  });

  it('超过 MAX_LINES 截断并标记 truncated', () => {
    const big = Array.from({ length: MAX_LINES + 100 }, (_, i) => `line${i}`);
    const r = lineDiff(big, big.slice(0, MAX_LINES));
    expect(r.truncated).toBe(true);
    // 截断后仍可正常比较 (不抛错)
    expect(r.delCount).toBe(0);
  });

  it('大量相同行性能/内存不爆炸', () => {
    const a = Array.from({ length: 3000 }, (_, i) => `row${i}`);
    const b = a.slice();
    b[1500] = 'changed';
    const r = lineDiff(a, b);
    expect(r.delCount + r.insCount).toBe(2);
  });
});
