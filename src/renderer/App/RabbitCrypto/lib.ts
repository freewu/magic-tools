const DEFAULT_CODE_ITEM = 'rabbit-crypto:default-code';

// 获取默认编码 HEX / Base64
export function getDefaultCode() :string  {
  const code = localStorage.getItem(DEFAULT_CODE_ITEM);
  return (code === null)? "Base64" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultCode(code: string) : void  {
  localStorage.setItem(DEFAULT_CODE_ITEM,code);
}

const DEFAULT_IV_ITEM = 'rabbit-crypto:default-iv';

// 获取默认偏移量
export function getDefaultIV() :string  {
  const iv = localStorage.getItem(DEFAULT_IV_ITEM);
  return (iv === null)? "" : iv;
}

// 设置默认偏移量
export function setDefaultIV(iv: string) : void  {
  localStorage.setItem(DEFAULT_IV_ITEM,iv);
}


const DEFAULT_PASSPHRASE_ITEM = 'rabbit-crypto:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE_ITEM);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE_ITEM,passphrase);
}

// 根据输入的密钥长度生成密钥长度提示
export const genPassphraseLimitLength = (length :number) :number => {
  return 16; // Rabbit 密钥长度 16位
}
