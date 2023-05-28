import { hex } from "color-convert"

// 根据 颜色的 HEX 生成需要出的颜色格式
const genColorString = (color :string,colorType :string) :string => {
  color = color.replace("#","");
  switch(colorType) {
    case 'KEYWORD':
      return hex.keyword(color);
    case 'HEX': 
      return "#" + color;
    case 'RGB': 
      const rgb = hex.rgb(color);
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    case 'HSL': 
      const hsl = hex.hsl(color);
      return `hsl(${hsl[0]}, ${hsl[1]}, ${hsl[2]})`;
    case 'HSV': 
      const hsv = hex.hsv(color);
      return `hsv(${hsv[0]}, ${hsv[1]}, ${hsv[2]})`;
    case 'CMYK': 
      const cmyk = hex.cmyk(color);
      return `cmyk(${cmyk[0]}, ${cmyk[1]}, ${cmyk[2]}, ${cmyk[3]})`;
    case 'LAB': 
      const lab = hex.lab(color);
      return `lab(${lab[0]}, ${lab[1]}, ${lab[2]})`;
    case 'LCH': 
      const lch = hex.lch(color);
      return `lch(${lch[0]}, ${lch[1]}, ${lch[2]})`;
    case 'XYZ': 
      const xyz = hex.xyz(color);
      return `xyz(${xyz[0]}, ${xyz[1]}, ${xyz[2]})`;
  }
  return color;
};

  // 根据传入的值和颜色类型,转成  颜色的 HEX 值 
  const transalte2Hex = (color:string,colorType:string) :string => {
    return color;
  }

export {
  genColorString,
  transalte2Hex
}