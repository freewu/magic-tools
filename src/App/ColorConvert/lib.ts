import { hex, rgb, hsl, hsv, lab, xyz, lch, cmyk } from "color-convert"

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
    case 'ComplementaryColor': 
      return calcComplementaryColor(color);
  }
  return color;
};

// 根据传入的值和颜色类型,转成  颜色的 HEX 值 
const transalte2Hex = (color:string,colorType:string) :string => {
  color = color.replaceAll(" ","");
  color = color.replaceAll("%","");
  switch(colorType) {
    case "HEX": return color;
    case "RGB":
      let colorRGB = /\((\d+),(\d+),(\d+)\)/.exec(color);
      if (colorRGB === null) { // 处理 RGBA(R,G,B,A) 的情况
        colorRGB = /\((\d+),(\d+),(\d+),(\d+)\)/.exec(color);
      }
      if (colorRGB !== null) {
        return rgb.hex(parseInt(colorRGB[1]),parseInt(colorRGB[2]),parseInt(colorRGB[3]));
      }
      break;
    case "HSL":
      let colorHSL = /\((\d+),(\d+),(\d+)\)/.exec(color);
      if (colorHSL === null) { // 处理 HSLA(H,S,L,A) 的情况
        colorHSL = /\((\d+),(\d+),(\d+),(\d+)\)/.exec(color);
      }
      if (colorHSL !== null) {
        return hsl.hex([parseInt(colorHSL[1]), parseInt(colorHSL[2]), parseInt(colorHSL[3])]);
      }
      break;
    case "CMYK":
      let colorCMYK = /\((\d+),(\d+),(\d+),(\d+)\)/.exec(color);
      if (colorCMYK !== null) {
        return cmyk.hex([parseInt(colorCMYK[1]), parseInt(colorCMYK[2]), parseInt(colorCMYK[3]), parseInt(colorCMYK[4])]);
      }
      break;
    case "HSV":
      let colorHSV = /\((\d+),(\d+),(\d+)\)/.exec(color);
      if (colorHSV !== null) {
        return hsl.hex([parseInt(colorHSV[1]), parseInt(colorHSV[2]), parseInt(colorHSV[3])]);
      }
      break;
    case "LAB":
      let colorLAB = /\((\d+),(\d+),(\d+)\)/.exec(color);
      if (colorLAB !== null) {
        return lab.hex([parseInt(colorLAB[1]), parseInt(colorLAB[2]), parseInt(colorLAB[3])]);
      }
      break;
    case "LCH":
      let colorLCH = /\((\d+),(\d+),(\d+)\)/.exec(color);
      if (colorLCH !== null) {
        return lch.hex([parseInt(colorLCH[1]), parseInt(colorLCH[2]), parseInt(colorLCH[3])]);
      }
      break;
    case "XYZ":
      let colorXYZ = /\((\d+),(\d+),(\d+)\)/.exec(color);
      if (colorXYZ !== null) {
        return xyz.hex([parseInt(colorXYZ[1]), parseInt(colorXYZ[2]), parseInt(colorXYZ[3])]);
      }
      break;
  }
  return "";
};

// 获取 传入的 hex 的互补色的 hex #FF0000 => #00FFFF
const calcComplementaryColor = (color: string) :string => {
  color = color.replace("#","").trim();
  const colorRGB = hex.rgb(color);

  return "#" + rgb.hex([255 - colorRGB[0],255 - colorRGB[1],255 - colorRGB[2]]);
}

export {
  genColorString,
  transalte2Hex,
  calcComplementaryColor,
}