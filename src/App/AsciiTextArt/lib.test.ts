import { renderFiglet, GLYPHS, GLYPH_ROWS, GLYPH_W, SPACE_W } from './lib';

const rowsOf = (s: string) => s.split('\n');
// 字形表中的空心 '.' 渲染后为空格 (像素字符为 # 且未放大时)
const renderGlyph = (g: string[]) => g.map((r) => r.replace(/\./g, ' '));

describe('ASCII 文字', () => {
  it('字形表覆盖 A-Z 与 0-9, 且结构完整 (5 行 × 等宽)', () => {
    for (let c = 65; c <= 90; c++) expect(GLYPHS[String.fromCharCode(c)]).toBeTruthy();
    for (let c = 48; c <= 57; c++) expect(GLYPHS[String.fromCharCode(c)]).toBeTruthy();
    for (const key of Object.keys(GLYPHS)) {
      expect(GLYPHS[key].length).toBe(GLYPH_ROWS);
      for (const row of GLYPHS[key]) expect(row.length).toBe(GLYPH_W);
    }
  });

  it('renderFiglet: 单字母默认像素 #', () => {
    const rows = rowsOf(renderFiglet('A', { scale: 1, spacing: 0 }));
    expect(rows).toEqual(renderGlyph(GLYPHS.A));
    expect(rows[0]).toBe(' ### ');
    expect(rows[3]).toBe('#####');
  });

  it('renderFiglet: 大写化 (小写字母映射到大写字形)', () => {
    const rows = rowsOf(renderFiglet('a', { scale: 1, spacing: 0 }));
    expect(rows[0]).toBe(' ### ');
    expect(rowsOf(renderFiglet('A', { scale: 1, spacing: 0 }))).toEqual(rows);
  });

  it('renderFiglet: 多字母横向拼接 + 字符间距', () => {
    const noGap = rowsOf(renderFiglet('AB', { scale: 1, spacing: 0 }));
    expect(noGap[0]).toBe(' ### #### '); // A 行0 ' ### ' + B 行0 '#### ' 直接拼接
    expect(noGap[0].length).toBe(GLYPH_W * 2);
    const gap1 = rowsOf(renderFiglet('AB', { scale: 1, spacing: 1 }));
    expect(gap1[0]).toBe(' ###  #### '); // 中间多 1 个字符间距列
    for (const r of gap1) expect(r.length).toBe(gap1[0].length);
  });

  it('renderFiglet: 空格字形宽 3 列', () => {
    const rows = rowsOf(renderFiglet('A B', { scale: 1, spacing: 0 }));
    expect(rows[0]).toBe(' ###    #### '); // 1(首空)+3(#)+1(A尾)+3(空格字形)+4(#)+1(尾空)
    expect(rows[0].length).toBe(GLYPH_W + SPACE_W + GLYPH_W);
  });

  it('renderFiglet: 放大 scale=2 行数翻倍且行列扩展', () => {
    const rows = rowsOf(renderFiglet('A', { scale: 2, spacing: 0 }));
    expect(rows.length).toBe(GLYPH_ROWS * 2);
    expect(rows[0]).toBe('  ######  ');  // '.###.' 逐像素 2x
    expect(rows[0].length).toBe(GLYPH_W * 2);
    expect(rows[1]).toBe(rows[0]);       // 纵向重复
    expect(rows[4]).toBe(rows[5]);       // 第 3 字形行展开后上下两行相同
  });

  it('renderFiglet: 自定义像素字符', () => {
    const rows = rowsOf(renderFiglet('A', { scale: 1, spacing: 0, pixel: '█' }));
    expect(rows[0]).toBe(' ███ ');
    expect(rows[1]).toBe('█   █');
  });

  it('renderFiglet: 未知字符回退为 ?', () => {
    const rows = rowsOf(renderFiglet('€', { scale: 1, spacing: 0 }));
    expect(rows).toEqual(renderGlyph(GLYPHS['?']));
  });

  it('renderFiglet: 数字字形', () => {
    const rows = rowsOf(renderFiglet('9', { scale: 1, spacing: 0 }));
    expect(rows).toEqual(renderGlyph(GLYPHS['9']));
    expect(rows[0]).toBe(' ### ');
  });

  it('renderFiglet: 多行输入段落间以空行分隔', () => {
    const rows = rowsOf(renderFiglet('A\nB', { scale: 1, spacing: 0 }));
    expect(rows.length).toBe(GLYPH_ROWS * 2 + 1);
    expect(rows[5]).toBe('');           // 段落间空行
    expect(rows[6]).toBe('#### ');      // B 行0 '####.' 渲染后尾空保留
  });

  it('renderFiglet: 空输入返回空串', () => {
    expect(renderFiglet('', {})).toBe('');
    expect(renderFiglet('   ', { scale: 1, spacing: 0 })).not.toBe('');
  });
});
