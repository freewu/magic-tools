import {
  toGray, adjustGray, grayToChar, renderAscii,
  STD_CHARS, GRAY_PALETTES, ROW_SCALE,
} from './lib';

const allBlack = (w: number, h: number) => new Uint8Array(w * h);
const allWhite = (w: number, h: number) => new Uint8Array(w * h).fill(255);

describe('ASCII 图片', () => {
  it('toGray: 黑/白/灰与加权公式 (Rec.709 系数和=1)', () => {
    expect(toGray(0, 0, 0)).toBe(0);
    expect(toGray(255, 255, 255)).toBe(255);
    expect(toGray(255, 0, 0)).toBe(54);   // 0.2126*255
    expect(toGray(0, 255, 0)).toBe(182);  // 0.7152*255
    expect(toGray(0, 0, 255)).toBe(18);   // 0.0722*255
  });

  it('adjustGray: 默认恒等 (0/255 不变)', () => {
    expect(adjustGray(0)).toBe(0);
    expect(adjustGray(255)).toBe(255);
    expect(adjustGray(128)).toBe(128);
  });

  it('adjustGray: 反色/亮度/对比度与钳位', () => {
    expect(adjustGray(0, 0, 0, true)).toBe(255);
    expect(adjustGray(255, 0, 0, true)).toBe(0);
    expect(adjustGray(255, 1)).toBe(255);       // 亮度拉满
    expect(adjustGray(0, -1)).toBe(0);
    expect(adjustGray(1, 0, 1)).toBeLessThan(1);     // 提高对比度: 近黑压向 0
    expect(adjustGray(254, 0, 1)).toBeGreaterThan(254); // 近白推向 255
    expect(adjustGray(1, 0, 1)).toBe(0);
    expect(adjustGray(254, 0, 1)).toBe(255);
  });

  it('grayToChar: 标准字符集暗->亮映射', () => {
    expect(grayToChar(0, STD_CHARS)).toBe('@');
    expect(grayToChar(255, STD_CHARS)).toBe(' ');
    expect(grayToChar(255, STD_CHARS)).toBe(STD_CHARS[STD_CHARS.length - 1]);
    // 63: 63*9/255=2.22 -> round 2 -> '#'
    expect(grayToChar(63, STD_CHARS)).toBe('#');
    expect(STD_CHARS).toBe('@%#*+=-:. ');
    expect(STD_CHARS.length).toBe(10);
  });

  it('grayToChar: Unicode 密度块与单字符/空集边界', () => {
    const block = '█▓▒░ ';
    expect(grayToChar(0, block)).toBe('█');
    expect(grayToChar(255, block)).toBe(' ');
    expect(grayToChar(0, 'x')).toBe('x');   // 单字符集恒等
    expect(grayToChar(200, 'x')).toBe('x');
    expect(grayToChar(0, '')).toBe(' ');    // 空集回退空格
  });

  it('renderAscii: 全黑/全白图像', () => {
    const black = renderAscii({ gray: allBlack(4, 4), srcW: 4, srcH: 4, outW: 4 });
    expect(black).toBe('@@@@\n@@@@'); // outH = round(4*(4/4)*0.5)=2
    const white = renderAscii({ gray: allWhite(4, 4), srcW: 4, srcH: 4, outW: 4 });
    expect(white).toBe('    \n    ');
  });

  it('renderAscii: 左右明暗 -> 对应字符 (含尾部空格保留)', () => {
    // 4x2: 左半黑右半白 -> outW=4, outH=round(4*(2/4)*0.5)=1 => '@@  '
    const gray = new Uint8Array(8); // 全 0
    gray.fill(255, 2, 4);           // 第 0 行右半白
    gray.fill(255, 6, 8);           // 第 1 行右半白
    const out = renderAscii({ gray, srcW: 4, srcH: 2, outW: 4 });
    expect(out).toBe('@@  ');
    expect(out.length).toBe(4);
  });

  it('renderAscii: 行数随 rowScale 与宽高比折算', () => {
    const g = allBlack(8, 8);
    const a = renderAscii({ gray: g, srcW: 8, srcH: 8, outW: 8 });
    expect(a.split('\n').length).toBe(Math.round(8 * 0.5)); // 4 行
    const b = renderAscii({ gray: g, srcW: 8, srcH: 8, outW: 8, rowScale: 1 });
    expect(b.split('\n').length).toBe(8);
    // 全景: 32 行 x 宽比例
    const pano = renderAscii({ gray: allBlack(100, 40), srcW: 100, srcH: 40, outW: 200 });
    expect(pano.split('\n').length).toBe(Math.round(200 * (40 / 100) * ROW_SCALE)); // 40
  });

  it('renderAscii: 输出行宽恒定且用自定义字符集', () => {
    const gray = allWhite(10, 10);
    const out = renderAscii({ gray, srcW: 10, srcH: 10, outW: 20, chars: '█ ' });
    const rows = out.split('\n');
    for (const r of rows) expect(r.length).toBe(20);
    expect(rows[0]).toBe(' '.repeat(20)); // 全白 -> 最亮字符 ' '
  });

  it('renderAscii: 反色作用于结果', () => {
    const gray = allBlack(4, 4);
    expect(renderAscii({ gray, srcW: 4, srcH: 4, outW: 4, invert: true })).toBe('    \n    ');
  });

  it('GRAY_PALETTES 结构完整', () => {
    expect(GRAY_PALETTES.length).toBe(3);
    for (const p of GRAY_PALETTES) {
      expect(p.chars.length).toBeGreaterThan(1);
      expect(p.label.length).toBeGreaterThan(0);
    }
  });
});
