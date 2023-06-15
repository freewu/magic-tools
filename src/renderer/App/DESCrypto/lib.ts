const DEFAULT_MODE_ITEM = 'des-crypto:default-mode';

// 获取默认模式
export function getDefaultMode() :string  {
  const mode = localStorage.getItem(DEFAULT_MODE_ITEM);
  return (mode === null)? "CBC" : mode;
}

// 设置默认模式
export function setDefaultMode(mode: string) : void  {
  localStorage.setItem(DEFAULT_MODE_ITEM,mode);
}

const DEFAULT_PADDING_ITEM = 'des-crypto:default-padding';

// 获取默认填充
export function getDefaultPadding() :string  {
  const padding = localStorage.getItem(DEFAULT_PADDING_ITEM);
  return (padding === null)? "Pkcs7" : padding;
}

// 设置默认填充
export function setDefaultPadding(padding: string) : void  {
  localStorage.setItem(DEFAULT_PADDING_ITEM,padding);
}

const DEFAULT_CODE_ITEM = 'des-crypto:default-code';

// 获取默认编码 HEX / Base64
export function getDefaultCode() :string  {
  const code = localStorage.getItem(DEFAULT_CODE_ITEM);
  return (code === null)? "Base64" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultCode(code: string) : void  {
  localStorage.setItem(DEFAULT_CODE_ITEM,code);
}

const DEFAULT_IV_ITEM = 'des-crypto:default-iv';

// 获取默认偏移量
export function getDefaultIV() :string  {
  const iv = localStorage.getItem(DEFAULT_IV_ITEM);
  return (iv === null)? "" : iv;
}

// 设置默认偏移量
export function setDefaultIV(iv: string) : void  {
  localStorage.setItem(DEFAULT_IV_ITEM,iv);
}


const DEFAULT_PASSPHRASE_ITEM = 'des-crypto:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE_ITEM);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE_ITEM,passphrase);
}

// 根据输入的密钥长度生成密钥长度提示
export const genPassphraseLimitLength = (length :number) :number => {
  return 8; // DES 密钥长度 8位
}


import * as CryptoJS from 'crypto-js';
// import { BlockCipherMode } from 'crypto-js/';

// 获取模式
export const getMode = (mode :string) => {
  switch(mode) {
    case "CFB": return CryptoJS.mode.CFB;
    case "OFB": return CryptoJS.mode.OFB;
    case "ECB": return CryptoJS.mode.ECB;
    case "CTR": return CryptoJS.mode.CTR;
    case "CTRGladman": return CryptoJS.mode.CTRGladman;
  }
  return CryptoJS.mode.CBC
}

// 获取填充
export const getPadding = (padding :string) => {
  switch(padding) {
    case "AnsiX923": return CryptoJS.pad.AnsiX923;
    case "Iso10126": return CryptoJS.pad.Iso10126;
    case "Iso97971": return CryptoJS.pad.Iso97971;
    case "ZeroPadding": return CryptoJS.pad.ZeroPadding;
    case "NoPadding": return CryptoJS.pad.NoPadding;
  }
  return CryptoJS.pad.Pkcs7
}



