// 获取默认的常用密码列表
export function getDefaultPasswordList() :Array<string> {
  return [
    "admin",
    "123456",
    "12345678",
    "root",
    "password",
    "qwerty",
    "1234",
    "12345",
  ]
}

const PASSWORD_LIST_ITEM = 'hash:password-list';

// 获取设置的密码列表 如果没有设置使用默认列表
export function getPasswordList() :Array<string> {
  const list = localStorage.getItem(PASSWORD_LIST_ITEM);
  // 如果没有设置,返回默认的常用密码列表
  if (null === list) return getDefaultPasswordList();

  let arr = list.split(",");
  arr = arr.filter((item) => { return item.trim() !== "" });
  if (0 === arr.length) return getDefaultPasswordList();
  
  return arr;
}

// 设置密码列表 
export function setPasswordList(list: Array<string>) : void  {
  localStorage.setItem(PASSWORD_LIST_ITEM,list.join(","));
}

const DEFAULT_SHOW_UPPERCASE = 'hash:default-show-uppercase';

// 获取默认是否大写展示
export function getDefaultShowUppercase() :boolean  {
  const show = localStorage.getItem(DEFAULT_SHOW_UPPERCASE);
  return (show === null)? false : (show === 'false')? false : true;
}

// 设置默认是否大写展示
export function setDefaultShowUppercase(show: boolean) : void  {
  localStorage.setItem(DEFAULT_SHOW_UPPERCASE, show + '');
}
