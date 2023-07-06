import { typeList } from "./data";

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