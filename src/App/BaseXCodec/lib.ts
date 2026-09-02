import { Uint8ArrayToString, stringToUint8Array } from "../../lib/string"
import { codeMap } from "./data"

// 编码处理
export const BaseXEncode = (str :string, code :string) :string => {
  const bsx = require('base-x')(codeMap.get(code));
  console.log(codeMap.get(code));
  return bsx.encode(stringToUint8Array(str));
}

// 解码处理
export const BaseXDecode = (str :string,code :string) :string => {
  const bsx = require('base-x')(codeMap.get(code));
  return Uint8ArrayToString(bsx.decode(str));
} 

const DEFAULT_CODE = 'base-x:default-code';

// 获取默认编码
export function getDefaultCode() :string  {
    const code = localStorage.getItem(DEFAULT_CODE);
    return (code === null)? "Base32" : code;
}

// 设置默认编码
export function setDefaultCode(code: string) : void  {
    localStorage.setItem(DEFAULT_CODE,code);
}