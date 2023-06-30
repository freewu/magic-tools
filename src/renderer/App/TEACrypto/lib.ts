const DEFAULT_CODE = 'tea-crypto:default-code';

// 获取默认编码 HEX / Base64
export function getDefaultCode() :string  {
  const code = localStorage.getItem(DEFAULT_CODE);
  return (code === null)? "Base64" : code;
}

// 设置默认编码 HEX / Base64
export function setDefaultCode(code: string) : void  {
  localStorage.setItem(DEFAULT_CODE,code);
}

const DEFAULT_PASSPHRASE = 'tea-crypto:default-passphrase';

// 获取默认密钥
export function getDefaultPassphrase() :string  {
  const passphrase = localStorage.getItem(DEFAULT_PASSPHRASE);
  return (passphrase === null)? "" : passphrase;
}

// 设置默认密钥
export function setDefaultPassphrase(passphrase: string) : void  {
  localStorage.setItem(DEFAULT_PASSPHRASE,passphrase);
}

// 根据输入的密钥长度生成密钥长度提示
export const genPassphraseLimitLength = (length :number) :number => {
  return 16; // TEA 密钥长度 16位
}


const DEFAULT_ROUND = 'tea-crypto:default-round';

// 获取默认循环次数
export function getDefaultRound() :string  {
  const round = localStorage.getItem(DEFAULT_ROUND);
  return (round === null)? "32" : round;
}

// 设置默认循环次数
export function setDefaultRound(round: string) : void  {
  localStorage.setItem(DEFAULT_ROUND, round);
}

// tea 加密
export const TeaEncrypt = (data :string,key :string,round :number) :Buffer | undefined => {
  return Buffer.alloc(data.length + 1)
  //return teaEncrypt(Buffer.from(data), Buffer.from(key), round);
}

// tea 解密
export const TeaDecrypt = (data :string,key :string,round :number) :Buffer | undefined => {
  return Buffer.alloc(data.length + 1)
}

// Default to 32 cycles.
// const ITER = 32;

// const data = Buffer.alloc(TEA_BLOCK_LEN + 1);

// const key = Buffer.alloc(TEA_KEY_LEN);

// const encrypted = teaEncrypt(data, key, ITER);

// const decrypted = teaDecrypt(encrypted, key, ITER);

// // // Same reference, but actually bytes changed.
// // assert(encrypted === data);

// // // The last byte, which is not aligned, was left untouched
// // assert(encrypted[TEA_BLOCK_LEN + 1] === 0);

// // const decrypted = teaDecrypt(encrypted, key, ITER);

// // assert(Buffer.compare(decrypted, Buffer.alloc(TEA_BLOCK_LEN + 1)) === 0);