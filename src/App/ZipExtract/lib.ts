// Zip 解压: 应用级配置 (文件名编码默认值) 与选择 / 预览 / 落盘计划的纯逻辑
//
// 解析与读取能力 (loadZip / listEntries / readEntry) 见 src/lib/zip.ts。
import {
  ZIP_NAME_MODES, extOfPath, isImageEntry, isTextEntry, looksLikeText, normalizePath, uniquePath,
  type ZipEntry, type ZipNameMode,
} from '../../lib/zip';

/** 默认文件名编码 (设置页可改) */
export const NAME_MODE_KEY = 'zip-extract:name-mode';
/** 默认值变化事件: 设置页调整后, 已打开的工具页实时跟随 */
export const ZIP_EXTRACT_CHANGED = 'zip-extract:default-changed';

/** 压缩包大小上限 (超过则拒绝载入, 防止一次性读爆内存) */
export const MAX_ZIP_SIZE = 512 * 1024 * 1024;

/** 列表最多渲染的条目数 (超大包只渲染前若干行, 不影响解压) */
export const MAX_ROWS = 800;

/** 文本预览最多读取的字节数 */
export const PREVIEW_TEXT_BYTES = 128 * 1024;

export const isNameMode = (v: unknown): v is ZipNameMode =>
  typeof v === 'string' && (ZIP_NAME_MODES as readonly string[]).includes(v);

/** 读取设置页配置的默认文件名编码 (缺省 auto) */
export const getDefaultNameMode = (): ZipNameMode => {
  try {
    const raw = localStorage.getItem(NAME_MODE_KEY);
    return isNameMode(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
};

/** 保存默认文件名编码并广播 (设置页与工具页共用) */
export const setDefaultNameMode = (v: unknown): void => {
  const mode: ZipNameMode = isNameMode(v) ? v : 'auto';
  try {
    localStorage.setItem(NAME_MODE_KEY, mode);
  } catch {
    // 隐私模式等写入失败时忽略 (本次会话内仍生效)
  }
  window.dispatchEvent(new Event(ZIP_EXTRACT_CHANGED));
};

// ---------- 选中集合 (目录条目不可选) ----------

/** 可选条目 id 列表 (跳过目录) */
export const selectableIds = (entries: readonly ZipEntry[]): string[] =>
  entries.filter((e) => !e.dir).map((e) => e.key);

/** 单个条目选中 / 取消 */
export const toggleId = (prev: ReadonlySet<string>, id: string): Set<string> => {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/** 全选 (仅文件) */
export const selectAll = (entries: readonly ZipEntry[]): Set<string> => new Set(selectableIds(entries));

/** 反选 (仅文件) */
export const invertSelection = (prev: ReadonlySet<string>, entries: readonly ZipEntry[]): Set<string> =>
  new Set(selectableIds(entries).filter((id) => !prev.has(id)));

/** 丢掉已不存在的 id (切换编码 / 重新载入压缩包后调用) */
export const pruneSelection = (prev: ReadonlySet<string>, entries: readonly ZipEntry[]): Set<string> => {
  const alive = new Set(selectableIds(entries));
  return new Set([ ...prev ].filter((id) => alive.has(id)));
};

// ---------- 预览 ----------

export type PreviewKind = 'dir' | 'image' | 'text' | 'binary';

/** 条目的预览方式 (未知扩展名时按字节样本兜底判断) */
export const previewKind = (entry: ZipEntry, bytes?: Uint8Array): PreviewKind => {
  if (entry.dir) return 'dir';
  if (isImageEntry(entry.path)) return 'image';
  if (isTextEntry(entry.path)) return 'text';
  if (bytes && bytes.length > 0 && looksLikeText(bytes)) return 'text';
  return 'binary';
};

/** 条目扩展名 (无扩展名返回空串; 供列表展示类型用) */
export const kindLabel = (entry: ZipEntry): string =>
  entry.dir ? '' : (extOfPath(entry.path) || 'file');

// ---------- 解压 (落盘) 计划 ----------

/** 待写出的文件 (rel 为相对目标目录的安全路径) */
export interface ExtractItem {
  /** 条目 id (JSZip 键名) */
  id: string;
  /** 包内原始路径 (展示用) */
  path: string;
  /** 归一化并去重后的落盘相对路径 */
  rel: string;
}

export interface ExtractPlan {
  /** 待写出的文件 */
  items: ExtractItem[];
  /** 跳过的目录数 (空目录不单独创建) */
  dirs: number;
  /** 因路径不安全 / 归一化后为空 而跳过的条目 */
  unsafe: string[];
}

/**
 * 生成解压计划: 只取选中的文件条目, 剥离 ../ 与绝对路径, 同路径去重 (后者自动加序号)
 * @param entries  压缩包全部条目
 * @param selected 选中的条目 id 集合
 */
export const planExtract = (entries: readonly ZipEntry[], selected: ReadonlySet<string>): ExtractPlan => {
  const items: ExtractItem[] = [];
  const taken = new Set<string>();
  let dirs = 0;
  const unsafe: string[] = [];
  for (const entry of entries) {
    if (entry.dir) {
      if (selected.has(entry.key)) dirs += 1;
      continue;
    }
    if (!selected.has(entry.key)) continue;
    const rel = normalizePath(entry.path);
    if (rel === '') {
      unsafe.push(entry.path);
      continue;
    }
    items.push({ id: entry.key, path: entry.path, rel: uniquePath(rel, taken) });
  }
  return { items, dirs, unsafe };
};

/** 单条目下载时用的文件名 (取路径最后一段) */
export const fileNameOf = (path: string): string => normalizePath(path).split('/').pop() ?? 'file';
