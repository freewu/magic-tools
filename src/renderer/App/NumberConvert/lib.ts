// 转换成十进制数
export const translateDecimal = (value :string,numberType :string) :number => {
  switch(numberType) {
    case "BIN": return Number("0b" + value);
    case "OCT": return Number("0o" + value);
    case "HEX": return Number("0x" + value);
  }
  return Number(value);
}

const DEFAULT_SHOW_UPPERCASE = 'number-convert:default-show-uppercase';

// 获取默认是否大写展示
export function getDefaultShowUppercase() :boolean  {
  const show = localStorage.getItem(DEFAULT_SHOW_UPPERCASE);
  return (show === null)? false : (show === 'false')? false : true;
}

// 设置默认是否大写展示
export function setDefaultShowUppercase(show: boolean) : void  {
  localStorage.setItem(DEFAULT_SHOW_UPPERCASE, show + '');
}

const DEFAULT_TYPE = 'number-convert:default-type';

// 获取默认类型
export function getDefaultType() :string  {
  const code = localStorage.getItem(DEFAULT_TYPE);
  return (code === null)? "DEC" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultType(code: string) : void  {
  localStorage.setItem(DEFAULT_TYPE,code);
}

const DEFAULT_HUMAN_READ = 'number-convert:default-human-read';

export function getDefaultHumanRead() :boolean  {
  const show = localStorage.getItem(DEFAULT_HUMAN_READ);
  return (show === null)? false : (show === 'false')? false : true;
}

export function setDefaultHumanRead(show: boolean) : void  {
  localStorage.setItem(DEFAULT_HUMAN_READ, show + '');
}

import { numberTypeList } from "./data"
export const getTypePlaceholder = (type :string) :string | undefined => {
  return numberTypeList.find(item => item.value === type)?.placeholder;
}