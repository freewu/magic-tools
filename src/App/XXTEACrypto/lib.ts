import { utf8ToBytes } from "../../lib/codec";

// XXTEA (Corrected Block TEA) 分组加密算法
// 参考实现: https://github.com/xxtea/xxtea-js (Ma Bingyao, 与官方 C 实现互通)
// 说明: 不定长分组(4字节对齐) + ECB 模式, 128 位密钥(16字节), 循环次数固定 (6 + 52 / 词数)

const DEFAULT_CODE_ITEM = 'xxtea-crypto:default-code';

// 获取默认编码 HEX / Base64
export function getDefaultCode() :string  {
  const code = localStorage.getItem(DEFAULT_CODE_ITEM);
  return (code === null)? "Base64" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultCode(code: string) : void  {
  localStorage.setItem(DEFAULT_CODE_ITEM,code);
}

const DEFAULT_PASSPHRASE_ITEM = 'xxtea-crypto:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE_ITEM);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE_ITEM,passphrase);
}

// 根据输入的密钥长度生成密钥长度提示 (XXTEA 密钥长度固定 16 字节)
export const genPassphraseLimitLength = (length :number) :number => {
  return 16;
}

const DELTA = 0x9E3779B9;

// 转 32 位有符号整数 (与 xxtea-js 的 int32 一致)
const int32 = (value :number) :number => {
  return value & 0xFFFFFFFF;
}

// 字节数组转 32 位字数组 (小端), includeLength 为 true 时末尾附加原始长度作为标记
const toWords = (bytes :Uint8Array, includeLength :boolean) :number[] => {
  const length = bytes.length;
  let wordCount = length >> 2;
  if((length & 3) !== 0) {
    ++wordCount;
  }
  const words = (includeLength)? new Array(wordCount + 1).fill(0) : new Array(wordCount).fill(0);
  if(includeLength) {
    words[wordCount] = length;
  }
  for(let i = 0; i < length; i++) {
    words[i >> 2] |= bytes[i] << ((i & 3) << 3);
  }
  return words;
}

// 32 位字数组转字节数组 (小端), includeLength 为 true 时校验末尾长度标记并截断; 不合法时返回 null
const toBytes = (words :number[], includeLength :boolean) :Uint8Array | null => {
  const length = words.length;
  let n = length << 2;
  if(includeLength) {
    const m = words[length - 1];
    n -= 4;
    if((m < n - 3) || (m > n)) {
      return null;
    }
    n = m;
  }
  const result = new Uint8Array(length << 2);
  for(let i = 0; i < length; i++) {
    result[i * 4] = words[i] & 0xFF;
    result[i * 4 + 1] = (words[i] >>> 8) & 0xFF;
    result[i * 4 + 2] = (words[i] >>> 16) & 0xFF;
    result[i * 4 + 3] = (words[i] >>> 24) & 0xFF;
  }
  return (includeLength)? result.slice(0, n) : result;
}

// XXTEA 核心变换 MX
const mx = (sum :number, y :number, z :number, p :number, e :number, key :number[]) :number => {
  return ((z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4)) ^ ((sum ^ y) + (key[(p & 3) ^ e] ^ z));
}

// 加密词数组 (v 末尾已包含长度标记)
const encryptWords = (v :number[], key :number[]) :number[] => {
  const length = v.length;
  const n = length - 1;
  let y :number, z = v[n], sum = 0, e :number, p :number;
  const q = (Math.floor(6 + 52 / length)) | 0;
  for(let i = q; i > 0; i--) {
    sum = int32(sum + DELTA);
    e = (sum >>> 2) & 3;
    for(p = 0; p < n; p++) {
      y = v[p + 1];
      z = v[p] = int32(v[p] + mx(sum, y, z, p, e, key));
    }
    y = v[0];
    z = v[n] = int32(v[n] + mx(sum, y, z, n, e, key));
  }
  return v;
}

// 解密词数组
const decryptWords = (v :number[], key :number[]) :number[] => {
  const length = v.length;
  const n = length - 1;
  let y = v[0], z :number, sum :number, e :number, p :number;
  const q = (Math.floor(6 + 52 / length)) | 0;
  for(sum = int32(q * DELTA); sum !== 0; sum = int32(sum - DELTA)) {
    e = (sum >>> 2) & 3;
    for(p = n; p > 0; p--) {
      z = v[p - 1];
      y = v[p] = int32(v[p] - mx(sum, y, z, p, e, key));
    }
    z = v[n];
    y = v[0] = int32(v[0] - mx(sum, y, z, 0, e, key));
  }
  return v;
}

// 16 字节密钥(不足补 0, 超出截断)转为 4 个 32 位小端字
const toKeyWords = (key :Uint8Array) :number[] => {
  const fixed = new Uint8Array(16);
  fixed.set(key.slice(0, 16));
  return toWords(fixed, false);
}

// xxtea 加密 (返回加密后的字节)
export const xxteaEncrypt = (data :Uint8Array, key :Uint8Array) :Uint8Array => {
  const words = toWords(data, true);
  const encrypted = encryptWords(words, toKeyWords(key));
  return toBytes(encrypted, false) as Uint8Array;
}

// xxtea 解密 (密文不合法时抛异常)
export const xxteaDecrypt = (data :Uint8Array, key :Uint8Array) :Uint8Array => {
  if(data.length < 8) {
    throw new Error('解密内容长度不合法');
  }
  const decrypted = decryptWords(toWords(data, false), toKeyWords(key));
  const result = toBytes(decrypted, true);
  if(result === null) {
    throw new Error('解密失败, 密文数据不合法');
  }
  return result;
}

// 字符串便捷加密 (key 为 16 字节密钥文本, 返回字节)
export const xxteaEncryptText = (data :string, key :string) :Uint8Array => {
  return xxteaEncrypt(utf8ToBytes(data), utf8ToBytes(key));
}

// 字符串便捷解密
export const xxteaDecryptText = (data :string, key :string) :Uint8Array => {
  return xxteaDecrypt(utf8ToBytes(data), utf8ToBytes(key));
}
