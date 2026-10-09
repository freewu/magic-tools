// 祖冲之序列密码 (ZUC) — 纯逻辑部分
//
// 本文件 **不引用 wasm** (wasm 资源加载见 zuc.ts, C ABI 封装见 zuc-engine.ts),
// 因此可被页面、设置中心与单元测试直接使用。

import { bytesToBase64, bytesToHex, base64ToBytes, hexToBytes } from "../../lib/codec";

export type ZucAlgorithm = 'ZUC-128' | 'ZUC-256';
export type ZucCode = 'HEX' | 'Base64';

/** 两种算法的密钥 / IV 长度 (字节) 与所依据的标准 (与 zuc crate 的接口一致) */
export const ZUC_PARAMS :Record<ZucAlgorithm, { keyLen :number; ivLen :number; spec :string }> = {
  // GB/T 33133.1-2016 (128-EEA3): 密钥 128 位, IV 128 位
  'ZUC-128': { keyLen: 16, ivLen: 16, spec: 'GB/T 33133.1-2016' },
  // ZUC256-version1.1: 密钥 256 位, IV 184 位
  'ZUC-256': { keyLen: 32, ivLen: 23, spec: 'ZUC256-version1.1' },
};

// 算法是否合法 (来自 localStorage / Select 的值都过一遍, 避免脏数据)
export const isAlgorithm = (value :string) :value is ZucAlgorithm =>
  value === 'ZUC-128' || value === 'ZUC-256';

// 编码是否合法
export const isCode = (value :string) :value is ZucCode =>
  value === 'HEX' || value === 'Base64';

// 密钥 / IV 长度 (字节), 供页面与设置中心做定长校验
export const keyLenOf = (algorithm :ZucAlgorithm) :number => ZUC_PARAMS[algorithm].keyLen;
export const ivLenOf = (algorithm :ZucAlgorithm) :number => ZUC_PARAMS[algorithm].ivLen;

const DEFAULT_ALGORITHM_ITEM = 'zuc-crypto:default-algorithm';
const DEFAULT_CODE_ITEM = 'zuc-crypto:default-code';
const DEFAULT_KEY_ITEM = 'zuc-crypto:default-key';
const DEFAULT_IV_ITEM = 'zuc-crypto:default-iv';

// 获取默认算法 (ZUC-128 / ZUC-256), 缺省 ZUC-128
export function getDefaultAlgorithm() :ZucAlgorithm {
  const value = localStorage.getItem(DEFAULT_ALGORITHM_ITEM);
  return (value !== null && isAlgorithm(value))? value : 'ZUC-128';
}

// 设置默认算法
export function setDefaultAlgorithm(algorithm :string) :void {
  localStorage.setItem(DEFAULT_ALGORITHM_ITEM, isAlgorithm(algorithm)? algorithm : 'ZUC-128');
}

// 获取默认编码 (HEX / Base64), 缺省 HEX (ZUC 的密钥与密文通常是十六进制)
export function getDefaultCode() :ZucCode {
  const value = localStorage.getItem(DEFAULT_CODE_ITEM);
  return (value !== null && isCode(value))? value : 'HEX';
}

// 设置默认编码
export function setDefaultCode(code :string) :void {
  localStorage.setItem(DEFAULT_CODE_ITEM, isCode(code)? code : 'HEX');
}

// 获取默认密钥 (HEX 字符串)
export function getDefaultKey() :string {
  const value = localStorage.getItem(DEFAULT_KEY_ITEM);
  return (value === null)? "" : value;
}

// 设置默认密钥
export function setDefaultKey(key :string) :void {
  localStorage.setItem(DEFAULT_KEY_ITEM, key);
}

// 获取默认偏移量 IV (HEX 字符串)
export function getDefaultIV() :string {
  const value = localStorage.getItem(DEFAULT_IV_ITEM);
  return (value === null)? "" : value;
}

// 设置默认偏移量 IV
export function setDefaultIV(iv :string) :void {
  localStorage.setItem(DEFAULT_IV_ITEM, iv);
}

// 去掉常见分隔符 (空格 / 冒号 / 短横线 / 逗号) 与 0x 前缀, 并统一转小写
export const normalizeHex = (raw :string) :string =>
  raw.replace(/0[xX]/g, '').replace(/[\s:,\-_]/g, '').toLowerCase();

// 定长 HEX 校验失败的原因
export type HexIssue = 'empty' | 'nonhex' | 'odd' | 'length';

export type HexCheck = {
  /** 是否通过定长校验 */
  ok :boolean;
  /** 首个失败原因 (通过时为 null) */
  issue :HexIssue | null;
  /** 规范化 (去分隔符 / 转小写) 后的 HEX */
  hex :string;
  /** 实际字节数 */
  gotBytes :number;
  /** 需要的字节数 */
  needBytes :number;
  /** 校验通过时的字节内容 */
  bytes :Uint8Array | null;
};

/**
 * 校验「定长 HEX」(密钥 / IV 共用):
 * 依次判定 空 / 含非十六进制字符 / 半字节 (奇数长度) / 长度不符, 通过后给出字节内容。
 */
export const checkFixedHex = (raw :string, needBytes :number) :HexCheck => {
  const hex = normalizeHex(raw);
  const base = { hex, gotBytes: Math.floor(hex.length / 2), needBytes, bytes: null };
  if (hex === '') return { ...base, ok: false, issue: 'empty' };
  if (!/^[0-9a-f]*$/.test(hex)) return { ...base, ok: false, issue: 'nonhex' };
  if (hex.length % 2 !== 0) return { ...base, ok: false, issue: 'odd' };
  if (hex.length !== needBytes * 2) return { ...base, ok: false, issue: 'length' };
  return { ...base, ok: true, issue: null, bytes: hexToBytes(hex) };
};

// 生成指定字节数的随机密钥 / IV (HEX); 宿主无安全随机数时返回空串
export const randomHex = (bytes :number) :string => {
  const crypto = globalThis.crypto;
  if (!crypto || typeof crypto.getRandomValues !== 'function') return '';
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return bytesToHex(buffer);
};

// 字节 -> 文本 (HEX / Base64)
export const encodeBytes = (bytes :Uint8Array, code :ZucCode) :string =>
  (code === 'HEX')? bytesToHex(bytes) : bytesToBase64(bytes);

// 文本 -> 字节 (HEX 会先去掉分隔符, Base64 会先去掉空白; 非法内容抛异常)
export const decodeBytes = (text :string, code :ZucCode) :Uint8Array =>
  (code === 'HEX')? hexToBytes(normalizeHex(text)) : base64ToBytes(text.replace(/\s+/g, ''));
