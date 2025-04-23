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

// 将 字符串转换成 HexString
export function stringToHex(str: string) {
    // 使用TextEncoder将字符串编码为UTF-8格式的Uint8Array
    const bytes = new TextEncoder().encode(str);
    // 将Uint8Array转换为十六进制字符串
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}