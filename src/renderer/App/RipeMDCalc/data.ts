// 默认的空结果
const emptyResult :RipeMDResult = {
  "ripemd160": "",
  "ripemd128": "",
  "ripemd256": "",
  "ripemd320": "",
};

// hash 计算结果结构定义
type RipeMDResult = {
  "ripemd160": string,
  "ripemd128": string,
  "ripemd256": string,
  "ripemd320": string,
}

export {
  emptyResult,
  RipeMDResult
}