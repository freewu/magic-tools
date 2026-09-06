// BCrypt 值计算: 口令 -> BCrypt 哈希 (含随机盐) / 哈希校验
// 底层为 bcryptjs (同步实现内核), 对外全部走异步回调以不阻塞渲染
import bcrypt from 'bcryptjs';

export const BCRYPT_COST_MIN = 4;
export const BCRYPT_COST_MAX = 15;
export const BCRYPT_DEFAULT_COST = 10;

/** 生成 BCrypt 哈希 (成本 4~31, 页面限制 4~15); 超过 72 字节的内容会被 bcrypt 截断 */
export const genBcrypt = (text: string, cost: number = BCRYPT_DEFAULT_COST): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    bcrypt.hash(text, cost, (err: Error | null, hash?: string) => {
      if (err || !hash) reject(err ?? new Error('BCrypt 生成失败'));
      else resolve(hash);
    });
  });

/** 校验口令与 BCrypt 哈希是否匹配 */
export const verifyBcrypt = (text: string, hash: string): Promise<boolean> =>
  new Promise<boolean>((resolve, reject) => {
    bcrypt.compare(text, hash, (err: Error | null, same?: boolean) => {
      if (err) reject(err);
      else resolve(!!same);
    });
  });

/** 哈希串是否符合 BCrypt 格式 ($2a/$2b/$2x/$2y + 成本 + 53 字符盐与摘要) */
export const isValidBcryptHash = (hash: string): boolean =>
  /^\$2[abxy]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(hash);

/** 从哈希串解析成本因子; 非法哈希返回 null */
export const bcryptCostOf = (hash: string): number | null => {
  const m = /^\$2[abxy]\$(\d{2})\$/.exec(hash);
  return m ? parseInt(m[1], 10) : null;
};
