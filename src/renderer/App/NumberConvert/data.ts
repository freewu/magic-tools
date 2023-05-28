// 进制类型列表
const numberTypeList = [
  { label: '二进制', value: 'BIN', placeholder: '输入 0-1 格式字符串' },
  { label: '八进制', value: 'OCT',  placeholder: '输入 0-7 格式字符串' },
  { label: '十进制', value: 'DEC', placeholder: '输入 0-9 格式字符串' },
  { label: '十六进制', value: 'HEX', placeholder: '输入 0-9 A-F 格式字符串' },
];

const emptyResult = {
  "hex": "",
  "bin": "",
  "dec": "",
  "oct": "",
};

export {
  emptyResult,
  numberTypeList
}