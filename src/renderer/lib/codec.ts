// 通用编解码工具 (TEA 系列加解密使用)
// 说明: 渲染进程没有 Node Buffer 环境, 统一使用 Uint8Array

// 字符串转 UTF-8 字节
export const utf8ToBytes = (str :string) :Uint8Array => {
  return new TextEncoder().encode(str);
}

// UTF-8 字节转字符串
export const bytesToUtf8 = (bytes :Uint8Array) :string => {
  return new TextDecoder('utf-8').decode(bytes);
}

// 字节转 HEX 字符串
export const bytesToHex = (bytes :Uint8Array) :string => {
  let hex = '';
  for(let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2,'0');
  }
  return hex;
}

// HEX 字符串转字节 (输入为空/非法时抛异常)
export const hexToBytes = (hex :string) :Uint8Array => {
  const value = hex.trim();
  if(value === '' || value.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(value)) {
    throw new Error('hex 内容不合法');
  }
  const result = new Uint8Array(value.length / 2);
  for(let i = 0; i < result.length; i++) {
    result[i] = parseInt(value.substr(i * 2, 2), 16);
  }
  return result;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// 字节转 Base64 字符串
export const bytesToBase64 = (bytes :Uint8Array) :string => {
  let result = '';
  for(let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = (i + 1 < bytes.length)? bytes[i + 1] : 0;
    const b2 = (i + 2 < bytes.length)? bytes[i + 2] : 0;
    result += BASE64_CHARS.charAt(b0 >> 2)
      + BASE64_CHARS.charAt(((b0 & 0x03) << 4) | (b1 >> 4))
      + ((i + 1 < bytes.length)? BASE64_CHARS.charAt(((b1 & 0x0f) << 2) | (b2 >> 6)) : '=')
      + ((i + 2 < bytes.length)? BASE64_CHARS.charAt(b2 & 0x3f) : '=');
  }
  return result;
}

// Base64 字符串转字节 (输入非法时抛异常, 末尾缺填充时自动补齐)
export const base64ToBytes = (base64 :string) :Uint8Array => {
  let value = base64.trim();
  if(value === '' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('base64 内容不合法');
  }
  const rest = value.length % 4;
  if(rest === 1) {
    throw new Error('base64 内容不合法');
  }
  if(rest === 2) {
    value += '==';
  } else if(rest === 3) {
    value += '=';
  }
  const result :Array<number> = [];
  let buffer = 0;
  let bits = 0;
  for(let i = 0; i < value.length; i++) {
    const c = value.charAt(i);
    if(c === '=') break;
    const index = BASE64_CHARS.indexOf(c);
    if(index === -1) throw new Error('base64 内容不合法');
    buffer = (buffer << 6) | index;
    bits += 6;
    if(bits >= 8) {
      bits -= 8;
      result.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(result);
}

// PKCS7 填充 (TEA / XTEA 等分组密码使用)
export const pkcs7Pad = (data :Uint8Array, blockSize :number) :Uint8Array => {
  const pad = blockSize - (data.length % blockSize);
  const result = new Uint8Array(data.length + pad);
  result.set(data);
  for(let i = data.length; i < result.length; i++) {
    result[i] = pad;
  }
  return result;
}

// 去除 PKCS7 填充 (填充不合法时抛异常)
export const pkcs7Unpad = (data :Uint8Array, blockSize :number) :Uint8Array => {
  if(data.length === 0 || data.length % blockSize !== 0) {
    throw new Error('解密内容长度不是 ' + blockSize + ' 的整数倍');
  }
  const pad = data[data.length - 1];
  if(pad < 1 || pad > blockSize) {
    throw new Error('解密失败, 填充数据不合法');
  }
  for(let i = data.length - pad; i < data.length; i++) {
    if(data[i] !== pad) {
      throw new Error('解密失败, 填充数据不合法');
    }
  }
  return data.slice(0, data.length - pad);
}
