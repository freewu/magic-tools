// 数独生成器: 题目生成 (随机回溯 + 唯一解挖空) / A4 版式计算 / 打印页面构建
import { A4_MM, PRINT_BASE_CSS } from '../../lib/print';
import {
  BOX_LINE_MM, BOX_SHAPE, CAPTION_MM, CELL_LINE_MM, GRID_GAP_MM, KEY_DIFFICULTY, KEY_MODE, KEY_PAGES, KEY_SIZE,
  LINE_COLOR, PAGE_LAYOUT, PER_PAGE, TARGET_CLUES,
  type Difficulty, type GridSize, type PrintMode,
} from './data';

// ==================== 随机数 ====================

/** mulberry32 伪随机数生成器: 同一种子 -> 同一套题目, 便于复现与测试 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 新种子 (每次「重新生成」用) */
export const randomSeed = (): number => Math.floor(Math.random() * 0xffffffff) >>> 0;

// ==================== 网格基础 ====================

export type Grid = number[][];

export function emptyGrid(size: GridSize): Grid {
  return Array.from({ length: size }, () => new Array<number>(size).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

/** 1..size 的洗牌数组 */
export function shuffledValues(size: GridSize, rng: () => number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** (r, c) 放 v 是否合法: 同行 / 同列 / 同宫都不重复 */
export function canPlace(grid: Grid, size: GridSize, r: number, c: number, v: number): boolean {
  for (let i = 0; i < size; i++) {
    if (grid[r][i] === v || grid[i][c] === v) return false;
  }
  const { rows: br, cols: bc } = BOX_SHAPE[size];
  const r0 = Math.floor(r / br) * br;
  const c0 = Math.floor(c / bc) * bc;
  for (let i = 0; i < br; i++) {
    for (let j = 0; j < bc; j++) {
      if (grid[r0 + i][c0 + j] === v) return false;
    }
  }
  return true;
}

/** 完整解校验: 每行 / 每列 / 每宫都是 1..size 的一个排列 */
export function isValidSolution(grid: Grid, size: GridSize): boolean {
  const want = Array.from({ length: size }, (_, i) => i + 1).join(',');
  for (const row of grid) {
    if (row.slice().sort((a, b) => a - b).join(',') !== want) return false;
  }
  for (let c = 0; c < size; c++) {
    if (grid.map((row) => row[c]).sort((a, b) => a - b).join(',') !== want) return false;
  }
  const { rows: br, cols: bc } = BOX_SHAPE[size];
  for (let r0 = 0; r0 < size; r0 += br) {
    for (let c0 = 0; c0 < size; c0 += bc) {
      const box: number[] = [];
      for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) box.push(grid[r0 + i][c0 + j]);
      if (box.sort((a, b) => a - b).join(',') !== want) return false;
    }
  }
  return true;
}

/** 解是否合法 (忽略空格, 只校验已填数字不冲突) */
export function isConsistent(grid: Grid, size: GridSize): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      grid[r][c] = 0;
      const ok = canPlace(grid, size, r, c, v);
      grid[r][c] = v;
      if (!ok) return false;
    }
  }
  return true;
}

// ==================== 生成 ====================

/** 随机回溯生成一个完整解 */
export function generateSolution(size: GridSize, rng: () => number): Grid {
  const grid = emptyGrid(size);
  const fill = (): boolean => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0) continue;
        for (const v of shuffledValues(size, rng)) {
          if (!canPlace(grid, size, r, c, v)) continue;
          grid[r][c] = v;
          if (fill()) return true;
          grid[r][c] = 0;
        }
        return false; // 1..size 都放不下 -> 回溯
      }
    }
    return true;
  };
  fill();
  return grid;
}

/** 解的个数 (最多数到 limit 个即返回, 用于唯一解判定) */
export function countSolutions(grid: Grid, size: GridSize, limit = 2): number {
  const g = cloneGrid(grid);
  let found = 0;
  const walk = (): boolean => { // 返回 true = 已达 limit, 提前结束
    let r = -1;
    let c = -1;
    for (let i = 0; i < size && r < 0; i++) {
      for (let j = 0; j < size; j++) {
        if (g[i][j] === 0) { r = i; c = j; break; }
      }
    }
    if (r < 0) { found++; return found >= limit; }
    for (let v = 1; v <= size; v++) {
      if (!canPlace(g, size, r, c, v)) continue;
      g[r][c] = v;
      const stop = walk();
      g[r][c] = 0;
      if (stop) return true;
    }
    return false;
  };
  walk();
  return found;
}

/** 全部格子坐标 (洗牌后) */
function shuffledCells(size: GridSize, rng: () => number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

/**
 * 挖空: 从完整解出发逐格尝试挖去 (优先中心对称成对挖, 版面更美观),
 * 每次挖空后校验仍是唯一解才保留; 提示数降到 target 即停止。
 */
export function digHoles(
  solution: Grid,
  size: GridSize,
  target: number,
  rng: () => number
): { puzzle: Grid; clues: number } {
  const puzzle = cloneGrid(solution);
  let clues = size * size;
  for (const [r, c] of shuffledCells(size, rng)) {
    if (clues <= target) break;
    if (puzzle[r][c] === 0) continue;
    const sr = size - 1 - r;
    const sc = size - 1 - c;
    const pair = (sr !== r || sc !== c) && puzzle[sr][sc] !== 0 && clues - 2 >= target;
    const backup: Array<[number, number, number]> = [[r, c, puzzle[r][c]]];
    puzzle[r][c] = 0;
    if (pair) {
      backup.push([sr, sc, puzzle[sr][sc]]);
      puzzle[sr][sc] = 0;
    }
    if (countSolutions(puzzle, size, 2) === 1) {
      clues -= backup.length;
      continue;
    }
    for (const [br, bc, bv] of backup) puzzle[br][bc] = bv; // 破坏唯一解 -> 回滚
  }
  return { puzzle, clues };
}

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
  clues: number;
  size: GridSize;
  difficulty: Difficulty;
}

/** 连续生成 count 道题 (同一 rng 序列, 并去重) */
export function generatePuzzles(
  size: GridSize,
  difficulty: Difficulty,
  count: number,
  seed: number
): Puzzle[] {
  const rng = createRng(seed);
  const out: Puzzle[] = [];
  const seen = new Set<string>();
  const guardMax = count * 30 + 60;
  for (let guard = 0; out.length < count && guard < guardMax; guard++) {
    const solution = generateSolution(size, rng);
    const key = solution.map((row) => row.join('')).join('');
    if (seen.has(key)) continue;
    seen.add(key);
    const { puzzle, clues } = digHoles(solution, size, TARGET_CLUES[size][difficulty], rng);
    out.push({ puzzle, solution, clues, size, difficulty });
  }
  return out;
}

// ==================== 版式 (mm) ====================

/** 单页内宫格之间的安全余量 (mm): 表格边框合并 (border-collapse) 时会多出约 1mm 宽度 */
export const WIDTH_SAFE_MM = 1.5;

/** 单个宫格边长 (mm): 由页面可用宽高与每页行列数均分, 取整到 0.5mm */
export function gridSideMm(size: GridSize): number {
  const { cols, rows } = PAGE_LAYOUT[size];
  const usableW = A4_MM.width - A4_MM.margin * 2;
  const usableH = A4_MM.height - A4_MM.margin * 2;
  const byW = (usableW - GRID_GAP_MM * (cols - 1)) / cols - WIDTH_SAFE_MM;
  const byH = (usableH - (CAPTION_MM + GRID_GAP_MM) * (rows - 1)) / rows - CAPTION_MM;
  return Math.floor(Math.min(byW, byH) * 2) / 2;
}

/** 单格边长 (mm) */
export function cellMm(size: GridSize): number {
  return Math.round((gridSideMm(size) / size) * 100) / 100;
}

// ==================== 打印页面 ====================

/** 打印文案 (由页面按当前语言组装, 使 lib 与语言包解耦, 便于单测) */
export interface SheetText {
  /** 题型名, 如「9 宫格」 */
  size: string;
  /** 难度名, 如「高」 */
  difficulty: string;
  /** 「答案」 */
  answer: string;
  /** 题号标题模板, 如「第 {n} 题」 */
  question: string;
  /** 姓名 / 日期栏 */
  meta: string;
  /** 页脚模板, 如「第 {a} / {b} 页 · {d}」 */
  footer: string;
}

export interface SheetOptions {
  size: GridSize;
  difficulty: Difficulty;
  puzzles: Puzzle[];
  mode: PrintMode;
  title: string;
  showMeta: boolean;
  /** 打印日期 (yyyy-MM-dd), 由页面传入 */
  date: string;
  text: SheetText;
}

/** 模板变量填充: {n} / {k} 形式 */
export function fill(tpl: string, vars: Record<string, string | number>): string {
  let s = tpl;
  for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(String(v));
  return s;
}

export interface PagePlan {
  /** 页码 (1 起) */
  index: number;
  puzzles: Puzzle[];
  /** 该页是否打印答案 (隐藏格用红色) */
  showAnswer: boolean;
}

/** 把题目切成打印页: 题目页在前, 答案页在后 */
export function planPages(o: Pick<SheetOptions, 'size' | 'puzzles' | 'mode'>): PagePlan[] {
  const per = PER_PAGE[o.size];
  const plans: PagePlan[] = [];
  const push = (showAnswer: boolean) => {
    for (let i = 0; i < o.puzzles.length; i += per) {
      plans.push({ index: 0, puzzles: o.puzzles.slice(i, i + per), showAnswer });
    }
  };
  if (o.mode !== 'answer') push(false);
  if (o.mode !== 'puzzle') push(true);
  return plans.map((p, i) => ({ ...p, index: i + 1 }));
}

/** 单个宫格 HTML: 题面数字黑色, 答案 (原空格) 红色 */
export function buildGridHtml(p: Puzzle, showAnswer: boolean): string {
  const { size } = p;
  const { rows: br, cols: bc } = BOX_SHAPE[size];
  const side = gridSideMm(size);
  const cell = side / size;
  const pt = (mm: number) => `${mm}mm`;
  const cellStyle = (r: number, c: number): string => {
    const top = r % br === 0 ? BOX_LINE_MM : CELL_LINE_MM;
    const left = c % bc === 0 ? BOX_LINE_MM : CELL_LINE_MM;
    const parts = [
      `width:${pt(cell)}`,
      `height:${pt(cell)}`,
      `border-top:${pt(top)} solid ${LINE_COLOR}`,
      `border-left:${pt(left)} solid ${LINE_COLOR}`,
      `font-size:${(cell * 0.58).toFixed(2)}mm`,
    ];
    if (c === size - 1) parts.push(`border-right:${pt(BOX_LINE_MM)} solid ${LINE_COLOR}`);
    if (r === size - 1) parts.push(`border-bottom:${pt(BOX_LINE_MM)} solid ${LINE_COLOR}`);
    return parts.join(';');
  };
  const rows = p.puzzle.map((row, r) => {
    const cells = row.map((v, c) => {
      const answer = v === 0 && showAnswer;
      const text = v !== 0 ? String(v) : answer ? String(p.solution[r][c]) : '';
      return `<td class="sd-c${answer ? ' sd-ans' : ''}" style="${cellStyle(r, c)}">${text}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table class="sd-grid" style="width:${pt(side)}">${rows}</table>`;
}

/** 一页 HTML (一个 `.pg`) */
export function buildPageHtml(o: SheetOptions, plan: PagePlan, total: number): string {
  const layout = PAGE_LAYOUT[o.size];
  const T = o.text;
  const sub = `${T.size} · ${T.difficulty}${plan.showAnswer ? ' · ' + T.answer : ''}`;
  const items = plan.puzzles.map((p) => {
    const no = o.puzzles.indexOf(p) + 1;
    const cap = fill(T.question, { n: no }) + (plan.showAnswer ? ' · ' + T.answer : '');
    return `<div class="sd-item"><div class="sd-cap">${cap}</div>${buildGridHtml(p, plan.showAnswer)}</div>`;
  }).join('');
  const meta = o.showMeta ? `<div class="sd-meta">${T.meta}</div>` : '';
  return `<div class="pg sd-pg">`
    + `<div class="sd-head"><div class="sd-title">${o.title}</div><div class="sd-sub">${sub}</div></div>`
    + meta
    + `<div class="sd-body" style="grid-template-columns:repeat(${layout.cols},auto)">${items}</div>`
    + `<div class="sd-foot">${fill(T.footer, { a: plan.index, b: total, d: o.date })}</div>`
    + `</div>`;
}

/** 全部打印页 (每项一页 HTML), 供打印与页面内预览共用 */
export function buildSheetPages(o: SheetOptions): string[] {
  const plans = planPages(o);
  return plans.map((plan) => buildPageHtml(o, plan, plans.length));
}

/** 完整 body 片段 (打印用) */
export function buildSheetHtml(o: SheetOptions): string {
  return buildSheetPages(o).join('');
}

/** 打印/预览共用样式 (含 A4 页面基础样式) */
export const SHEET_CSS = `${PRINT_BASE_CSS}
.sd-pg {
  display: flex;
  flex-direction: column;
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
}
.sd-head { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 0.4mm solid ${LINE_COLOR}; padding-bottom: 2mm; }
.sd-title { font-size: 6mm; font-weight: 700; letter-spacing: 1mm; }
.sd-sub { font-size: 3.8mm; color: #333; }
.sd-meta { margin-top: 2.5mm; font-size: 3.6mm; color: #555; }
.sd-body { flex: 1; display: grid; gap: ${GRID_GAP_MM}mm; justify-items: center; align-content: center; }
.sd-item { display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
.sd-cap { font-size: 3.6mm; color: #333; }
.sd-grid { border-collapse: collapse; table-layout: fixed; }
.sd-grid td { padding: 0; text-align: center; vertical-align: middle; font-weight: 600; color: #111; }
.sd-grid td.sd-ans { color: #d40000; }
.sd-foot { font-size: 3.2mm; color: #888; text-align: right; }
`;

// ==================== 设置项持久化 ====================

const readSetting = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const writeSetting = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式等场景忽略 */ }
};

export function normalizeSize(v: unknown): GridSize {
  return (v === 4 || v === 6 || v === 9) ? v : 9;
}
export function normalizeDifficulty(v: unknown): Difficulty {
  return (v === 'hard' || v === 'medium' || v === 'easy') ? v : 'medium';
}
export function normalizePages(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 4;
  return Math.min(20, Math.max(1, Math.round(n)));
}
export function normalizeMode(v: unknown): PrintMode {
  return (v === 'puzzle' || v === 'answer' || v === 'both') ? v : 'puzzle';
}

export const getDefaultSize = (): GridSize => normalizeSize(readSetting(KEY_SIZE));
export const getDefaultDifficulty = (): Difficulty => normalizeDifficulty(readSetting(KEY_DIFFICULTY));
export const getDefaultPages = (): number => normalizePages(readSetting(KEY_PAGES));
export const getDefaultMode = (): PrintMode => normalizeMode(readSetting(KEY_MODE));

export const setDefaultSize = (v: GridSize): void => writeSetting(KEY_SIZE, String(v));
export const setDefaultDifficulty = (v: Difficulty): void => writeSetting(KEY_DIFFICULTY, v);
export const setDefaultPages = (v: number): void => writeSetting(KEY_PAGES, String(normalizePages(v)));
export const setDefaultMode = (v: PrintMode): void => writeSetting(KEY_MODE, v);
