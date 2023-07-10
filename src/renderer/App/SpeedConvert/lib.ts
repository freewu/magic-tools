import { typeList } from "./data";

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