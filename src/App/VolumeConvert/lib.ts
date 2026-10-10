import { typeList } from "./data";
import { BigNumber } from "../../lib/bignumber";

// 各单位 ↔ 毫升 (ml) 的换算系数 [分子, 分母]
// 1 (单位) = 分子 / 分母 毫升; 换算用 BigNumber, 保证精确与可逆
export const VOLUME_FACTORS :Record<string, [string, string]> = {
  l: ['1000', '1'],
  ml: ['1', '1'],
  m3: ['1000000', '1'],
  dm3: ['1000', '1'],
  cm3: ['1', '1'],
  mm3: ['1', '1000'],

  'us-ounce': ['295735295625', '10000000000'],   // 29.5735295625
  'us-gallon': ['378541178', '100000'],          // 3785.41178
  'us-dram': ['36966912', '10000000'],           // 3.6966912
  'us-teaspoon': ['492892159', '100000000'],     // 4.92892159
  'us-tablespoon': ['147867648', '10000000'],    // 14.7867648
  'us-gill': ['118294118', '1000000'],           // 118.294118
  'us-cup': ['236588236', '1000000'],            // 236.588236
  'us-pint': ['473176473', '1000000'],           // 473.176473
  'us-quart': ['946352946', '1000000'],          // 946.352946

  'iu-ounce': ['284130625', '10000000'],         // 28.4130625
  'iu-gallon': ['454609', '100'],                // 4546.09
  'iu-dram': ['35516328125', '10000000000'],     // 3.5516328125
  'iu-teaspoon': ['47355125', '10000000'],       // 4.7355125
  'iu-tablespoon': ['142065375', '10000000'],    // 14.2065375
  'iu-gill': ['1420653125', '10000000'],         // 142.0653125
  'iu-cup': ['284130625', '1000000'],            // 284.130625
  'iu-pint': ['56826125', '100000'],             // 568.26125
  'iu-quart': ['11365225', '10000'],             // 1136.5225
  'iu-inch3': ['16387064', '1000000'],           // 16.387064
  'iu-foot3': ['283168466', '10000'],            // 28316.8466
  'iu-yard3': ['764554858', '1000'],             // 764554.858

  dan: ['100000', '1'],
  dou: ['10000', '1'],
  sheng: ['1000', '1'],
  he: ['100', '1'],
  shao: ['10', '1'],
  cuo: ['1', '1'],
};

// 指定单位 → 毫升
export const toMl = (value :BigNumber, type :string) :BigNumber => {
  const f = VOLUME_FACTORS[type];
  return f ? value.times(f[0]).div(f[1]) : value;
}

// 毫升 → 指定单位
export const fromMl = (ml :BigNumber, type :string) :BigNumber => {
  const f = VOLUME_FACTORS[type];
  return f ? ml.times(f[1]).div(f[0]) : ml;
}

// 获指定制式的距离类型列表
export const getTypeList = (ut :string) => {
  return typeList.filter((v) => v.type === ut)
}

export const getDefaultType = (ut :string) :string =>{
  switch(ut) {
    case 'iu': return getDefaultIUType();
    case 'cn': return getDefaultCNType();
    case 'us': return getDefaultUSType();
  }
  return getDefaultMSType();
}

export const getTypePlaceholder = (type :string) :string | undefined => {
  return typeList.find(item => item.value === type)?.placeholder;
}

const DEFAULT_UNIT_TYPE = 'volume-convert:default-unit-type';

// 获取默认制式
export function getDefaultUnitType() :string  {
  const type = localStorage.getItem(DEFAULT_UNIT_TYPE);
  return (type === null)? "ms" : type;
}

// 设置默认制式
export function setDefaultUnitType(type: string) : void  {
  localStorage.setItem(DEFAULT_UNIT_TYPE,type);
}

const DEFAULT_MS_TYPE = 'volume-convert:default-ms-type';

// 获取默认公制单位
export function getDefaultMSType() :string  {
  const type = localStorage.getItem(DEFAULT_MS_TYPE);
  return (type === null)? "l" : type;
}

// 设置默认公制单位
export function setDefaultMSType(type: string) : void  {
  localStorage.setItem(DEFAULT_MS_TYPE,type);
}

const DEFAULT_IU_TYPE = 'volume-convert:default-iu-type';

// 获取默认英制单位
export function getDefaultIUType() :string  {
  const type = localStorage.getItem(DEFAULT_IU_TYPE);
  return (type === null)? "iu-ounce" : type;
}

// 设置默认英制单位
export function setDefaultIUType(type: string) : void  {
  localStorage.setItem(DEFAULT_IU_TYPE,type);
}

const DEFAULT_CN_TYPE = 'volume-convert:default-cn-type';

// 获取默认市制单位
export function getDefaultCNType() :string  {
  const type = localStorage.getItem(DEFAULT_CN_TYPE);
  return (type === null)? "dou" : type;
}

// 设置默认市制单位
export function setDefaultCNType(type: string) : void  {
  localStorage.setItem(DEFAULT_CN_TYPE,type);
}


const DEFAULT_US_TYPE = 'volume-convert:default-us-type';

// 获取默认美制单位
export function getDefaultUSType() :string  {
  const type = localStorage.getItem(DEFAULT_US_TYPE);
  return (type === null)? "us-ounce" : type;
}

// 设置默认美制单位
export function setDefaultUSType(type: string) : void  {
  localStorage.setItem(DEFAULT_US_TYPE,type);
}
