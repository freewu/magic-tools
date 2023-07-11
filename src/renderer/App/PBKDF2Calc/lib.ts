import * as CryptoJS from 'crypto-js';

// 获取指定的 Hash 算法
export const getHashAlgo = (hash :string) => {
  switch(hash) {
    case 'MD5': return CryptoJS.algo.MD5;
    case 'SHA1': return CryptoJS.algo.SHA1;
    case 'SHA3': return CryptoJS.algo.SHA3;
    case 'SHA224': return CryptoJS.algo.SHA224;
    case 'SHA256': return CryptoJS.algo.SHA256;
    case 'SHA384': return CryptoJS.algo.SHA384;
    case 'SHA512': return CryptoJS.algo.SHA512;
    case 'RIPEMD160': return CryptoJS.algo.RIPEMD160;
  }
  return CryptoJS.algo.SHA256;
}

const DEFAULT_HASH_ALGO = 'pbkdf2-calc:default-hash-algo';

// 获取默认 Hash 算法
export const getDefaultHashAlgo = () :string => {
  const algo = localStorage.getItem(DEFAULT_HASH_ALGO);
  return (algo === null)? "SHA256" : algo;
}

// 设置默认 Hash 算法
export function setDefaultHashAlgo(algo: string) :void  {
  localStorage.setItem(DEFAULT_HASH_ALGO,algo);
}

const DEFAULT_SALT = 'pbkdf2-calc:default-salt';

// 获取默认盐值
export function getDefaultSalt() :string {
  const salt = localStorage.getItem(DEFAULT_SALT);
  return (salt === null)? "" : salt;
}

// 设置默认偏移量
export function setDefaultSalt(salt: string) :void  {
  localStorage.setItem(DEFAULT_SALT, salt);
}

const DEFAULT_ITERATION = 'pbkdf2-calc:default-iteration';

// 获取默认迭代次数
export function getDefaultIteration() :number {
  const iter = localStorage.getItem(DEFAULT_ITERATION);
  return (iter === null)? 1000 : parseInt(iter); // 推荐 1000 + 
}

// 设置默认迭代次数
export function setDefaultIteration(iter: number) :void {
  localStorage.setItem(DEFAULT_ITERATION, iter.toString());
}

const DEFAULT_KEY_LENGTH = 'pbkdf2-calc:default-key-length';

// 获取默认推导密钥的长度 
export function getDefaultKeyLength() :number {
  const len = localStorage.getItem(DEFAULT_KEY_LENGTH);
  return (len === null)? 128 : parseInt(len); // 建议  128 / 256 / 512
}

// 设置默认推导密钥的长度
export function setDefaultKeyLength(len: number) :void {
  localStorage.setItem(DEFAULT_KEY_LENGTH, len.toString());
}

export const genValuePlaceholder = (algo :string) => {
  return "输入需要计算 PBKDF2-" + algo + " 值的内容 或 拖拽文件到框内打开";
}

const DEFAULT_SHOW_UPPERCASE = 'pbkdf2-calc:default-show-uppercase';

// 获取默认是否大写展示
export function getDefaultShowUppercase() :boolean  {
  const show = localStorage.getItem(DEFAULT_SHOW_UPPERCASE);
  return (show === null)? false : (show === 'false')? false : true;
}

// 设置默认是否大写展示
export function setDefaultShowUppercase(show: boolean) : void  {
  localStorage.setItem(DEFAULT_SHOW_UPPERCASE, show + '');
}
