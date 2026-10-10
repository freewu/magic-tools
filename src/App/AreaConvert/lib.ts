import { typeList } from "./data";
import { BigNumber } from "../../lib/bignumber";

// 各单位 ↔ 平方米 (m²) 的换算系数 [分子, 分母]
// 1 (单位) = 分子 / 分母 平方米; 换算用 BigNumber, 保证精确与可逆
export const AREA_FACTORS :Record<string, [string, string]> = {
  km2: ['1000000', '1'],
  gq: ['10000', '1'],
  gm: ['100', '1'],
  m2: ['1', '1'],
  dm2: ['1', '100'],
  cm2: ['1', '10000'],
  mm2: ['1', '1000000'],

  mile2: ['2590000', '1'],              // 1 平方英里 ≈ 2590000 平方米
  ym: ['404685642', '100000'],          // 1 英亩 = 4046.85642
  ld: ['10117136203', '10000000'],      // 1 路得 = 1011.7136203
  g: ['252928469', '10000000'],         // 1 平方杆 = 25.2928469
  yard2: ['83612736', '100000000'],     // 1 平方码 = 0.83612736
  foot2: ['9290304', '100000000'],      // 1 平方英尺 = 0.09290304
  inch2: ['64516', '100000000'],        // 1 平方英寸 = 0.00064516

  'jp-ping': ['330578622', '100000000'], // 1 坪 = 3.30578622
  'jp-die': ['162', '100'],              // 1 叠 = 1.62
  'jp-ding': ['991736', '100000000'],    // 1 町 = 0.00991736
  'jp-duan': ['99174', '100000000'],     // 1 段 = 0.00099174
  'jp-mu': ['9917', '100000000'],        // 1 亩 = 0.00009917

  qin: ['66666', '1'],
  mu: ['66666', '100'],
  fen: ['66666', '1000'],
  li: ['66666', '10000'],
  hao: ['66666', '100000'],
  zhuang2: ['1111', '100'],
  chi2: ['1111', '10000'],
  cun2: ['1111', '1000000'],
};

// 指定单位 → 平方米
export const toSquareMeter = (value :BigNumber, type :string) :BigNumber => {
  const f = AREA_FACTORS[type];
  return f ? value.times(f[0]).div(f[1]) : value;
}

// 平方米 → 指定单位
export const fromSquareMeter = (m2 :BigNumber, type :string) :BigNumber => {
  const f = AREA_FACTORS[type];
  return f ? m2.times(f[1]).div(f[0]) : m2;
}

// 获指定制式的距离类型列表
export const getTypeList = (ut :string) => {
  return typeList.filter((v) => v.type === ut)
}

export const getDefaultType = (ut :string) :string =>{
  switch(ut) {
    case 'iu': return getDefaultIUType();
    case 'cn': return getDefaultCNType();
    case 'jp': return getDefaultJPType();
  }
  return getDefaultMSType();
}

export const getTypePlaceholder = (type :string) :string | undefined => {
  return typeList.find(item => item.value === type)?.placeholder;
}

const DEFAULT_UNIT_TYPE = 'area-convert:default-unit-type';

// 获取默认制式
export function getDefaultUnitType() :string  {
  const type = localStorage.getItem(DEFAULT_UNIT_TYPE);
  return (type === null)? "ms" : type;
}

// 设置默认制式
export function setDefaultUnitType(type: string) : void  {
  localStorage.setItem(DEFAULT_UNIT_TYPE,type);
}

const DEFAULT_MS_TYPE = 'area-convert:default-ms-type';

// 获取默认公制单位
export function getDefaultMSType() :string  {
  const type = localStorage.getItem(DEFAULT_MS_TYPE);
  return (type === null)? "m2" : type;
}

// 设置默认公制单位
export function setDefaultMSType(type: string) : void  {
  localStorage.setItem(DEFAULT_MS_TYPE,type);
}

const DEFAULT_IU_TYPE = 'area-convert:default-iu-type';

// 获取默认英制单位
export function getDefaultIUType() :string  {
  const type = localStorage.getItem(DEFAULT_IU_TYPE);
  return (type === null)? "foot2" : type;
}

// 设置默认英制单位
export function setDefaultIUType(type: string) : void  {
  localStorage.setItem(DEFAULT_IU_TYPE,type);
}

const DEFAULT_CN_TYPE = 'area-convert:default-cn-type';

// 获取默认市制单位
export function getDefaultCNType() :string  {
  const type = localStorage.getItem(DEFAULT_CN_TYPE);
  return (type === null)? "mu" : type;
}

// 设置默认市制单位
export function setDefaultCNType(type: string) : void  {
  localStorage.setItem(DEFAULT_CN_TYPE,type);
}

const DEFAULT_JP_TYPE = 'area-convert:default-jp-type';

// 获取默认日式单位
export function getDefaultJPType() :string  {
  const type = localStorage.getItem(DEFAULT_JP_TYPE);
  return (type === null)? "jp-ping" : type;
}

// 设置默认日式单位
export function setDefaultJPType(type: string) : void  {
  localStorage.setItem(DEFAULT_JP_TYPE,type);
}


