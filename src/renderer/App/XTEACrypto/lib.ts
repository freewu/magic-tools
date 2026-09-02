import { utf8ToBytes, pkcs7Pad, pkcs7Unpad } from "../../lib/codec";

// XTEA (eXtended Tiny Encryption Algorithm) 分组加密算法
// 参考实现: https://en.wikipedia.org/wiki/XTEA (与 PHP mcrypt xtea 兼容)
// 说明: 8 字节分组 + ECB 模式 + PKCS7 填充, 128 位密钥(16字节), 默认 32 轮

const DEFAULT_CODE_ITEM = 'xtea-crypto:default-code';

// 获取默认编码 HEX / Base64
export function getDefaultCode() :string  {
  const code = localStorage.getItem(DEFAULT_CODE_ITEM);
  return (code === null)? "Base64" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultCode(code: string) : void  {
  localStorage.setItem(DEFAULT_CODE_ITEM,code);
}

const DEFAULT_PASSPHRASE_ITEM = 'xtea-crypto:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE_ITEM);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE_ITEM,passphrase);
}

const DEFAULT_ROUND_ITEM = 'xtea-crypto:default-round';

// 获取默认轮数
export function getDefaultRound() :string  {
  const round = localStorage.getItem(DEFAULT_ROUND_ITEM);
  return (round === null)? "32" : round;
}

// 设置默认轮数
export function setDefaultRound(round: string) : void  {
  localStorage.setItem(DEFAULT_ROUND_ITEM,round);
}

// 根据输入的密钥长度生成密钥长度提示 (XTEA 密钥长度固定 16 字节)
export const genPassphraseLimitLength = (length :number) :number => {
  return 16;
}

const DELTA = 0x9e3779b9;

// 16 字节密钥(不足补 0, 超出截断)转为 4 个 32 位大端字
const toKeyWords = (key :Uint8Array) :number[] => {
  const words = [0, 0, 0, 0];
  for(let i = 0; i < 16; i++) {
    const v = (i < key.length)? key[i] : 0;
    words[i >> 2] = (words[i >> 2] << 8) | v;
  }
  return words.map((w) => w >>> 0);
}

// 加密 8 字节数据块 (v0 / v1 两个 32 位大端字)
const encryptBlock = (v0 :number, v1 :number, key :number[], rounds :number) :[number, number] => {
  let sum = 0;
  const limit = (DELTA * rounds) >>> 0;
  while(sum !== limit) {
    v0 = (v0 + ((((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + key[sum & 3]))) >>> 0;
    sum = (sum + DELTA) >>> 0;
    v1 = (v1 + ((((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + key[(sum >>> 11) & 3]))) >>> 0;
  }
  return [v0 >>> 0, v1 >>> 0];
}

// 解密 8 字节数据块
const decryptBlock = (v0 :number, v1 :number, key :number[], rounds :number) :[number, number] => {
  let sum = (DELTA * rounds) >>> 0;
  while(sum !== 0) {
    v1 = (v1 - ((((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + key[(sum >>> 11) & 3]))) >>> 0;
    sum = (sum - DELTA) >>> 0;
    v0 = (v0 - ((((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + key[sum & 3]))) >>> 0;
  }
  return [v0 >>> 0, v1 >>> 0];
}

// xtea 加密 (数据不足 8 字节会自动 PKCS7 填充, 返回加密后的字节)
export const xteaEncrypt = (data :Uint8Array, key :Uint8Array, rounds :number) :Uint8Array => {
  const words = toKeyWords(key);
  const padded = pkcs7Pad(data, 8);
  const result = new Uint8Array(padded.length);
  for(let i = 0; i < padded.length; i += 8) {
    const v0 = ((padded[i] << 24) | (padded[i + 1] << 16) | (padded[i + 2] << 8) | padded[i + 3]) >>> 0;
    const v1 = ((padded[i + 4] << 24) | (padded[i + 5] << 16) | (padded[i + 6] << 8) | padded[i + 7]) >>> 0;
    const [ c0, c1 ] = encryptBlock(v0, v1, words, rounds);
    result[i] = (c0 >>> 24) & 0xff;
    result[i + 1] = (c0 >>> 16) & 0xff;
    result[i + 2] = (c0 >>> 8) & 0xff;
    result[i + 3] = c0 & 0xff;
    result[i + 4] = (c1 >>> 24) & 0xff;
    result[i + 5] = (c1 >>> 16) & 0xff;
    result[i + 6] = (c1 >>> 8) & 0xff;
    result[i + 7] = c1 & 0xff;
  }
  return result;
}

// xtea 解密 (自动去除 PKCS7 填充, 密钥/填充不合法时抛异常)
export const xteaDecrypt = (data :Uint8Array, key :Uint8Array, rounds :number) :Uint8Array => {
  if(data.length === 0 || data.length % 8 !== 0) {
    throw new Error('解密内容长度不是 8 的整数倍');
  }
  const words = toKeyWords(key);
  const result = new Uint8Array(data.length);
  for(let i = 0; i < data.length; i += 8) {
    const v0 = ((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]) >>> 0;
    const v1 = ((data[i + 4] << 24) | (data[i + 5] << 16) | (data[i + 6] << 8) | data[i + 7]) >>> 0;
    const [ p0, p1 ] = decryptBlock(v0, v1, words, rounds);
    result[i] = (p0 >>> 24) & 0xff;
    result[i + 1] = (p0 >>> 16) & 0xff;
    result[i + 2] = (p0 >>> 8) & 0xff;
    result[i + 3] = p0 & 0xff;
    result[i + 4] = (p1 >>> 24) & 0xff;
    result[i + 5] = (p1 >>> 16) & 0xff;
    result[i + 6] = (p1 >>> 8) & 0xff;
    result[i + 7] = p1 & 0xff;
  }
  return pkcs7Unpad(result, 8);
}

// 字符串便捷加密 (key 为 16 字节密钥文本, rounds 轮数, 返回字节)
export const xteaEncryptText = (data :string, key :string, rounds :number) :Uint8Array => {
  return xteaEncrypt(utf8ToBytes(data), utf8ToBytes(key), rounds);
}

// 字符串便捷解密
export const xteaDecryptText = (data :string, key :string, rounds :number) :Uint8Array => {
  return xteaDecrypt(utf8ToBytes(data), utf8ToBytes(key), rounds);
}
