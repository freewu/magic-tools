// 反转字符串
export const reverseString = (str :string) :string => {
    return str.split('').reverse().join('');    // or reverse(str.split(''))
}

// 转字符串
export const Uint8ArrayToString = (data :Uint8Array) :string => {
  let arr = [];
  for (var i = 0; i < data.length; i++) {
    arr.push(String.fromCharCode(data[i]))
  }
  return arr.join('');
}

// 字符串转Uint8Array
export const stringToUint8Array = (str :string) :Uint8Array => {
  let arr = [];
  for (var i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }
  let tmpUint8Array = new Uint8Array(arr);
  return tmpUint8Array
}
