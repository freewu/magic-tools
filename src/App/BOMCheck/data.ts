// BOMCheck 界面数据: BOM 类型显示名 / 下拉选项文案 / 时间格式化
import { bomBytes, type BomKey } from './lib';

/** BOM 类型显示名 (与编程语言无关, 不做翻译) */
export const BOM_LABELS: Record<BomKey, string> = {
  utf8: 'UTF-8',
  utf16le: 'UTF-16 LE',
  utf16be: 'UTF-16 BE',
  utf32le: 'UTF-32 LE',
  utf32be: 'UTF-32 BE',
};

/** HEX 字节串 (大写空格分隔) */
export const hexOf = (bytes: number[]): string =>
  bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

/** BOM 类型显示名 + 字节序列 + 长度, 如 "UTF-8 (EF BB BF, 3 字节)" */
export const bomLabel = (key: BomKey): string =>
  `${BOM_LABELS[key]} (${hexOf(bomBytes(key))})`;

/** 时间戳 -> YYYY-MM-DD HH:mm:ss (与运行环境时区一致, 不随语言变化) */
export const formatDateTime = (ts: number): string => {
  if (!Number.isFinite(ts) || ts <= 0) return '-';
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
