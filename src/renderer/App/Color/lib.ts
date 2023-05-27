import { hex } from "color-convert"
import { colorTypeList } from "./data"

// 获取要写入到粘贴板的数据
const getColorString = (color :string,label :string,colorType :string, opacity :number) :string => {
  switch(colorType) {
    case 'TEXT': return label;
    case 'HEX': return color.replace("#","");
    case 'RGB': 
    const rgb = hex.rgb(color.replace("#",""));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    case 'RGBA': 
    const rgba = hex.rgb(color.replace("#",""));
    return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${ opacity / 10 })`;
    case 'HSL': 
    const hsl = hex.hsl(color.replace("#",""));
    return `hsl(${hsl[0]}, ${hsl[1]}, ${hsl[2]})`;
    case 'HSLA': 
    const hsla = hex.hsl(color.replace("#",""));
    return `hsla(${hsla[0]}, ${hsla[1]}, ${hsla[2]}, ${ opacity / 10 })`;
    case 'HSV': 
    const hsv = hex.hsv(color.replace("#",""));
    return `hsv(${hsv[0]}, ${hsv[1]}, ${hsv[2]})`;
    case 'CMYK': 
    const cmyk = hex.cmyk(color.replace("#",""));
    return `cmyk(${cmyk[0]}, ${cmyk[1]}, ${cmyk[2]}, ${cmyk[3]})`;
    case 'LAB': 
    const lab = hex.lab(color.replace("#",""));
    return `lab(${lab[0]}, ${lab[1]}, ${lab[2]})`;
    case 'LCH': 
    const lch = hex.lch(color.replace("#",""));
    return `lch(${lch[0]}, ${lch[1]}, ${lch[2]})`;
    case 'XYZ': 
    const xyz = hex.xyz(color.replace("#",""));
    return `xyz(${xyz[0]}, ${xyz[1]}, ${xyz[2]})`;
  }
  return color;
};

// 选择颜色类型, 为了展示美观 小窗口不展示那么多颜色类型
const pickColorTypeList = () => {
  //return colorTypeList;
  // 缩放卡顿，先注释
  if (window.innerWidth > 1200) return colorTypeList;
  const a = colorTypeList.filter((v) => {
    if(v.label == 'LAB' || v.label == 'LCH' || v.label == 'XYZ' || v.label == 'HSV') return false
    return true;
  });
  return a;
}

export {
  getColorString,
  pickColorTypeList
}