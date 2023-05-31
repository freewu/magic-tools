// 数据转成 AntD Select 支持的数据格式 { label: "xxx", value: "xxx" }
export function arrayToOptions(arr :Array<any>) :Array<{label :string,value :string}> {
  return arr.map( (item ,index) => { return { label: item ,value:item} });
}