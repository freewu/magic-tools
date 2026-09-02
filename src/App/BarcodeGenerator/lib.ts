import { barcodeFormatList } from './data';

// localStorage 键
const FORMAT_KEY = 'barcode:default-format';
const WIDTH_KEY = 'barcode:default-width';
const HEIGHT_KEY = 'barcode:default-height';
const TEXT_KEY = 'barcode:default-show-text';

// 数值限制
const WIDTH_MIN = 1;
const WIDTH_MAX = 5;
const HEIGHT_MIN = 30;
const HEIGHT_MAX = 300;

// 区间截断
const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

// 默认条码格式
export function getDefaultFormat(): string {
  const f = localStorage.getItem(FORMAT_KEY);
  return barcodeFormatList.some((item) => item.value === f) ? (f as string) : 'CODE128';
}

// 设置默认条码格式
export function setDefaultFormat(format: string): void {
  localStorage.setItem(FORMAT_KEY, barcodeFormatList.some((item) => item.value === format) ? format : 'CODE128');
}

// 默认条宽 (px)
export function getDefaultBarWidth(): number {
  const raw = localStorage.getItem(WIDTH_KEY);
  const v = raw === null ? 2 : parseInt(raw, 10);
  return Number.isFinite(v) ? clamp(v, WIDTH_MIN, WIDTH_MAX) : 2;
}

// 设置默认条宽
export function setDefaultBarWidth(width: number): void {
  localStorage.setItem(WIDTH_KEY, String(clamp(width, WIDTH_MIN, WIDTH_MAX)));
}

// 默认条码高度 (px)
export function getDefaultBarHeight(): number {
  const raw = localStorage.getItem(HEIGHT_KEY);
  const v = raw === null ? 100 : parseInt(raw, 10);
  return Number.isFinite(v) ? clamp(v, HEIGHT_MIN, HEIGHT_MAX) : 100;
}

// 设置默认条码高度
export function setDefaultBarHeight(height: number): void {
  localStorage.setItem(HEIGHT_KEY, String(clamp(height, HEIGHT_MIN, HEIGHT_MAX)));
}

// 默认是否显示内容文字
export function getDefaultShowText(): boolean {
  const raw = localStorage.getItem(TEXT_KEY);
  return raw === null ? true : raw !== '0';
}

// 设置默认是否显示内容文字
export function setDefaultShowText(show: boolean): void {
  localStorage.setItem(TEXT_KEY, show ? '1' : '0');
}

// 获取当前格式的提示信息
export function getFormatHint(format: string): string {
  return barcodeFormatList.find((item) => item.value === format)?.hint ?? '';
}

// 计算 Mod10 校验位 (digits 为不含校验位的数字串; weights 从右往左循环)
const calcCheckDigit = (digits: string, weights: number[]): number => {
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const d = digits.charCodeAt(len - 1 - i) - 48;
    sum += d * weights[i % weights.length];
  }
  return (10 - (sum % 10)) % 10;
};

// 通用: 纯数字 + 可选校验位校验 (digits 为 12/13 位数字, 若为 13 位则校验最后一位)
const verifyCheckable = (value: string, len: number): string => {
  if (value.length === len) {
    // 完整输入: 校验最后一位是否与计算一致
    const expect = calcCheckDigit(value.slice(0, len - 1), [3, 1]);
    return value.charCodeAt(len - 1) - 48 === expect ? '' : '校验位不正确, 请检查最后一位数字';
  }
  return ''; // len-1 位输入: 由引擎自动补校验位
};

// 输入校验: 返回错误提示, 合法返回空字符串
export function validateBarcode(format: string, value: string): string {
  if (value === '') return '';
  switch (format) {
    case 'CODE128':
      return /^[\x20-\x7e]+$/.test(value) ? '' : 'CODE128 仅支持可打印 ASCII 字符 (空格及可见字符)';
    case 'CODE128A':
      return /^[\x20-\x5f]+$/.test(value) ? '' : 'CODE128 A 仅支持数字、大写字母与常用符号 (ASCII 32-95)';
    case 'CODE128B':
      return /^[\x20-\x7e]+$/.test(value) ? '' : 'CODE128 B 仅支持 ASCII 32-126 (含小写字母)';
    case 'CODE128C':
      return /^[0-9]+$/.test(value) && value.length % 2 === 0
        ? ''
        : 'CODE128 C 仅支持数字且位数必须为偶数';
    case 'EAN13':
      if (!/^[0-9]{12,13}$/.test(value)) return 'EAN-13 需要 12 或 13 位数字';
      return verifyCheckable(value, 13);
    case 'EAN8':
      if (!/^[0-9]{7,8}$/.test(value)) return 'EAN-8 需要 7 或 8 位数字';
      return verifyCheckable(value, 8);
    case 'UPC':
      if (!/^[0-9]{11,12}$/.test(value)) return 'UPC-A 需要 11 或 12 位数字';
      return verifyCheckable(value, 12);
    case 'CODE39':
      return /^[0-9A-Z\-. $\/+%]+$/.test(value) ? '' : 'CODE39 仅支持: 0-9 A-Z 及 - . 空格 $ / + %';
    case 'ITF14':
      if (!/^[0-9]{13,14}$/.test(value)) return 'ITF-14 需要 13 或 14 位数字';
      return verifyCheckable(value, 14);
    case 'ITF':
      return /^[0-9]+$/.test(value) && value.length % 2 === 0 && value.length >= 2
        ? ''
        : 'ITF 仅支持数字且位数必须为偶数';
    case 'MSI':
    case 'MSI10':
    case 'MSI11':
    case 'MSI1010':
    case 'MSI1110':
      return /^[0-9]+$/.test(value) ? '' : 'MSI 系列仅支持数字';
    case 'pharmacode': {
      if (!/^[0-9]+$/.test(value)) return 'Pharmacode 仅支持数字';
      const n = parseInt(value, 10);
      return n >= 3 && n <= 131070 ? '' : 'Pharmacode 取值范围为 3-131070';
    }
    default:
      return '';
  }
}
