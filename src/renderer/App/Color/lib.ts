import { hex } from "color-convert"
import { colorTypeList,colorDataList } from "./data"

// 获取要写入到粘贴板的数据
const getColorString = (color :string,label :string,colorType :string, opacity :number) :string => {
  switch(colorType) {
    case 'TEXT': 
      return label;
    case 'HEX': 
      return color.replace("#","");
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

const DEFAULT_COLORPAD_ITEM = 'color:default-color-pad';

// 获取默认显示的颜色板
export function getDefaultColorPad() :string  {
  const defaultColorPad = localStorage.getItem(DEFAULT_COLORPAD_ITEM);
  // 如果没有设置默认展示的颜色板，默认显示 chinese-traditional
  return (defaultColorPad === null)? "chinese-traditional" : defaultColorPad;
}

// 设置默认显示的颜色板
export function setDefaultColorPad(pad: string) : void  {
  localStorage.setItem(DEFAULT_COLORPAD_ITEM,pad);
}

const DEFAULT_BATCHSWITCH_ITEM = 'color:default-batch-switch';

// 获取是否默认打开批量取色
export function getDefaultBatchSwitch() :boolean  {
  const flag = localStorage.getItem(DEFAULT_BATCHSWITCH_ITEM);
  // 如果没有设置是否默认打开批量取色，默认 false
  let a = (flag === null)? false : flag === "true";
  return a;
}

// 设置是否默认打开批量取色
export function setDefaultBatchSwitch(flag: boolean) : void  {
  localStorage.setItem(DEFAULT_BATCHSWITCH_ITEM, flag.toString());
}

const DEFAULT_OPACITY_ITEM = 'color:default-opacity';

// 获取默认不透明度
export function getDefaultOpacity() :number {
  const opacity = localStorage.getItem(DEFAULT_OPACITY_ITEM);
  // 如果没有设置默认不透明度，默认 0.9
  if (null === opacity) return 9;
  let num = parseInt(opacity);
  if(num > 10 || num < 0) return 9;
  return num;
}

// 设置默认不透明度
export function setDefaultOpacity(opacity :number) : void  {
  localStorage.setItem(DEFAULT_OPACITY_ITEM, opacity.toString());
}

const DEFAULT_PICK_MAX_ITEM = 'color:pick-max';

// 获取默认最大取色个数
export function getDefaultPickMax() :number {
  const max = localStorage.getItem(DEFAULT_PICK_MAX_ITEM);
  // 如果没有设置默最大取色个数，默认 10
  if (null === max) return 10;
  let num = parseInt(max);
  if(num > 20 || num < 5) return 10;
  return num;
}

// 设置默认最大取色个数
export function setDefaultPickMax(max :number) : void  {
  localStorage.setItem(DEFAULT_PICK_MAX_ITEM, max.toString());
}

export {
  getColorString,
  pickColorTypeList
}