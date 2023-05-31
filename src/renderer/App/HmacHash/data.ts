// 默认的空结果
const emptyResult :HashResult = {
  "md5": "",
  "sha1": "",
  "sha3": "",
  "sha256": "",
  "sha512": "",
};

// hash 计算结果结构定义
type HashResult = {
  "md5": string,
  "sha1": string,
  "sha3": string,
  "sha256": string,
  "sha512": string,
}

export {
  emptyResult,
  HashResult
}