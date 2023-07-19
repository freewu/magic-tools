// 默认的空结果
const emptyResult :HashResult = {
  "md5": "",
  "md516": "",
  "sha1": "",
  "sha3": "",
  "sha256": "",
  "sha512": "",
  "sha224": "",
  "sha384": "",
  "ripemd160": "",
};

// hash 计算结果结构定义
type HashResult = {
  "md5": string,
  "md516": string,
  "sha1": string,
  "sha3": string,
  "sha256": string,
  "sha512": string,
  "sha224": string,
  "sha384": string,
  "ripemd160": string,
}

export {
  emptyResult,
  HashResult
}