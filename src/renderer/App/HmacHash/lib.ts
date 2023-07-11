const DEFAULT_PASSPHRASE = 'hmac-hash:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE, passphrase);
}

const DEFAULT_SHOW_UPPERCASE = 'hmac-hash:default-show-uppercase';

// 获取默认是否大写展示
export function getDefaultShowUppercase() :boolean  {
  const show = localStorage.getItem(DEFAULT_SHOW_UPPERCASE);
  return (show === null)? false : (show === 'false')? false : true;
}

// 设置默认是否大写展示
export function setDefaultShowUppercase(show: boolean) : void  {
  localStorage.setItem(DEFAULT_SHOW_UPPERCASE, show + '');
}
