// Zip 压缩: 应用级配置 (默认压缩级别 / 是否保留文件夹结构) 与待打包文件列表的纯逻辑
//
// 通用打包能力 (路径归一化 / 去重 / buildZip) 见 src/lib/zip.ts; 这里只放本工具特有的部分。
import { assignPaths, entryPathOf, normalizePath, type ZipLevel } from '../../lib/zip';

/** 默认压缩级别 (设置页可改; 0-9) */
export const LEVEL_KEY = 'zip-compress:level';
/** 是否保留文件夹结构 (设置页可改) */
export const KEEP_PATH_KEY = 'zip-compress:keep-path';
/** 默认值变化事件: 设置页调整后, 已打开的工具页实时跟随 */
export const ZIP_COMPRESS_CHANGED = 'zip-compress:default-changed';

const LEVEL_MIN = 0;
const LEVEL_MAX = 9;
/** 与 zip / 7-Zip 一致的默认级别 */
const LEVEL_DEFAULT: ZipLevel = 6;

/** 把任意输入规整为合法压缩级别 (非数字回退默认级别, 越界夹紧) */
export const toLevel = (v: unknown): ZipLevel => {
  // 空值 (null / undefined / 空字符串) 视为未设置, 用默认级别
  if (v === null || v === undefined || v === '') return LEVEL_DEFAULT;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return LEVEL_DEFAULT;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, n)) as ZipLevel;
};

/** 读取设置页配置的默认压缩级别 */
export const getDefaultLevel = (): ZipLevel => {
  try {
    return toLevel(localStorage.getItem(LEVEL_KEY));
  } catch {
    return LEVEL_DEFAULT;
  }
};

/** 保存默认压缩级别并广播 (设置页与工具页共用) */
export const setDefaultLevel = (v: unknown): void => {
  const level = toLevel(v);
  try {
    localStorage.setItem(LEVEL_KEY, String(level));
  } catch {
    // 隐私模式等写入失败时忽略 (本次会话内仍生效)
  }
  window.dispatchEvent(new Event(ZIP_COMPRESS_CHANGED));
};

/** 读取设置页配置的「是否保留文件夹结构」(缺省保留) */
export const getDefaultKeepPath = (): boolean => {
  try {
    return localStorage.getItem(KEEP_PATH_KEY) !== '0';
  } catch {
    return true;
  }
};

/** 保存「是否保留文件夹结构」并广播 */
export const setDefaultKeepPath = (v: unknown): void => {
  const on = v === true || v === '1' || v === 1 || v === 'true';
  try {
    localStorage.setItem(KEEP_PATH_KEY, on ? '1' : '0');
  } catch {
    // 同上, 忽略写入失败
  }
  window.dispatchEvent(new Event(ZIP_COMPRESS_CHANGED));
};

/** 待打包文件 (字节已读入内存) */
export interface PickedFile {
  /** 列表内唯一 id (与源路径无关, 用于 React key 与删除) */
  id: string;
  /** 源路径 (拖入文件夹时含层级, 分隔符统一为 /) */
  path: string;
  /** 文件大小 (字节) */
  size: number;
  /** 最后修改时间 (ms) */
  lastModified: number;
  /** 文件字节 */
  bytes: Uint8Array;
}

let seq = 0;
const nextId = (): string => `zf-${(seq += 1)}`;

/**
 * 读取 FileList 为待打包文件 (读入字节)
 * @param files 用户选择 / 拖入的文件
 * @param max    最多读取个数 (超出部分丢弃, 防止一次性拖入上万文件卡死界面)
 */
export const readFiles = async (files: readonly File[], max = 2000): Promise<PickedFile[]> => {
  const out: PickedFile[] = [];
  for (const file of files.slice(0, max)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    out.push({
      id: nextId(),
      path: entryPathOf(file),
      size: file.size,
      lastModified: file.lastModified,
      bytes,
    });
  }
  return out;
};

/**
 * 合并到已有列表: 相同源路径视为同一个文件 (重新选择时覆盖旧的, 保持原位置不重复)
 */
export const mergeFiles = (prev: readonly PickedFile[], incoming: readonly PickedFile[]): PickedFile[] => {
  const out = [ ...prev ];
  for (const item of incoming) {
    const at = out.findIndex((p) => p.path === item.path);
    if (at >= 0) out[at] = item;
    else out.push(item);
  }
  return out;
};

/** 按「是否保留文件夹结构」计算最终包内路径 (不保留时只取文件名), 重名自动加序号 */
export const finalPaths = (paths: readonly string[], keepPath: boolean): string[] => {
  const mapped = paths.map((p) => {
    const norm = normalizePath(p);
    return keepPath ? norm : (norm.split('/').pop() ?? norm);
  });
  return assignPaths(mapped.map((path) => ({ path })));
};

/** 列表汇总: 文件数与原始总大小 */
export const summarizeFiles = (files: readonly { size: number }[]): { count: number; total: number } =>
  ({ count: files.length, total: files.reduce((sum, f) => sum + f.size, 0) });

// ---------- 拖拽 (含文件夹递归展开) ----------

/** 给 File 补上合成路径 (拖入文件夹时用, 让 entryPathOf 能拿到层级) */
const withRelativePath = (file: File, path: string): File => {
  try {
    Object.defineProperty(file, 'webkitRelativePath', { value: path, configurable: true });
  } catch {
    // 不可写时退回文件名 (不会破坏拖拽功能)
  }
  return file;
};

/** 递归读取目录条目下的全部文件 (readEntries 每次最多返回 100 项, 需反复读到空) */
const readDirAll = (dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> =>
  new Promise((resolve) => {
    const reader = dir.createReader();
    const acc: FileSystemEntry[] = [];
    const step = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) { resolve(acc); return; }
        acc.push(...batch);
        step();
      }, () => resolve(acc));
    };
    step();
  });

/** 递归展开一个拖入的条目 (文件原样返回, 目录展开为其中的全部文件) */
const readEntryTree = async (entry: FileSystemEntry, prefix: string): Promise<File[]> => {
  const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
  if (entry.isFile) {
    const file = await new Promise<File | null>((resolve) => {
      (entry as FileSystemFileEntry).file((f) => resolve(f), () => resolve(null));
    });
    return file ? [ withRelativePath(file, path) ] : [];
  }
  if (entry.isDirectory) {
    const out: File[] = [];
    for (const child of await readDirAll(entry as FileSystemDirectoryEntry)) {
      out.push(...await readEntryTree(child, path));
    }
    return out;
  }
  return [];
};

/**
 * 拖拽落点读取文件列表: 优先用 webkitGetAsEntry 递归展开文件夹 (拖入目录时保留层级),
 * 环境不支持时退回 dataTransfer.files (只能拿到平铺的文件)。
 */
export const filesFromDataTransfer = async (dt: DataTransfer | null | undefined): Promise<File[]> => {
  const items = dt?.items ? Array.from(dt.items).filter((it) => it.kind === 'file') : [];
  const entries: FileSystemEntry[] = [];
  for (const item of items) {
    if (typeof item.webkitGetAsEntry !== 'function') continue;
    const entry = item.webkitGetAsEntry();
    if (entry) entries.push(entry);
  }
  if (entries.length === 0) return dt?.files ? Array.from(dt.files) : [];
  const out: File[] = [];
  for (const entry of entries) out.push(...await readEntryTree(entry, ''));
  return out;
};
