// 颜色类型列表
const colorTypeList = [
  { label: '#HEX', value: 'HEX1' },
  { label: 'HEX', value: 'HEX' },
  { label: 'RGB', value: 'RGB' },
  { label: 'RGBA', value: 'RGBA' },

  { label: 'HSL', value: 'HSL' },
  { label: 'HSLA', value: 'HSLA' },
  { label: 'CMYK', value: 'CMYK' },
  
  { label: 'HSV', value: 'HSV' },
  { label: 'LAB', value: 'LAB' },
  { label: 'LCH', value: 'LCH' },
  { label: 'XYZ', value: 'XYZ' },

  { label: '颜色名称', value: 'TEXT' },
];

import { 
  ChinesePainting, 
  ChineseTraditional, 
  JapaneseColor,
  RalClassic 
} from "./data/index"

// 颜色数据
const colorDataList = [
  {
    key: 'chinese-traditional',
    label: `中国传统色彩`,
    data: ChineseTraditional
  },
  {
    key: 'chinese-painting',
    label: `国画常用色彩`,
    data: ChinesePainting
  },
  {
    key: 'japanese-color',
    label: `日式配色`,
    data: JapaneseColor
  },
  {
    key: 'ral-classic',
    label: `Ral Classic`,
    data: RalClassic
  },
];

export { colorTypeList, colorDataList };