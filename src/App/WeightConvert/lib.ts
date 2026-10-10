import { typeList } from "./data";
import { BigNumber } from "../../lib/bignumber";

// 各单位 ↔ 克 (g) 的换算系数 [分子, 分母]
// 1 (单位) = 分子 / 分母 克; 换算用 BigNumber, 保证精确与可逆
export const WEIGHT_FACTORS :Record<string, [string, string]> = {
  kt: ['1000000000', '1'],
  t: ['1000000', '1'],
  kg: ['1000', '1'],
  g: ['1', '1'],
  mg: ['1', '1000'],
  mcg: ['1', '1000000'],
  ng: ['1', '1000000000'],
  ct: ['2', '10'],                    // 1 克拉 = 0.2 g

  oz: ['28349523125', '1000000000'],  // 1 盎司 = 28.349523125 g
  lb: ['45359237', '100000'],         // 1 磅 = 453.59237 g
  st: ['6350', '1'],                  // 1 英石 = 14 磅 = 6.35 kg
  gr: ['6479891', '100000000'],       // 1 格令 = 64.79891 mg
  dr: ['177', '100'],                 // 1 打兰 = 1.77 g
  qr: ['12700', '1'],                 // 1 夸特 = 12.7 kg
  hw: ['50800', '1'],                 // 1 英担 = 50.8 kg
  md: ['45359237', '1000'],           // 1 美担 = 45.359237 kg
  longton: ['1016000', '1'],          // 1 英吨 = 1016 kg
  shortton: ['907000', '1'],          // 1 美吨 = 907 kg

  dan: ['50000', '1'],
  jin: ['500', '1'],
  liang: ['50', '1'],
  qian: ['5', '1'],
  fen: ['5', '10'],
  li: ['5', '100'],
};

// 指定单位 → 克
export const toGram = (value :BigNumber, type :string) :BigNumber => {
  const f = WEIGHT_FACTORS[type];
  return f ? value.times(f[0]).div(f[1]) : value;
}

// 克 → 指定单位
export const fromGram = (gram :BigNumber, type :string) :BigNumber => {
  const f = WEIGHT_FACTORS[type];
  return f ? gram.times(f[1]).div(f[0]) : gram;
}

// 获指定制式的距离类型列表
export const getTypeList = (ut :string) => {
  return typeList.filter((v) => v.type === ut)
}

export const getDefaultType = (ut :string) :string =>{
  switch(ut) {
    case 'iu': return getDefaultIUType();
    case 'cn': return getDefaultCNType();
  }
  return getDefaultMSType();
}

export const getTypePlaceholder = (type :string) :string | undefined => {
  return typeList.find(item => item.value === type)?.placeholder;
}

const DEFAULT_UNIT_TYPE = 'weight-convert:default-unit-type';

// 获取默认制式
export function getDefaultUnitType() :string  {
  const type = localStorage.getItem(DEFAULT_UNIT_TYPE);
  return (type === null)? "ms" : type;
}

// 设置默认制式
export function setDefaultUnitType(type: string) : void  {
  localStorage.setItem(DEFAULT_UNIT_TYPE,type);
}

const DEFAULT_MS_TYPE = 'weight-convert:default-ms-type';

// 获取默认公制单位
export function getDefaultMSType() :string  {
  const type = localStorage.getItem(DEFAULT_MS_TYPE);
  return (type === null)? "kg" : type;
}

// 设置默认公制单位
export function setDefaultMSType(type: string) : void  {
  localStorage.setItem(DEFAULT_MS_TYPE,type);
}

const DEFAULT_IU_TYPE = 'weight-convert:default-iu-type';

// 获取默认英制单位
export function getDefaultIUType() :string  {
  const type = localStorage.getItem(DEFAULT_IU_TYPE);
  return (type === null)? "oz" : type;
}

// 设置默认英制单位
export function setDefaultIUType(type: string) : void  {
  localStorage.setItem(DEFAULT_IU_TYPE,type);
}

const DEFAULT_CN_TYPE = 'weight-convert:default-cn-type';

// 获取默认市制单位
export function getDefaultCNType() :string  {
  const type = localStorage.getItem(DEFAULT_CN_TYPE);
  return (type === null)? "jin" : type;
}

// 设置默认市制单位
export function setDefaultCNType(type: string) : void  {
  localStorage.setItem(DEFAULT_CN_TYPE,type);
}