const DEFAULT_CODE_ITEM = 'rc4-crypto:default-code';

// 获取默认编码 HEX / Base64
export function getDefaultCode() :string  {
  const code = localStorage.getItem(DEFAULT_CODE_ITEM);
  return (code === null)? "Base64" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultCode(code: string) : void  {
  localStorage.setItem(DEFAULT_CODE_ITEM,code);
}

const DEFAULT_PASSPHRASE_ITEM = 'rc4-crypto:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE_ITEM);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE_ITEM,passphrase);
}