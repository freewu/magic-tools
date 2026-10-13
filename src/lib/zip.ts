// Zip 工具通用能力: 基于 JSZip 的打包 / 读取 / 解包 (「Zip 压缩」与「Zip 解压」两个工具共用)
//
// 说明: 这里只放与界面无关的纯逻辑 (路径归一化 / 打包 / 条目解析 / 类型判断), 便于单测;
//       文件读取、保存对话框等副作用留在各工具的 index.tsx 中。
import JSZip from 'jszip';

/** 压缩级别: 0 = 仅存储 (不压缩, 最快), 1-9 = DEFLATE 级别 (越大压缩率越高但越慢) */
export type ZipLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 全部可选压缩级别 */
export const LEVELS: readonly ZipLevel[] = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ] as const;

/** 默认压缩级别 (6, 与 zip 命令行 / 7-Zip 默认一致) */
export const DEFAULT_LEVEL: ZipLevel = 6;

/** 级别说明词条 (页面经语言包翻译; 无说明的级别不列在此处) */
export const LEVEL_TAGS: Record<number, string> = {
  0: '仅存储 (不压缩)',
  1: '最快',
  6: '默认',
  9: '最小 (最慢)',
};

/** 压缩包内文件名编码: auto = 先按 UTF-8 严格解析, 失败再按 GBK (Windows 下常见的中文压缩包); big5 供繁体中文的老压缩包 */
export type ZipNameMode = 'auto' | 'utf-8' | 'gbk' | 'big5';

export const ZIP_NAME_MODES: readonly ZipNameMode[] = [ 'auto', 'utf-8', 'gbk', 'big5' ] as const;

/** 待打包的文件 */
export interface ZipSourceItem {
  /** 压缩包内路径 (可含子目录, 分隔符统一为 /) */
  path: string;
  /** 文件字节 */
  bytes: Uint8Array;
  /** 最后修改时间 (缺省用打包时刻) */
  date?: Date;
}

/** 压缩包条目 (解压页列表展示用) */
export interface ZipEntry {
  /** JSZip 内部键名 (读取条目内容时用) */
  key: string;
  /** 归一化后的包内路径 (剥掉开头的 / 与 .. 片段, 展示与落盘都用它) */
  path: string;
  /** 是否为目录条目 */
  dir: boolean;
  /** 解压后大小 (字节) */
  size: number;
  /** 压缩后大小 (字节; 无法取得时与 size 相同) */
  compressedSize: number;
  /** 最后修改时间 */
  date: Date | null;
  /** 原始路径含 .. 或以 / 开头 (zip-slip 风险, 已剥离, 界面上给出提示) */
  unsafe: boolean;
}

// ---------- 体积 / 路径 ----------

/** 字节数格式化 (比 image.ts 的 formatBytes 多一档 GB) */
export const formatSize = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

/** 压缩率百分比 (0~100 的整数; 原始为 0 时返回 0) */
export const savedPercent = (rawSize: number, zippedSize: number): number => {
  if (!Number.isFinite(rawSize) || rawSize <= 0) return 0;
  return Math.round((1 - zippedSize / rawSize) * 100);
};

/**
 * 归一化包内路径: 反斜杠转正斜杠, 去掉开头的 / 与盘符, 丢弃 `.` / `..` 片段
 * (防止 zip-slip: 解压路径不能跳出目标目录), 折叠重复斜杠。
 * @param keepTrailing 是否保留结尾的 / (目录条目)
 */
export const normalizePath = (path: string, keepTrailing = false): string => {
  const raw = String(path ?? '').replace(/\\/g, '/');
  const trailing = keepTrailing && raw.endsWith('/');
  const parts = raw.split('/').filter((p) => p !== '' && p !== '.' && p !== '..');
  const joined = parts.join('/');
  return trailing && joined !== '' ? `${joined}/` : joined;
};

/** 是否为把路径指向目录外的危险路径 (绝对路径或含 .. 片段) */
export const isUnsafePath = (path: string): boolean => {
  const raw = String(path ?? '').replace(/\\/g, '/');
  return raw.startsWith('/') || /^[a-zA-Z]:/.test(raw) || raw.split('/').includes('..');
};

/**
 * 在 taken 集合内为 path 找一个不重名的路径 (重名时在扩展名前插入 " (2)" / " (3)" ...),
 * 命中后把结果写入 taken。
 */
export const uniquePath = (path: string, taken: Set<string>): string => {
  if (!taken.has(path)) { taken.add(path); return path; }
  const dot = path.lastIndexOf('.');
  const slash = path.lastIndexOf('/');
  const hasExt = dot > slash + 1; // 目录名里的点不算扩展名
  const base = hasExt ? path.slice(0, dot) : path;
  const ext = hasExt ? path.slice(dot) : '';
  for (let i = 2; ; i++) {
    const cand = `${base} (${i})${ext}`;
    if (!taken.has(cand)) { taken.add(cand); return cand; }
  }
};

/** 为一批条目分配互不冲突的包内路径 (保持输入顺序) */
export const assignPaths = (items: readonly { path: string }[]): string[] => {
  const taken = new Set<string>();
  return items.map((item) => uniquePath(item.path, taken));
};

/** 取 File 在压缩包内的路径: 拖入文件夹时优先用 webkitRelativePath (含目录层级) */
export const entryPathOf = (file: File): string => {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return normalizePath(rel && rel !== '' ? rel : file.name);
};

/**
 * 输出文件名归一化: 去掉首尾空白与非法字符, 补上 .zip 扩展名。
 * 为空时用 fallback (不传则用 archive)。
 */
export const zipNameOf = (name: string, fallback = 'archive'): string => {
  const cleaned = String(name ?? '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/^-+|-+$/g, '');
  const base = cleaned === '' ? fallback : cleaned;
  return /\.zip$/i.test(base) ? base : `${base}.zip`;
};

/** 由已选文件推一个默认压缩包名 (取公共顶层目录名, 无则用第一个文件名, 都没有则 archive) */
export const suggestZipName = (paths: readonly string[], fallback = 'archive'): string => {
  const list = paths.filter((p) => p !== '');
  if (list.length === 0) return zipNameOf(fallback);
  const first = list[0];
  const root = first.includes('/') ? first.split('/')[0] : '';
  // 所有文件都在同一个顶层目录下时用该目录名
  if (root !== '' && list.every((p) => p.split('/')[0] === root)) return zipNameOf(root);
  return zipNameOf((first.split('/').pop() ?? first).replace(/\.[^.]+$/, ''), fallback);
};

// ---------- 打包 ----------

/**
 * 打包为 zip 字节 (JSZip)
 * @param items     待打包文件 (重名自动加序号, 不会互相覆盖)
 * @param level     压缩级别, 0 = 仅存储
 * @param onProgress 进度回调 (0~100)
 */
export const buildZip = async (
  items: readonly ZipSourceItem[],
  level: ZipLevel = DEFAULT_LEVEL,
  onProgress?: (percent: number) => void,
): Promise<Uint8Array> => {
  const zip = new JSZip();
  const paths = assignPaths(items);
  items.forEach((item, i) => {
    const opts: JSZip.JSZipFileOptions = { createFolders: true };
    if (item.date) opts.date = item.date;
    zip.file(paths[i], item.bytes, opts);
  });
  const options: JSZip.JSZipGeneratorOptions<'uint8array'> = {
    type: 'uint8array',
    compression: level === 0 ? 'STORE' : 'DEFLATE',
  };
  if (level !== 0) options.compressionOptions = { level };
  return zip.generateAsync(options, (meta) => onProgress?.(meta.percent));
};

// ---------- 读取 / 解包 ----------

/**
 * 按指定文件名编码生成 JSZip 的 decodeFileName 回调。
 * auto: 先按 UTF-8 严格解析, 失败退回 GBK (Windows 生成的简体中文压缩包常见, 且不带 UTF-8 标志位)
 */
export const nameDecoder = (
  mode: ZipNameMode,
): ((bytes: string[] | Uint8Array) => string) | undefined => {
  if (mode === 'utf-8') return undefined; // 用 JSZip 默认 (UTF-8)
  // JSZip 传进来的可能是 Uint8Array, 也可能是字节值数组 (环境不支持 Uint8Array 时)
  const toBytes = (bytes: string[] | Uint8Array): Uint8Array => {
    if (bytes instanceof Uint8Array) return bytes;
    const list = bytes as unknown as Array<number | string>;
    return Uint8Array.from(list.map((v) => (typeof v === 'number' ? v & 0xff : v.charCodeAt(0) & 0xff)));
  };
  return (bytes: string[] | Uint8Array): string => {
    const buf = toBytes(bytes);
    // 显式指定编码时直接按该编码解 (环境不支持时退回 UTF-8)
    if (mode === 'gbk' || mode === 'big5') {
      try { return new TextDecoder(mode).decode(buf); } catch { /* 环境不支持该编码时退回 */ }
      return new TextDecoder('utf-8').decode(buf);
    }
    // auto: 先严格按 UTF-8 解, 失败再按 GBK (Windows 老工具最常见的乱码方式)
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      try { return new TextDecoder('gbk').decode(buf); } catch { /* 同上 */ }
      return new TextDecoder('utf-8').decode(buf);
    }
  };
};

/** 解析 zip 字节 (checkCRC32 = true 时逐个校验 CRC, 慢但能发现损坏) */
export const loadZip = (
  data: Uint8Array | ArrayBuffer,
  opts: { nameMode?: ZipNameMode; checkCRC32?: boolean } = {},
): Promise<JSZip> => {
  const options: JSZip.JSZipLoadOptions = { checkCRC32: opts.checkCRC32 === true };
  const decoder = nameDecoder(opts.nameMode ?? 'auto');
  if (decoder) options.decodeFileName = decoder;
  return JSZip.loadAsync(data, options);
};

/** 条目内部元数据 (JSZip 未公开, 但加载后一定带 compressedSize / uncompressedSize) */
interface EntryMeta { compressedSize?: number; uncompressedSize?: number; }

/** 列出压缩包内全部条目 (目录在前? 不排序, 保持包内原始顺序; 按路径排序由页面决定) */
export const listEntries = (zip: JSZip): ZipEntry[] => {
  const out: ZipEntry[] = [];
  for (const [ key, obj ] of Object.entries(zip.files)) {
    const meta = (obj as unknown as { _data?: EntryMeta | null })._data ?? undefined;
    const size = typeof meta?.uncompressedSize === 'number' ? meta.uncompressedSize : 0;
    const compressedSize = typeof meta?.compressedSize === 'number' ? meta.compressedSize : size;
    const rawName = obj.unsafeOriginalName ?? key;
    out.push({
      key,
      path: normalizePath(key, obj.dir),
      dir: obj.dir === true,
      size,
      compressedSize,
      date: obj.date instanceof Date ? obj.date : null,
      unsafe: isUnsafePath(rawName) || normalizePath(rawName) !== normalizePath(key),
    });
  }
  return out;
};

/** 读取单个条目的字节 (条目不存在 / 是目录时返回空数组) */
export const readEntry = async (zip: JSZip, entry: ZipEntry): Promise<Uint8Array> => {
  if (entry.dir) return new Uint8Array(0);
  const obj = zip.file(entry.key);
  if (!obj) return new Uint8Array(0);
  return obj.async('uint8array');
};

/** 读取文本条目 (最多 maxBytes 字节, UTF-8 解码, 二进制内容会出现替换字符) */
export const readEntryText = async (
  zip: JSZip,
  entry: ZipEntry,
  maxBytes = 64 * 1024,
): Promise<string> => {
  if (entry.dir) return '';
  const obj = zip.file(entry.key);
  if (!obj) return '';
  const bytes = await obj.async('uint8array');
  const slice = bytes.subarray(0, Math.max(0, maxBytes));
  return new TextDecoder('utf-8').decode(slice);
};

/** 汇总: 文件数 / 目录数 / 原始总大小 / 压缩后总大小 */
export const summarize = (entries: readonly ZipEntry[]) => {
  let files = 0, dirs = 0, rawSize = 0, zippedSize = 0;
  for (const e of entries) {
    if (e.dir) { dirs += 1; continue; }
    files += 1;
    rawSize += e.size;
    zippedSize += e.compressedSize;
  }
  return { files, dirs, rawSize, zippedSize };
};

// ---------- 条目类型判断 (决定能否预览) ----------

const IMAGE_EXTS = new Set([ 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif' ]);
const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'json', 'json5', 'jsonl', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'css',
  'scss', 'less', 'html', 'htm', 'xml', 'yml', 'yaml', 'csv', 'tsv', 'log', 'ini', 'conf', 'cfg',
  'toml', 'properties', 'env', 'sh', 'bash', 'bat', 'cmd', 'ps1', 'java', 'py', 'rb', 'go', 'rs',
  'c', 'h', 'cpp', 'hpp', 'cs', 'php', 'sql', 'vue', 'svelte', 'gradle', 'makefile', 'dockerfile',
]);
const IMAGE_MIMES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml', avif: 'image/avif',
};

/** 取扩展名 (小写, 无点); 无扩展名返回空串 */
export const extOfPath = (path: string): string => {
  const name = path.split('/').pop() ?? path;
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
};

/** 是否图片条目 (可本地预览) */
export const isImageEntry = (path: string): boolean => IMAGE_EXTS.has(extOfPath(path));

/** 图片 MIME (用于预览的 data URL; 非图片或 svg 之外的未知类型回退 png) */
export const imageMimeOf = (path: string): string => IMAGE_MIMES[extOfPath(path)] ?? 'image/png';

/** 是否文本条目 (扩展名在白名单内, 或为 makefile / dockerfile 等无扩展名的常见文本文件) */
export const isTextEntry = (path: string): boolean => {
  const name = (path.split('/').pop() ?? '').toLowerCase();
  if (TEXT_EXTS.has(extOfPath(name))) return true;
  return [ 'makefile', 'dockerfile', 'license', '.gitignore', '.env', '.gitattributes' ].includes(name);
};

/**
 * 按字节样本判断是否像文本 (含 0 字节或非法控制字符比例过高视为二进制)
 * 无扩展名 / 未知扩展名的条目用它兜底决定能否预览。
 */
export const looksLikeText = (bytes: Uint8Array, sampleSize = 2048): boolean => {
  const n = Math.min(bytes.length, sampleSize);
  if (n === 0) return true;
  let bad = 0;
  for (let i = 0; i < n; i++) {
    const b = bytes[i];
    if (b === 0) return false;
    // 允许 tab / LF / CR, 其余 C0 控制字符视为二进制特征
    if (b < 0x09 || (b > 0x0d && b < 0x20)) bad += 1;
  }
  return bad / n < 0.05;
};

/** 字节 -> base64 (预览图片用; 分块避免超长参数栈溢出) */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let out = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const part = bytes.subarray(i, i + chunk);
    let s = '';
    for (let j = 0; j < part.length; j++) s += String.fromCharCode(part[j]);
    out += s;
  }
  return btoa(out);
};

/** 生成图片预览的 data URL */
export const imageDataUrl = (bytes: Uint8Array, path: string): string =>
  `data:${imageMimeOf(path)};base64,${bytesToBase64(bytes)}`;
