// Punycode 编解码 (RFC 3492)
// 纯 TypeScript 实现, 无第三方依赖; 输出/输入均为 ASCII 标签级编码 (不含 xn-- 前缀),
// 域名级转换由 encodeText/decodeText 处理 (按 '.' 分段, 非 ASCII 段加/去 xn-- 前缀)
// 参考向量 (与 punycode.js 2.3.1 一致):
//   'bücher' -> 'bcher-kva'   '中文' -> 'fiq228c'   '💩' -> 'ls8h'   '☃-⌘' -> '--dqo34k'

const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128;
const delimiter = '-';

// 数字 (0-35) -> ASCII 字符 (a-z0-9)
const digitToBasic = (digit :number) :number => {
  return digit + 22 + 75 * (digit < 26 ? 1 : 0);
}

// ASCII 字符 -> 数字 (0-35); 非法返回 base (36)
const basicToDigit = (code :number) :number => {
  if (code - 48 >= 0 && code - 48 < 10) return code - 22;  // 0-9
  if (code - 65 >= 0 && code - 65 < 26) return code - 65;  // A-Z
  if (code - 97 >= 0 && code - 97 < 26) return code - 97;  // a-z
  return base;
}

const adapt = (delta :number, numPoints :number, firstTime :boolean) :number => {
  let k = 0;
  let d = firstTime ? Math.floor(delta / damp) : Math.floor(delta / 2);
  d += Math.floor(d / numPoints);
  while (d > Math.floor(((base - tMin) * tMax) / 2)) {
    d = Math.floor(d / (base - tMin));
    k += base;
  }
  return k + Math.floor(((base - tMin + 1) * d) / (d + skew));
}

// Unicode 文本 (单个标签) -> Punycode ASCII (不含 xn-- 前缀)
export const punycodeEncode = (input :string) :string => {
  const codePoints = Array.from(input).map((ch) => ch.codePointAt(0) as number);
  const inputLength = codePoints.length;
  let output = '';
  let handled = 0;
  // 基础字符 (ASCII) 原样输出
  for (let i = 0; i < inputLength; i++) {
    if (codePoints[i] < 0x80) {
      output += String.fromCharCode(codePoints[i]);
      handled++;
    }
  }
  const basicLength = handled;
  if (basicLength > 0) output += delimiter;
  let n = initialN;
  let delta = 0;
  let bias = initialBias;
  while (handled < inputLength) {
    // 找到第一个未处理的最小码点
    let m = 0x7fffffff;
    for (let i = 0; i < inputLength; i++) {
      const cp = codePoints[i];
      if (cp >= n && cp < m) m = cp;
    }
    if (m === 0x7fffffff) break;
    delta += (m - n) * (handled + 1);
    n = m;
    for (let i = 0; i < inputLength; i++) {
      const cp = codePoints[i];
      if (cp < n) {
        delta++;
      } else if (cp === n) {
        let q = delta;
        for (let k = base; ; k += base) {
          const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
          if (q < t) break;
          output += String.fromCharCode(digitToBasic(t + ((q - t) % (base - t))));
          q = Math.floor((q - t) / (base - t));
        }
        output += String.fromCharCode(digitToBasic(q));
        bias = adapt(delta, handled + 1, handled === basicLength);
        delta = 0;
        handled++;
      }
    }
    delta++;
    n++;
  }
  return output;
}

// Punycode ASCII (单个标签, 不含 xn-- 前缀) -> Unicode 文本
export const punycodeDecode = (input :string) :string => {
  const output :string[] = [];
  // 基础段为最后一个 '-' 之前的部分 (基础段本身可能含 '-')
  let basic = input.lastIndexOf(delimiter);
  if (basic < 0) basic = 0;
  for (let j = 0; j < basic; j++) {
    const cp = input.charCodeAt(j);
    if (cp >= 0x80) throw new Error('无效的 Punycode 输入: 基础段含非 ASCII 字符');
    output.push(String.fromCharCode(cp));
  }
  let index = basic > 0 ? basic + 1 : 0;
  let i = 0;
  let n = initialN;
  let bias = initialBias;
  while (index < input.length) {
    const oldi = i;
    let w = 1;
    for (let k = base; ; k += base) {
      if (index >= input.length) throw new Error('无效的 Punycode 输入: 编码数据不完整');
      const codePoint = input.charCodeAt(index++);
      const digit = basicToDigit(codePoint);
      if (digit >= base) throw new Error(`无效的 Punycode 输入: 非法字符 "${input[index - 1]}"`);
      if (digit > Math.floor((0x7fffffff - i) / w)) throw new Error('无效的 Punycode 输入: 溢出');
      i += digit * w;
      const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
      if (digit < t) break;
      if (w > Math.floor(0x7fffffff / (base - t))) throw new Error('无效的 Punycode 输入: 溢出');
      w *= base - t;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    if (Math.floor(i / out) > 0x10ffff - n) throw new Error('无效的 Punycode 输入: 码点越界');
    n += Math.floor(i / out);
    i %= out;
    output.splice(i, 0, String.fromCodePoint(n));
    i++;
  }
  return output.join('');
}

// 是否包含非 ASCII 字符
const hasNonAscii = (text :string) :boolean => /[^\x00-\x7F]/.test(text);

// Unicode 文本 -> Punycode 文本 (整段域名/单标签均可, 非 ASCII 段加 xn-- 前缀)
export const encodeText = (input :string) :string => {
  return input.split('.').map((label) => {
    return hasNonAscii(label) ? 'xn--' + punycodeEncode(label) : label;
  }).join('.');
}

// Punycode 文本 -> Unicode 文本 (支持带/不带 xn-- 前缀, 整段域名按 '.' 分段解码)
export const decodeText = (input :string) :string => {
  return input.split('.').map((label) => {
    if (/^xn--/i.test(label)) {
      const body = label.slice(4);
      return punycodeDecode(body);
    }
    // 形如 mnchen-3ya 的纯 Punycode 段 (含 '-'), 尝试解码失败时保持原样
    if (label.indexOf(delimiter) > 0 && /^[a-zA-Z0-9-]+$/.test(label)) {
      try {
        return punycodeDecode(label);
      } catch {
        return label;
      }
    }
    return label;
  }).join('.');
}
