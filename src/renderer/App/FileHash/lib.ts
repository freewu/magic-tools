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
