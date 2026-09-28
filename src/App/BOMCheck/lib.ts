// BOMCheck 纯逻辑: BOM 识别 / 增删 / 无 BOM 编码推测 / 文本预览 (不依赖 React 与 DOM)
// 说明: BOM (Byte Order Mark) 是文件开头的字节标记, 常见于 Windows 记事本另存为 UTF-8 的文件
//       UTF-8: EF BB BF | UTF-16 LE: FF FE | UTF-16 BE: FE FF | UTF-32 LE: FF FE 00 00 | UTF-32 BE: 00 00 FE FF

export type BomKey = 'utf8' | 'utf16le' | 'utf16be' | 'utf32le' | 'utf32be';
/** 解码用编码 (BOM 类型 + 无 BOM 时猜测出的 GBK) */
export type EncKey = BomKey | 'gbk';
/** 无 BOM 时的编码猜测结果 */
export type GuessKey = EncKey | 'binary';

export interface BomDef {
  key: BomKey;
  /** BOM 字节 */
  bytes: number[];
}

/** 识别顺序: 长字节优先, 否则 UTF-32 LE (FF FE 00 00) 会被误判为 UTF-16 LE (FF FE) */
export const BOM_LIST: BomDef[] = [
  { key: 'utf32le', bytes: [ 0xFF, 0xFE, 0x00, 0x00 ] },
  { key: 'utf32be', bytes: [ 0x00, 0x00, 0xFE, 0xFF ] },
  { key: 'utf8', bytes: [ 0xEF, 0xBB, 0xBF ] },
  { key: 'utf16le', bytes: [ 0xFF, 0xFE ] },
  { key: 'utf16be', bytes: [ 0xFE, 0xFF ] },
];

/** 界面下拉框中的 BOM 类型顺序 (按常用度: UTF-8 优先) */
export const BOM_KEYS: BomKey[] = [ 'utf8', 'utf16le', 'utf16be', 'utf32le', 'utf32be' ];

/** 单文件大小上限 (纯内存处理, 超过则提示)
 *  1 GiB: ArrayBuffer 上限远大于此, 但再大浏览体验会明显变差 */
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;

/** 常量取值: 单个 BOM 标记的字节长度 (无 BOM 为 0) */
export const bomSize = (key: BomKey | null): number => (key === null ? 0 : bomBytes(key).length);

/** BOM 类型的字节序列 */
export const bomBytes = (key: BomKey): number[] =>
  (BOM_LIST.find((i) => i.key === key) as BomDef).bytes;

/** 是否为合法的 BOM 类型 (用于本地存储 / 下拉框取值校验) */
export const isBomKey = (value: unknown): value is BomKey =>
  typeof value === 'string' && BOM_KEYS.includes(value as BomKey);

/** 文件头字节与 BOM 逐字节比较 */
const startsWith = (bytes: Uint8Array, mark: number[]): boolean => {
  if (bytes.length < mark.length) return false;
  for (let i = 0; i < mark.length; i++) {
    if (bytes[i] !== mark[i]) return false;
  }
  return true;
};

/**
 * 检测文件开头的 BOM
 * @returns 命中的全部类型 (按字节长度从长到短; 空数组 = 无 BOM)
 *          如 FF FE 00 00 开头时同时命中 UTF-32 LE 与 UTF-16 LE, 取第一个为默认判定
 */
export function detectBoms(bytes: Uint8Array): BomKey[] {
  return BOM_LIST.filter((def) => startsWith(bytes, def.bytes)).map((def) => def.key);
}

/** 检测文件开头的 BOM: 未命中返回 null, 命中返回字节最长的那种 */
export function detectBom(bytes: Uint8Array): BomKey | null {
  const list = detectBoms(bytes);
  return list.length > 0 ? list[0] : null;
}

/** 去掉开头的 BOM (无 BOM 时返回内容拷贝) */
export function stripBom(bytes: Uint8Array): Uint8Array {
  const key = detectBom(bytes);
  if (key === null) return bytes.slice();
  return bytes.slice(bomBytes(key).length);
}

/** 按指定类型去掉开头的 BOM (与 detectBom 不同, 用于用户在界面上手动指定类型) */
export function stripBomAs(bytes: Uint8Array, key: BomKey): Uint8Array {
  if (!startsWith(bytes, bomBytes(key))) return bytes.slice();
  return bytes.slice(bomBytes(key).length);
}

/** 添加 BOM: 已存在 BOM 时先移除再写入, 即「添加 / 替换」
 *  先按目标类型剥离 (可处理 UTF-16 LE 与 UTF-32 LE 同时命中的情况), 不匹配时再按识别到的类型剥离 */
export function addBom(bytes: Uint8Array, key: BomKey): Uint8Array {
  const body = startsWith(bytes, bomBytes(key)) ? stripBomAs(bytes, key) : stripBom(bytes);
  const head = bomBytes(key);
  const out = new Uint8Array(head.length + body.length);
  out.set(head, 0);
  out.set(body, head.length);
  return out;
}

/** 严格校验 UTF-8 字节序列 (含代理区 / 过长编码 / 超出范围判断) */
export function isValidUtf8(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 0x80) { i++; continue; }
    let need = 0;
    let cp = 0;
    if (b >= 0xC2 && b <= 0xDF) { need = 1; cp = b & 0x1F; }
    else if (b >= 0xE0 && b <= 0xEF) { need = 2; cp = b & 0x0F; }
    else if (b >= 0xF0 && b <= 0xF4) { need = 3; cp = b & 0x07; }
    else return false;
    if (i + need >= bytes.length) return false;
    for (let k = 1; k <= need; k++) {
      const nb = bytes[i + k];
      if (nb < 0x80 || nb > 0xBF) return false;
      cp = (cp << 6) | (nb & 0x3F);
    }
    // 过长编码 / 代理区 / 超出 U+10FFFF
    if (need === 2 && cp < 0x800) return false;
    if (need === 3 && (cp < 0x10000 || cp > 0x10FFFF)) return false;
    if (cp >= 0xD800 && cp <= 0xDFFF) return false;
    i += need + 1;
  }
  return true;
}

/**
 * 无 BOM 时按字节特征猜测编码
 * - 0x00 集中出现在奇数位 -> UTF-16 LE (如 41 00 42 00)
 * - 0x00 集中出现在偶数位 -> UTF-16 BE (如 00 41 00 42)
 * - 合法 UTF-8 序列 -> UTF-8
 * - 无 0x00 但不是合法 UTF-8 -> 可能是 GBK / Big5 等本地编码
 * - 其它 -> 二进制文件
 */
export function guessEncoding(bytes: Uint8Array): GuessKey {
  if (bytes.length === 0) return 'utf8';
  const sample = bytes.slice(0, 8192);
  const pairs = Math.floor(sample.length / 2);
  if (sample.length >= 4) {
    let oddZero = 0;
    let evenZero = 0;
    for (let i = 0; i < pairs * 2; i++) {
      if (sample[i] !== 0) continue;
      if (i % 2 === 0) evenZero++; else oddZero++;
    }
    if (oddZero / pairs > 0.6 && evenZero / pairs < 0.1) return 'utf16le';
    if (evenZero / pairs > 0.6 && oddZero / pairs < 0.1) return 'utf16be';
  }
  for (const b of sample) {
    // 文本里出现 NUL 基本可判定为二进制
    if (b === 0) return 'binary';
  }
  if (isValidUtf8(sample)) return 'utf8';
  return 'gbk';
}

/** UTF-32 解码 (浏览器 TextDecoder 不支持 UTF-32, 手工实现) */
const decodeUtf32 = (bytes: Uint8Array, little: boolean): string => {
  let out = '';
  for (let i = 0; i + 3 < bytes.length; i += 4) {
    const cp = (little
      ? bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)
      : (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    if (cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) {
      out += '\uFFFD';
    } else {
      out += String.fromCodePoint(cp);
    }
  }
  return out;
};

/** TextDecoder 的标准编码名 (必须带连字符, 如 utf-16le; 无连字符会抛异常) */
const DECODER_LABEL: Record<Exclude<EncKey, 'utf32le' | 'utf32be'>, string> = {
  utf8: 'utf-8',
  utf16le: 'utf-16le',
  utf16be: 'utf-16be',
  gbk: 'gbk',
};

/**
 * 按编码把字节解码为文本 (先去掉 BOM)
 * @param enc 编码; gbk 用于无 BOM 的中文遗留文件
 */
export function decodeBytes(bytes: Uint8Array, enc: EncKey): string {
  const body = stripBom(bytes);
  try {
    if (enc === 'utf32le') return decodeUtf32(body, true);
    if (enc === 'utf32be') return decodeUtf32(body, false);
    return new TextDecoder(DECODER_LABEL[enc]).decode(body);
  } catch {
    return '';
  }
}

/** 取前 limit 个字符作为预览 (避免超长文件把界面卡住) */
export function previewText(bytes: Uint8Array, enc: EncKey, limit = 2000): string {
  const text = decodeBytes(bytes, enc);
  return text.length > limit ? text.slice(0, limit) : text;
}

/** 文件头十六进制预览 (默认前 32 字节) */
export function hexPreview(bytes: Uint8Array, limit = 32): string {
  return Array.from(bytes.slice(0, limit))
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

/** 字节数格式化 (与图片工具同款输出) */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// ---- 默认 BOM 类型 (设置中心配置, 保存在浏览器本地) ----
const BOM_KEY_ITEM = 'bom-check:default-bom';

/** 读取默认 BOM 类型 (非法值回退 UTF-8) */
export function getDefaultBom(): BomKey {
  const value = localStorage.getItem(BOM_KEY_ITEM);
  return isBomKey(value) ? value : 'utf8';
}

/** 保存默认 BOM 类型 */
export function setDefaultBom(key: BomKey): void {
  try {
    localStorage.setItem(BOM_KEY_ITEM, key);
  } catch {
    // 隐私模式等写入失败时忽略
  }
}
