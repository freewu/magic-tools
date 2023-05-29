import { errorCorrectionLevelList } from './data';

const DEFAULT_ERROR_LEVEL_ITEM = 'qrcode:default-error-level';

// 获取默认容错等级
export function getDefaultErrorLevel() :string  {
  const defaultLevel = localStorage.getItem(DEFAULT_ERROR_LEVEL_ITEM);
  // 如果没有设置默认容错等级
  return (defaultLevel === null)? 'M' : defaultLevel;
}

// 设置默认容错等级
export function setDefaultErrorLevel(level: string) : void  {
  const d = errorCorrectionLevelList.find((v) => { return v.value === level});
  if (d) {
    localStorage.setItem(DEFAULT_ERROR_LEVEL_ITEM, level);
  } else {
    localStorage.setItem(DEFAULT_ERROR_LEVEL_ITEM, 'M');
  }
}

// 获取容错等级的提示信息
export function getErrorLevelTip(level: string) :string {
  const t = errorCorrectionLevelList.find((item) => { return item.value === level; });
  if(t) return t.info;
  return "";
}

const DEFAULT_SIZE_ITEM = 'qrcode:default-size';
// 获取默认尺寸
export function getDefaultSize() :number  {
  const item = localStorage.getItem(DEFAULT_SIZE_ITEM);
  // 如果没有设置默认尺寸
  if(item === null) return 160;
  const size = parseInt(item); //
  return (size < 160)? 160 : size;
}

// 设置默认尺寸
export function setDefaultSize(size: number) : void  {
  if (size >= 160 ) {
    localStorage.setItem(DEFAULT_SIZE_ITEM, size.toString());
  } else {
    localStorage.setItem(DEFAULT_SIZE_ITEM, '160');
  }
}