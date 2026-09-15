import {
  isConsistent, isValidSolution, canPlace, cellMm, createRng, digHoles, emptyGrid, fill, generatePuzzles,
  generateSolution, gridSideMm, countSolutions, planPages, randomSeed, buildGridHtml, buildSheetHtml,
  buildSheetPages, normalizeDifficulty, normalizeMode, normalizePages, normalizeSize,
} from './lib';
import { BOX_SHAPE, PAGE_LAYOUT, PER_PAGE, TARGET_CLUES, type Difficulty, type GridSize } from './data';

const SIZES: GridSize[] = [4, 6, 9];
const DIFFS: Difficulty[] = [ 'hard', 'medium', 'easy' ];

const text = {
  size: '9 宫格',
  difficulty: '高',
  answer: '答案',
  question: '第 {n} 题',
  meta: '姓名: __',
  footer: '第 {a} / {b} 页 · {d}',
};

describe('sudoku lib / 随机数与网格', () => {
  test('createRng 同一种子产生同一序列, 且落在 [0,1)', () => {
    const a = createRng(20260915);
    const b = createRng(20260915);
    const seqA = [ a(), a(), a() ];
    const seqB = [ b(), b(), b() ];
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(createRng(1)()).not.toBe(seqA[0]);
  });

  test('randomSeed 是 32 位无符号整数', () => {
    for (let i = 0; i < 20; i++) {
      const s = randomSeed();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
    }
  });

  test('emptyGrid 生成全 0 方阵', () => {
    for (const size of SIZES) {
      const g = emptyGrid(size);
      expect(g).toHaveLength(size);
      expect(g.every((row) => row.length === size && row.every((v) => v === 0))).toBe(true);
    }
  });

  test('canPlace 拦截同行 / 同列 / 同宫冲突', () => {
    const g = emptyGrid(9);
    g[0][0] = 5;
    expect(canPlace(g, 9, 0, 8, 5)).toBe(false); // 同行
    expect(canPlace(g, 9, 8, 0, 5)).toBe(false); // 同列
    expect(canPlace(g, 9, 1, 1, 5)).toBe(false); // 同宫 (3×3)
    expect(canPlace(g, 9, 3, 3, 5)).toBe(true);  // 其他宫
  });

  test('6 宫格的宫是 2 行 3 列', () => {
    expect(BOX_SHAPE[6]).toEqual({ rows: 2, cols: 3 });
    const g = emptyGrid(6);
    g[0][0] = 3;
    expect(canPlace(g, 6, 1, 2, 3)).toBe(false); // 同一宫 (行 0-1, 列 0-2)
    expect(canPlace(g, 6, 2, 3, 3)).toBe(true);  // 下一宫 (行 2-3, 列 3-5)
  });
});

describe('sudoku lib / 生成与校验', () => {
  test('各规格都能生成合法完整解', () => {
    for (const size of SIZES) {
      const g = generateSolution(size, createRng(42 + size));
      expect(isValidSolution(g, size)).toBe(true);
    }
  });

  test('isValidSolution 拒绝非法解', () => {
    const g = generateSolution(9, createRng(7));
    const bad = g.map((row) => row.slice());
    bad[0][1] = bad[0][0];
    expect(isValidSolution(bad, 9)).toBe(false);
    const g4 = generateSolution(4, createRng(3));
    expect(isValidSolution(g4, 4)).toBe(true);
  });

  test('唯一解: 生成的题目解恰好一个', () => {
    for (const size of SIZES) {
      for (const d of DIFFS) {
        const [ p ] = generatePuzzles(size, d, 1, 1000 + size * 10 + d.length);
        expect(isConsistent(p.puzzle, size)).toBe(true);
        expect(countSolutions(p.puzzle, size, 3)).toBe(1);
      }
    }
  });

  test('题目是完整解的挖空 (题面与解一致, 且确有空格)', () => {
    for (const size of SIZES) {
      const [ p ] = generatePuzzles(size, 'medium', 1, 2026 + size);
      let holes = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (p.puzzle[r][c] === 0) holes++;
          else expect(p.puzzle[r][c]).toBe(p.solution[r][c]);
        }
      }
      expect(holes).toBeGreaterThan(0);
      expect(p.clues).toBe(size * size - holes);
      expect(isValidSolution(p.solution, size)).toBe(true);
    }
  });

  test('提示数随难度递减, 且不低于目标值', () => {
    const size: GridSize = 9;
    const easy = generatePuzzles(size, 'easy', 1, 555)[0];
    const medium = generatePuzzles(size, 'medium', 1, 555)[0];
    const hard = generatePuzzles(size, 'hard', 1, 555)[0];
    expect(easy.clues).toBeGreaterThan(medium.clues);
    expect(medium.clues).toBeGreaterThan(hard.clues);
    expect(hard.clues).toBeGreaterThanOrEqual(TARGET_CLUES[size].hard);
    expect(easy.clues).toBeLessThanOrEqual(TARGET_CLUES[size].easy);
  });

  test('digHoles 保留唯一解, 且不会再挖到 0 提示', () => {
    const rng = createRng(8888);
    const solution = generateSolution(9, rng);
    const { puzzle, clues } = digHoles(solution, 9, 30, rng);
    expect(countSolutions(puzzle, 9, 3)).toBe(1);
    expect(clues).toBeGreaterThanOrEqual(30);
    expect(clues).toBeLessThanOrEqual(81);
  });

  test('批量生成: 数量正确且互不相同', () => {
    const list = generatePuzzles(9, 'hard', 4, 999);
    expect(list).toHaveLength(4);
    const keys = new Set(list.map((p) => p.solution.map((r) => r.join('')).join('')));
    expect(keys.size).toBe(4);
    for (const p of list) expect(countSolutions(p.puzzle, 9, 3)).toBe(1);
  });

  test('同一种子可复现同一批题目', () => {
    const a = generatePuzzles(6, 'medium', 2, 4321);
    const b = generatePuzzles(6, 'medium', 2, 4321);
    expect(a.map((p) => p.puzzle)).toEqual(b.map((p) => p.puzzle));
  });
});

describe('sudoku lib / A4 版式', () => {
  test('宫格尺寸落在可用区域内且 < A4', () => {
    for (const size of SIZES) {
      const side = gridSideMm(size);
      expect(side).toBeGreaterThan(60);
      expect(side).toBeLessThanOrEqual(186); // 210 - 12 * 2
      expect(cellMm(size)).toBeCloseTo(side / size, 1);
    }
  });

  test('宫格越大占位越大, 单格约 20mm 上下, 且每页数量与排布一致', () => {
    expect(gridSideMm(4)).toBeLessThan(gridSideMm(6));
    expect(gridSideMm(6)).toBeLessThan(gridSideMm(9));
    expect(cellMm(4)).toBeGreaterThan(cellMm(6));
    for (const size of SIZES) {
      expect(cellMm(size)).toBeGreaterThan(18);
      expect(cellMm(size)).toBeLessThan(26);
      const l = PAGE_LAYOUT[size];
      expect(l.cols * l.rows).toBe(PER_PAGE[size]);
    }
  });

  test('planPages: 题目页在前, 答案页在后, 页码连续', () => {
    const puzzles = generatePuzzles(9, 'easy', 3, 77);
    const puzzleOnly = planPages({ size: 9, puzzles, mode: 'puzzle' });
    expect(puzzleOnly).toHaveLength(3);
    expect(puzzleOnly.every((p) => !p.showAnswer)).toBe(true);

    const both = planPages({ size: 9, puzzles, mode: 'both' });
    expect(both).toHaveLength(6);
    expect(both.map((p) => p.showAnswer)).toEqual([ false, false, false, true, true, true ]);
    expect(both.map((p) => p.index)).toEqual([ 1, 2, 3, 4, 5, 6 ]);

    const answers = planPages({ size: 9, puzzles, mode: 'answer' });
    expect(answers).toHaveLength(3);
    expect(answers.every((p) => p.showAnswer)).toBe(true);
  });

  test('4 宫每页 4 题 / 6 宫每页 2 题', () => {
    const p4 = generatePuzzles(4, 'medium', 4, 11);
    expect(planPages({ size: 4, puzzles: p4, mode: 'puzzle' })).toHaveLength(1);
    const p6 = generatePuzzles(6, 'medium', 5, 12);
    const plans6 = planPages({ size: 6, puzzles: p6, mode: 'puzzle' });
    expect(plans6).toHaveLength(3);
    expect(plans6.map((p) => p.puzzles.length)).toEqual([ 2, 2, 1 ]);
  });

  test('buildGridHtml: 提示数黑色, 答案红色, 空格无数字', () => {
    const [ p ] = generatePuzzles(4, 'easy', 1, 31337);
    const question = buildGridHtml(p, false);
    const answer = buildGridHtml(p, true);
    expect(question).toContain('<table class="sd-grid"');
    expect(question).not.toContain('sd-ans');
    expect(answer).toContain('sd-ans');
    const cells = (html: string) => (html.match(/<td /g) ?? []).length;
    expect(cells(question)).toBe(16);
    expect(cells(answer)).toBe(16);
    // 答案页数字个数 = 全部格子数 (题面 + 答案)
    const digits = (html: string) => (html.match(/<td[^>]*>(\d)<\/td>/g) ?? []).length;
    expect(digits(answer)).toBe(16);
    expect(digits(question)).toBe(p.clues);
  });

  test('buildSheetHtml: 页数正确, 含标题与页脚', () => {
    const puzzles = generatePuzzles(6, 'medium', 2, 246);
    const html = buildSheetHtml({
      size: 6, difficulty: 'medium', puzzles, mode: 'both', title: '数独练习', showMeta: true, date: '2026-09-15', text,
    });
    expect((html.match(/class="pg sd-pg"/g) ?? []).length).toBe(2); // 1 题目页 + 1 答案页
    expect(html).toContain('数独练习');
    expect(html).toContain('第 1 / 2 页 · 2026-09-15');
    expect(buildSheetPages({
      size: 6, difficulty: 'medium', puzzles, mode: 'puzzle', title: 't', showMeta: false, date: 'd', text,
    })).toHaveLength(1);
  });

  test('fill 替换全部同名占位', () => {
    expect(fill('第 {n} 题 ({n})', { n: 3 })).toBe('第 3 题 (3)');
    expect(fill('{a}/{b}', { a: 1, b: 2 })).toBe('1/2');
  });

  test('buildSheetHtml 空题目列表时无页面', () => {
    const html = buildSheetHtml({
      size: 9, difficulty: 'hard', puzzles: [], mode: 'both', title: 'x', showMeta: false, date: 'd', text,
    });
    expect(html).toBe('');
  });
});

describe('sudoku lib / 设置项归一化', () => {
  test('normalizeSize / normalizeDifficulty / normalizePages / normalizeMode', () => {
    expect(normalizeSize(4)).toBe(4);
    expect(normalizeSize('6')).toBe(9);   // 字符串不算合法
    expect(normalizeSize(5)).toBe(9);
    expect(normalizeSize(null)).toBe(9);

    expect(normalizeDifficulty('hard')).toBe('hard');
    expect(normalizeDifficulty('HARD')).toBe('medium');
    expect(normalizeDifficulty(undefined)).toBe('medium');

    expect(normalizePages(1)).toBe(1);
    expect(normalizePages(0)).toBe(1);
    expect(normalizePages(99)).toBe(20);
    expect(normalizePages(3.6)).toBe(4);
    expect(normalizePages('8')).toBe(8);
    expect(normalizePages('abc')).toBe(4);

    expect(normalizeMode('both')).toBe('both');
    expect(normalizeMode('puzzle')).toBe('puzzle');
    expect(normalizeMode('nope')).toBe('puzzle');
  });
});
