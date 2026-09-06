// 反转字符串
export const reverseString = (str :string) :string => {
    return str.split('').reverse().join('');    // or reverse(str.split(''))
}

// 转字符串 (UTF-8 解码, 非法字节容错替换)
export const Uint8ArrayToString = (data :Uint8Array) :string => {
  return new TextDecoder('utf-8').decode(data);
}

// 字符串转Uint8Array (UTF-8 编码; 原 charCodeAt 实现会截断中文等高位字节)
export const stringToUint8Array = (str :string) :Uint8Array => {
  return new TextEncoder().encode(str);
}
