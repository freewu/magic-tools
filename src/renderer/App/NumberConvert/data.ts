// 进制类型列表
const numberTypeList = [
  { label: '二进制', value: 'BIN', placeholder: '输入只包含 0-1 的字符串' },
  { label: '八进制', value: 'OCT',  placeholder: '输入只包含 0-7 的字符串' },
  { label: '十进制', value: 'DEC', placeholder: '输入只包含 0-9 的字符串' },
  { label: '十六进制', value: 'HEX', placeholder: '输入只包含 0-9 A-F 的字符串' },
];

const emptyResult :NumberConvertResult = {
  "hex": "",
  "bin": "",
  "dec": "",
  "oct": "",
};

export type NumberConvertResult = {
  "hex": string,
  "bin": string,
  "dec": string,
  "oct": string,
}

export {
  emptyResult,
  numberTypeList
}