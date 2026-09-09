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
// 各通道允许负数 (LAB a/b、LCH c 等通道可为负值) 与小数值, 否则取色器回填的 lab(-23) 等格式无法解析
const transalte2Hex = (color:string,colorType:string) :string => {
  color = color.replaceAll(" ","");
  color = color.replaceAll("%","");
  const chan = "(-?\\d+(?:\\.\\d+)?)";
  const re3 = new RegExp(`\\(${chan},${chan},${chan}\\)`);
  const re4 = new RegExp(`\\(${chan},${chan},${chan},${chan}\\)`);
  const toNum = (s: string): number => parseFloat(s);
  switch(colorType) {
    case "HEX": return color;
    case "RGB": {
      let m = re3.exec(color);
      if (m === null) m = re4.exec(color); // 处理 RGBA(R,G,B,A) 的情况
      if (m !== null) return rgb.hex(toNum(m[1]), toNum(m[2]), toNum(m[3]));
      break;
    }
    case "HSL": {
      let m = re3.exec(color);
      if (m === null) m = re4.exec(color); // 处理 HSLA(H,S,L,A) 的情况
      if (m !== null) return hsl.hex([toNum(m[1]), toNum(m[2]), toNum(m[3])]);
      break;
    }
    case "HSV": {
      const m = re3.exec(color);
      if (m !== null) return hsv.hex([toNum(m[1]), toNum(m[2]), toNum(m[3])]);
      break;
    }
    case "CMYK": {
      const m = re4.exec(color);
      if (m !== null) return cmyk.hex([toNum(m[1]), toNum(m[2]), toNum(m[3]), toNum(m[4])]);
      break;
    }
    case "LAB": {
      const m = re3.exec(color);
      if (m !== null) return lab.hex([toNum(m[1]), toNum(m[2]), toNum(m[3])]);
      break;
    }
    case "LCH": {
      const m = re3.exec(color);
      if (m !== null) return lch.hex([toNum(m[1]), toNum(m[2]), toNum(m[3])]);
      break;
    }
    case "XYZ": {
      const m = re3.exec(color);
      if (m !== null) return xyz.hex([toNum(m[1]), toNum(m[2]), toNum(m[3])]);
      break;
    }
  }
  return "";
};

// 获取 传入的 hex 的互补色的 hex #FF0000 => #00FFFF
const calcComplementaryColor = (color: string) :string => {
  color = color.replace("#","").trim();
  const colorRGB = hex.rgb(color);

  return "#" + rgb.hex([255 - colorRGB[0],255 - colorRGB[1],255 - colorRGB[2]]);
}

export interface SchemeColor {
  hex :string;    // #RRGGBB (大写)
  offset :number; // 相对主色的色相偏移度 (-179 ~ 180)
  isMain :boolean;
  isComplement :boolean;
}

export interface ColorScheme {
  key :string;
  label :string;
  desc :string;
  colors :SchemeColor[];
}

// 配色方案定义: 以主色色相为 0°, offsets 为其色相偏移阵列。
// 参考主流色轮配色: 相似 ±30 / 分离 补色两侧 30 (150,210) / 三角 120 /
// 四角(矩形) 两互补对错开 60 (0,60,180,240) / 方形 90 等距 / 复合 主+补邻近过渡 (Adobe Compound 风格) /
// 双分离 主色两侧相似色与其互补两侧 (5 色)。如需微调某方案角度, 改本数组即可。
const SCHEME_DEFS :Array<{ key :string; label :string; desc :string; offsets :number[] }> = [
  { key: 'analogous', label: '相似色', desc: '主色在色轮上相邻 ±30° 的颜色, 过渡柔和统一', offsets: [0, -30, 30] },
  { key: 'split', label: '分离色', desc: '主色与互补色两侧 30° 的颜色 (150°/210°), 对比强烈不失柔和', offsets: [0, 150, 210] },
  { key: 'triadic', label: '三角色', desc: '色轮上相隔 120° 的三色 (0°/120°/240°), 均衡活泼', offsets: [0, 120, 240] },
  { key: 'tetradic', label: '四角色', desc: '两组互补色错开 60° 的矩形四色 (0°/60°/180°/240°)', offsets: [0, 60, 180, 240] },
  { key: 'square', label: '方形色', desc: '色轮上 90° 等距的四色 (0°/90°/180°/270°)', offsets: [0, 90, 180, 270] },
  { key: 'compound', label: '复合色', desc: '主色、互补色及各自的邻近过渡色 (Adobe Compound 风格)', offsets: [0, 30, 150, 180] },
  { key: 'doubleSplit', label: '双分离色', desc: '主色两侧相似色与其互补两侧的组合 (5 色)', offsets: [0, -30, 30, 150, 210] },
];

/** 根据主色 HEX 计算 7 组配色方案; 传入空串/非法值返回 [] */
const calcColorSchemes = (color :string) :ColorScheme[] => {
  const hexStr = color.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/u.test(hexStr)) return [];
  let hslArr :number[];
  try {
    hslArr = hex.hsl(hexStr); // [h(0-360), s(0-100), l(0-100)]
  } catch {
    return [];
  }
  const h = hslArr[0], s = hslArr[1], l = hslArr[2];
  const norm = (o :number) => {
    const hh = ((h + o) % 360 + 360) % 360;
    return '#' + hsl.hex([hh, s, l]).toUpperCase();
  };
  return SCHEME_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    desc: def.desc,
    colors: def.offsets.map((o) => ({
      hex: norm(o),
      offset: o,
      isMain: o === 0,
      isComplement: o === 180 || o === -180,
    })),
  }));
};

export {
  genColorString,
  transalte2Hex,
  calcComplementaryColor,
  calcColorSchemes,
}