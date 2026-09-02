// 转成可读字节  1024 => 1 KB  2 * 1024 * 1024 => 2 MB
export const bytesToSize = (bytes :number) :string => {
  if (bytes === 0) return '0 B';
  let k = 1024,
  sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
  i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)). toFixed(2) + ' ' + sizes[i];
}

// 转换成字节数据  (1,KB) => 1024  (2,MB) => 2 * 1024 * 1024  
export const convertToByte = (num :number,type :string) :number => {  
  switch(type.toUpperCase()) {
    case "B": return num;
    case "KB": return num * 1024;
    case "MB": return num * 1024 * 1024;
    case "GB": return num * 1024 * 1024 * 1024;
    case "TB": return num * 1024 * 1024 * 1024 * 1024;
    case "PB": return num * 1024 * 1024 * 1024 * 1024 * 1024;
    case "EB": return num * 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
    case "ZB": return num * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
    case "YB": return num * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
  }
  return num;
}

// 转换成字节数据  (1,KB) => 1024  (2,MB) => 2 * 1024 * 1024  
export const convertFromByte = (num :number,type :string) :number => {  
  switch(type.toUpperCase()) {
    case "B": return num;
    case "KB": return num / 1024;
    case "MB": return num / 1024 / 1024;
    case "GB": return num / 1024 / 1024 / 1024;
    case "TB": return num / 1024 / 1024 / 1024 / 1024;
    case "PB": return num / 1024 / 1024 / 1024 / 1024 / 1024;
    case "EB": return num / 1024 / 1024 / 1024 / 1024 / 1024 / 1024;
    case "ZB": return num / 1024 / 1024 / 1024 / 1024 / 1024 / 1024 / 1024;
    case "YB": return num / 1024 / 1024 / 1024 / 1024 / 1024 / 1024 / 1024 / 1024;
  }
  return num;
}

const DEFAULT_TYPE = 'byte-convert:default-type';

// 获取默认类型
export function getDefaultType() :string  {
    const type = localStorage.getItem(DEFAULT_TYPE);
    return (type === null)? "GB" : type;
}

// 设置默认类型
export function setDefaultType(type: string) : void  {
    localStorage.setItem(DEFAULT_TYPE,type);
}