import { typeList } from "./data";
import { BigNumber } from "../../lib/bignumber";

// 各单位 ↔ 米 的换算系数 [分子, 分母] (用字符串保存, 避免浮点字面量精度损失)
// 1 (单位) = 分子 / 分母 米; 换算用 BigNumber, 保证精确与可逆
export const DISTANCE_FACTORS :Record<string, [string, string]> = {
  km: ['1000', '1'],
  m: ['1', '1'],
  dm: ['1', '10'],
  cm: ['1', '100'],
  mm: ['1', '1000'],
  'μm': ['1', '1000000'],
  nm: ['1', '1000000000'],
  pm: ['1', '1000000000000'],
  nmile: ['1852', '1'],

  inch: ['254', '10000'],       // 1 英寸 = 2.54 cm = 0.0254 m
  foot: ['3048', '10000'],      // 1 英尺 = 0.3048 m
  yard: ['9144', '10000'],      // 1 码 = 0.9144 m
  mile: ['1609344', '1000'],    // 1 英里 = 1609.344 m
  fathom: ['1829', '1000'],     // 1 英寻 = 1.829 m
  chain: ['201168', '10000'],   // 1 链 = 20.1168 m
  furlong: ['201168', '1000'],  // 1 化朗 = 201.168 m

  li: ['500', '1'],             // 1 里 = 500 m
  ying: ['500', '15'],          // 1 引 = 500 / 15 m
  zhang: ['50', '15'],          // 1 丈 = 50 / 15 m
  chi: ['5', '15'],             // 1 尺 = 5 / 15 m
  cun: ['5', '150'],            // 1 寸 = 5 / 150 m
  fen: ['5', '1500'],           // 1 分 = 5 / 1500 m
  l: ['5', '15000'],            // 1 厘 = 5 / 15000 m
  hao: ['5', '150000'],         // 1 毫 = 5 / 150000 m
  si: ['5', '15000000'],        // 1 丝 = 5 / 15000000 m
};

// 指定单位 → 米
export const toMeter = (value :BigNumber, type :string) :BigNumber => {
  const f = DISTANCE_FACTORS[type];
  return f ? value.times(f[0]).div(f[1]) : value;
}

// 米 → 指定单位
export const fromMeter = (meter :BigNumber, type :string) :BigNumber => {
  const f = DISTANCE_FACTORS[type];
  return f ? meter.times(f[1]).div(f[0]) : meter;
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

const DEFAULT_UNIT_TYPE = 'distance-convert:default-unit-type';

// 获取默认制式
export function getDefaultUnitType() :string  {
  const type = localStorage.getItem(DEFAULT_UNIT_TYPE);
  return (type === null)? "ms" : type;
}

// 设置默认制式
export function setDefaultUnitType(type: string) : void  {
  localStorage.setItem(DEFAULT_UNIT_TYPE,type);
}

const DEFAULT_MS_TYPE = 'distance-convert:default-ms-type';

// 获取默认公制单位
export function getDefaultMSType() :string  {
  const type = localStorage.getItem(DEFAULT_MS_TYPE);
  return (type === null)? "m" : type;
}

// 设置默认公制单位
export function setDefaultMSType(type: string) : void  {
  localStorage.setItem(DEFAULT_MS_TYPE,type);
}

const DEFAULT_IU_TYPE = 'distance-convert:default-iu-type';

// 获取默认英制单位
export function getDefaultIUType() :string  {
  const type = localStorage.getItem(DEFAULT_IU_TYPE);
  return (type === null)? "foot" : type;
}

// 设置默认英制单位
export function setDefaultIUType(type: string) : void  {
  localStorage.setItem(DEFAULT_IU_TYPE,type);
}

const DEFAULT_CN_TYPE = 'distance-convert:default-cn-type';

// 获取默认市制单位
export function getDefaultCNType() :string  {
  const type = localStorage.getItem(DEFAULT_CN_TYPE);
  return (type === null)? "li" : type;
}

// 设置默认市制单位
export function setDefaultCNType(type: string) : void  {
  localStorage.setItem(DEFAULT_CN_TYPE,type);
}

/**
度单位还有兆米(Mm)、千米(km)、分米(dm)、厘米(cm)、毫米(mm)、丝米(dmm)、忽米(cmm)、微米(μm)、纳米(nm)、皮米(pm)、飞米(fm)、阿米(am)等。他们同米的换算关系如下：
1Gm=1×10^9m
1Mm=1×10^6m
1km=1×10^3m
1dm=1×10^(-1)m
1cm=1×10^(-2)m
1mm=1×10^(-3)m
1dmm=1×10^(-4)m
1cmm=1×10^(-5)m
1μm=1×10^(-6)m
1nm=1×10^(-9)m
1pm=1×10^(-12)m
1fm=1×10^(-15)m
1am=1×10^(-18)m
 */