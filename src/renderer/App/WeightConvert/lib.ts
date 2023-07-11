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