// 转换成十进制数
const translateDecimal = (value :string,numberType :string) :number => {
  switch(numberType) {
    case "BIN": return Number("0b" + value);
    case "OCT": return Number("0o" + value);
    case "HEX": return Number("0x" + value);
  }
  return Number(value);
}

export {
  translateDecimal
}