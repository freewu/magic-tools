export const typeList = [
  { label: 'B', value: 'B', placeholder: '字节 byte' },
  { label: 'KB', value: 'KB', placeholder: '千字节 Kilo Byte' },
  { label: 'MB', value: 'MB', placeholder: '兆字节 Mega Byte' },
  { label: 'GB', value: 'GB', placeholder: '吉字节 Giga Byte' },
  { label: 'TB', value: 'TB', placeholder: '太字节 Trillion Byte' },
  { label: 'PB', value: 'PB', placeholder: '拍字节 Peta Byte' },
  { label: 'EB', value: 'EB', placeholder: '艾字节 Exa Byte' },
  { label: 'ZB', value: 'ZB', placeholder: '泽字节 Zetta Byte' },
  { label: 'YB', value: 'YB', placeholder: '尧字节 Yotta Byte' },
];

export const emptyResult :ByteConvertResult = {
  "b": "",
  "kb": "",
  "mb": "",
  "gb": "",
  "tb": "",
  "pb": "",
  "eb": "",
  "zb": "",
  "yb": "",
};

export type ByteConvertResult = {
  "b": string,
  "kb": string,
  "mb": string,
  "gb": string,
  "tb": string,
  "pb": string,
  "eb": string,
  "zb": string,
  "yb": string,
}
