// 颜色类型列表
const colorTypeList = [
  { label: 'HEX', value: 'HEX', placeholder: '输入 #RRGGBB / #RGB / RRGGBB 格式字符串' },
  { label: 'RGB', value: 'RGB',  placeholder: '输入 RGB(R,G,B)  / RGBA(R,G,B,A) / (R,G,B) / (R,G,B,A) 格式字符串' },
  { label: 'HSL', value: 'HSL', placeholder: '输入 HSL(H,S,L)  / HSLA(H,S,L,A) / (H,S,L) / (H,S,L,A) 格式字符串' },
  { label: 'CMYK', value: 'CMYK', placeholder: '输入 CMYK(C,M,Y,K) / (C,M,Y,K) 格式字符串' },
  
  { label: 'HSV', value: 'HSV', placeholder: '输入 HSV(H,S,V) / (H,S,V) 格式字符串' },
  { label: 'LAB', value: 'LAB', placeholder: '输入 LAB(L,A,B) / (L,A,B) 格式字符串' },
  { label: 'LCH', value: 'LCH', placeholder: '输入 LCH(L,C,H) / (L,C,H) 格式字符串' },
  { label: 'XYZ', value: 'XYZ', placeholder: '输入 XYZ(X,Y,Z) / (X,Y,Z) 格式字符串' },
];

const emptyResult = {
  "hex": "",
  "rgb": "",
  "hsl": "",
  "cmyk": "",
  "hsv": "",
  "lab": "",
  "lch": "",
  "xyz": "",
  "keyword": "",
};

export {
  emptyResult,
  colorTypeList
}