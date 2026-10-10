import { typeList } from "./data";
import { BigNumber } from "../../lib/bignumber";

// 各单位 ↔ 千米每时 (km/h) 的换算系数 [分子, 分母]
// 1 (单位) = 分子 / 分母 km/h; 换算用 BigNumber, 保证精确与可逆
export const SPEED_FACTORS :Record<string, [string, string]> = {
  cms: ['36', '1000'],           // 1 cm/s = 0.036 km/h
  ms: ['36', '10'],              // 1 m/s  = 3.6 km/h
  kms: ['3600', '1'],            // 1 km/s = 3600 km/h
  kmh: ['1', '1'],
  mach: ['1224', '1'],           // 1 马赫 ≈ 1224 km/h
  knot: ['1852', '1000'],        // 1 节 = 1.852 km/h

  mph: ['16093', '10000'],       // 1 英里每时 ≈ 1.6093 km/h
  fts: ['109728', '100000'],     // 1 ft/s  = 0.3048 * 3.6 = 1.09728 km/h
  ftmin: ['18288', '1000000'],   // 1 ft/min = 0.3048 * 0.06 = 0.018288 km/h
  ins: ['9144', '100000'],       // 1 in/s  = 0.0254 * 3.6 = 0.09144 km/h
};

// 指定单位 → 千米每时
export const toKmh = (value :BigNumber, type :string) :BigNumber => {
  const f = SPEED_FACTORS[type];
  return f ? value.times(f[0]).div(f[1]) : value;
}

// 千米每时 → 指定单位
export const fromKmh = (kmh :BigNumber, type :string) :BigNumber => {
  const f = SPEED_FACTORS[type];
  return f ? kmh.times(f[1]).div(f[0]) : kmh;
}

// 获指定制式的距离类型列表
export const getTypeList = (ut :string) => {
  return typeList.filter((v) => v.type === ut)
}

export const getDefaultType = (ut :string) :string =>{
  switch(ut) {
    case 'iu': return getDefaultIUType();
  }
  return getDefaultMSType();
}

export const getTypePlaceholder = (type :string) :string | undefined => {
  return typeList.find(item => item.value === type)?.placeholder;
}

const DEFAULT_UNIT_TYPE = 'speed-convert:default-unit-type';

// 获取默认制式
export function getDefaultUnitType() :string  {
  const type = localStorage.getItem(DEFAULT_UNIT_TYPE);
  return (type === null)? "ms" : type;
}

// 设置默认制式
export function setDefaultUnitType(type: string) : void  {
  localStorage.setItem(DEFAULT_UNIT_TYPE,type);
}

const DEFAULT_MS_TYPE = 'speed-convert:default-ms-type';

// 获取默认公制单位
export function getDefaultMSType() :string  {
  const type = localStorage.getItem(DEFAULT_MS_TYPE);
  return (type === null)? "kmh" : type;
}

// 设置默认公制单位
export function setDefaultMSType(type: string) : void  {
  localStorage.setItem(DEFAULT_MS_TYPE,type);
}

const DEFAULT_IU_TYPE = 'speed-convert:default-iu-type';

// 获取默认英制单位
export function getDefaultIUType() :string  {
  const type = localStorage.getItem(DEFAULT_IU_TYPE);
  return (type === null)? "mph" : type;
}

// 设置默认英制单位
export function setDefaultIUType(type: string) : void  {
  localStorage.setItem(DEFAULT_IU_TYPE,type);
}