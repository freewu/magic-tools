// 转换的结果
export type ConvertResult = {
  data: string, // 转换成功返回转换的内容 转换失败返回转换失败的原因
  error: boolean, // 转换是否出错 true  出错 / false 转换成功
}