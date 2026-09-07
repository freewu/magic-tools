// 文件比较 (行级 diff): 文本解码 (UTF-8/GBK 自动) + 最长公共子序列(LCS) 行对齐。
//
// 返回"左右对齐行"序列: 每个元素可含左侧行(来自 A)与/或右侧行(来自 B):
//  - 相同行: 两侧都有 (kind 'same')
//  - 仅 A 有: 左侧 'del', 右侧空 (占位)
//  - 仅 B 有: 左侧空 (占位), 右侧 'ins'
// UI 据此左右并排渲染: 左删右增高亮。

export const MAX_LINES = 4000; // 超过该行数截断 (LCS DP 内存/耗时保护)

export type RowKind = 'same' | 'del' | 'ins';

export interface SideLine {
  /** 原文件行号 (从 1 起) */
  n: number;
  text: string;
  kind: RowKind;
}

export interface DiffRow {
  a?: SideLine;
  b?: SideLine;
}

export interface DiffResult {
  rows: DiffRow[];
  /** 发生截断时标记 */
  truncated: boolean;
  /** 变化计数 */
  delCount: number;
  insCount: number;
}

/** 按 UTF-8 (严格) → GBK 顺序探测解码; 两者都失败退回 latin1 不抛错 */
export function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    /* 非 UTF-8, 尝试 GBK */
  }
  try {
    return new TextDecoder('gbk').decode(bytes);
  } catch {
    return new TextDecoder('latin1').decode(bytes);
  }
}

/** 统一换行并去掉行尾 \r; 空文本返回空数组 (避免把空文件当成一个空行) */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  return text.replace(/\r\n?/g, '\n').split('\n');
}

interface Op {
  kind: 'same' | 'del' | 'ins';
  a?: number; // a 的行下标 (same/del 有效)
  b?: number; // b 的行下标 (same/ins 有效)
}

/** LCS 行对齐 (文本行先做整行相等 id 化, DP 记录长度后回溯) */
export function lineDiff(a: string[], b: string[]): DiffResult {
  const truncated = a.length > MAX_LINES || b.length > MAX_LINES;
  const aa = truncated ? a.slice(0, MAX_LINES) : a;
  const bb = truncated ? b.slice(0, MAX_LINES) : b;
  const n = aa.length;
  const m = bb.length;

  // 行 id 化 (相同文本 -> 相同 id, 加速相等判断)
  const idA = new Int32Array(n);
  const idB = new Int32Array(m);
  const idMap = new Map<string, number>();
  let nextId = 0;
  const getId = (t: string): number => {
    let id = idMap.get(t);
    if (id === undefined) {
      id = nextId;
      nextId += 1;
      idMap.set(t, id);
    }
    return id;
  };
  for (let i = 0; i < n; i += 1) idA[i] = getId(aa[i]);
  for (let j = 0; j < m; j += 1) idB[j] = getId(bb[j]);

  // DP: dp[i*(m+1)+j] = a[i..] 与 b[j..] 的 LCS 长度
  const dp = new Int32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    const row = i * (m + 1);
    const nextRow = (i + 1) * (m + 1);
    for (let j = m - 1; j >= 0; j -= 1) {
      if (idA[i] === idB[j]) {
        dp[row + j] = dp[nextRow + j + 1] + 1;
      } else {
        const d1 = dp[nextRow + j];
        const d2 = dp[row + j + 1];
        dp[row + j] = d1 >= d2 ? d1 : d2;
      }
    }
  }

  // 回溯: 生成对齐行序列 (优先推进公共行)
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (idA[i] === idB[j]) {
      ops.push({ kind: 'same', a: i, b: j });
      i += 1;
      j += 1;
    } else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + j + 1]) {
      // 删除 a[i] 更优 (或并列), 左侧多一行
      ops.push({ kind: 'del', a: i });
      i += 1;
    } else {
      ops.push({ kind: 'ins', b: j });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ kind: 'del', a: i });
    i += 1;
  }
  while (j < m) {
    ops.push({ kind: 'ins', b: j });
    j += 1;
  }

  // 折叠相邻的 del 块与其后的 ins 块时保持顺序即可; 直接构建行
  const rows: DiffRow[] = [];
  let delCount = 0;
  let insCount = 0;
  for (const op of ops) {
    if (op.kind === 'same') {
      const ai = op.a as number;
      const bi = op.b as number;
      rows.push({
        a: { n: ai + 1, text: aa[ai], kind: 'same' },
        b: { n: bi + 1, text: bb[bi], kind: 'same' },
      });
    } else if (op.kind === 'del') {
      const ai = op.a as number;
      delCount += 1;
      rows.push({ a: { n: ai + 1, text: aa[ai], kind: 'del' } });
    } else {
      const bi = op.b as number;
      insCount += 1;
      rows.push({ b: { n: bi + 1, text: bb[bi], kind: 'ins' } });
    }
  }

  return { rows, truncated, delCount, insCount };
}

/** 快捷入口: 两个文本字符串 -> diff 结果 */
export function diffText(aText: string, bText: string): DiffResult {
  return lineDiff(splitLines(aText), splitLines(bText));
}
