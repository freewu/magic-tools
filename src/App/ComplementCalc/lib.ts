// 原码 / 反码 / 补码 计算 (支持 1~64 位, 使用 BigInt 保证 64 位精度)

const MIN_BITS = 1;
const MAX_BITS = 64;

const twoPow = (bits: number): bigint => 1n << BigInt(bits);

// N 位有符号最小值 (-2^(N-1)) / 最大值 (2^(N-1)-1)
export const minSigned = (bits: number): bigint => -(1n << BigInt(bits - 1));
export const maxSigned = (bits: number): bigint => (1n << BigInt(bits - 1)) - 1n;
export const maxUnsigned = (bits: number): bigint => (1n << BigInt(bits)) - 1n;

export const signedRangeText = (bits: number): string => `${minSigned(bits)} ~ ${maxSigned(bits)}`;
export const unsignedRangeText = (bits: number): string => `0 ~ ${maxUnsigned(bits)}`;

const padBin = (bin: string, width: number): string => (bin.length >= width ? bin : '0'.repeat(width - bin.length) + bin);

// 取反 (逐位翻转), 长度不变
const invertBits = (bin: string): string => bin.split('').map((c) => (c === '0' ? '1' : '0')).join('');

const hexText = (bin: string): string => {
  // 二进制串 (bit 数任意) -> 十六进制 (不足 4 位按 4 位对齐高位补 0)
  const pad4 = bin.length % 4 === 0 ? bin : '0'.repeat(4 - (bin.length % 4)) + bin;
  let hex = '';
  for (let i = 0; i < pad4.length; i += 4) {
    hex += parseInt(pad4.slice(i, i + 4), 2).toString(16).toUpperCase();
  }
  return hex;
};

export type EncodeOut =
  | { ok: true; sm: string; oc: string; tc: string; tcHex: string; smOcUnavailable: boolean }
  | { ok: false; error: string };

// 十进制整数 -> 原码(sm) / 反码(oc) / 补码(tc) 的 N 位二进制串 + 补码十六进制
export const encodeNumber = (text: string, bits: number): EncodeOut => {
  if (!Number.isInteger(bits) || bits < MIN_BITS || bits > MAX_BITS) {
    return { ok: false, error: `位宽需在 ${MIN_BITS}~${MAX_BITS} 之间` };
  }
  const t = text.trim();
  if (!/^[+-]?\d+$/.test(t)) return { ok: false, error: '请输入十进制整数' };
  const n = BigInt(t);
  if (n < minSigned(bits) || n > maxSigned(bits)) {
    return { ok: false, error: `超出 ${bits} 位有符号范围 [${signedRangeText(bits)}]` };
  }

  if (n >= 0n) {
    // 正数: 原码 = 反码 = 补码
    const bin = padBin(n.toString(2), bits);
    return { ok: true, sm: bin, oc: bin, tc: bin, tcHex: hexText(bin), smOcUnavailable: false };
  }

  const abs = -n;
  const absMax = maxSigned(bits); // 2^(N-1)-1: 原码/反码可表示的最大绝对值
  const smOcUnavailable = abs > absMax; // 仅 -2^(N-1) 时出现 (原码/反码无 -0 场景下的最小边界)

  const mag = padBin(abs.toString(2), bits - 1); // 数值位 (bits-1)
  const sm = smOcUnavailable ? '' : '1' + mag;
  const oc = smOcUnavailable ? '' : '1' + invertBits(mag);
  const tc = (twoPow(bits) + n).toString(2); // 2^N - |n|, 恰好 N 位
  return { ok: true, sm, oc, tc, tcHex: hexText(tc), smOcUnavailable };
};

export type DecodeKind = 'sm' | 'oc' | 'tc' | 'hex';

export type DecodeOut =
  | { ok: true; decimal: string; binary: string; hex: string }
  | { ok: false; error: string };

// N 位编码串 -> 十进制 (kind: sm 原码 / oc 反码 / tc 补码 / hex 补码十六进制)
export const decodeNumber = (text: string, bits: number, kind: DecodeKind): DecodeOut => {
  if (!Number.isInteger(bits) || bits < MIN_BITS || bits > MAX_BITS) {
    return { ok: false, error: `位宽需在 ${MIN_BITS}~${MAX_BITS} 之间` };
  }
  const t = text.trim().replace(/[\s_]/g, '');
  if (t === '') return { ok: false, error: '请输入编码内容' };

  let bin: string;
  if (kind === 'hex') {
    const h = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
    if (!/^[0-9a-fA-F]+$/.test(h)) return { ok: false, error: '请输入十六进制数' };
    if (h.length * 4 > bits) return { ok: false, error: `超出 ${bits} 位宽 (最多 ${Math.ceil(bits / 4)} 位十六进制)` };
    bin = padBin(BigInt('0x' + h).toString(2), bits);
  } else {
    if (!/^[01]+$/.test(t)) return { ok: false, error: '请输入二进制串 (0/1)' };
    if (t.length > bits) return { ok: false, error: `超出 ${bits} 位宽 (最多 ${bits} 位二进制)` };
    bin = padBin(t, bits);
  }

  let decimal: bigint;
  const signBit = bin[0];
  const magnitude = bin.slice(1); // bits-1 位数值位

  switch (kind) {
    case 'tc':
    case 'hex': {
      const v = BigInt('0b' + bin);
      decimal = signBit === '1' ? v - twoPow(bits) : v;
      break;
    }
    case 'sm': {
      const magV = BigInt('0b' + magnitude);
      decimal = signBit === '1' ? -magV : magV;
      break;
    }
    case 'oc': {
      const magV = BigInt('0b' + magnitude);
      // 反码: 负数 = -(2^(N-1)-1 - 数值位值)
      decimal = signBit === '1' ? -(maxSigned(bits) - magV) : magV;
      break;
    }
  }
  return { ok: true, decimal: decimal.toString(), binary: bin, hex: hexText(bin) };
};
