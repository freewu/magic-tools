import bcrypt from 'bcryptjs'; // 仅构造固定盐参考哈希作为被测输入
import {
  BCRYPT_COST_MIN,
  bcryptCostOf,
  genBcrypt,
  isValidBcryptHash,
  verifyBcrypt,
} from './lib';

// 参考向量使用固定盐值, 结果与 python bcrypt (独立实现) 逐字节一致
describe('BCrypt 值计算 (独立工具)', () => {

  const SALT = '$2a$10$abcdefghijklmnopqrstuu';

  it('固定盐值 password 与 python bcrypt 结果一致', () => {
    expect(bcrypt.hashSync('password', '$2a$10$N9qo8uLOickgx2ZMRZoMye'))
      .toBe('$2a$10$N9qo8uLOickgx2ZMRZoMye8fOsiTWZqYtkxvXkKm8BMzjT7t/vIdq');
  });

  it('固定盐值空密码与 python bcrypt 结果一致', () => {
    expect(bcrypt.hashSync('', SALT))
      .toBe('$2a$10$abcdefghijklmnopqrstuujr5dF95nlffmIUNubpV71FPx1zncrEm');
  });

  it('固定盐值 UTF-8 中文与 python bcrypt 结果一致', () => {
    expect(bcrypt.hashSync('中文测试hello世界', SALT))
      .toBe('$2a$10$abcdefghijklmnopqrstuuSX0OZcyjNujgOEmlvwsVUL9Vosk5G8.');
  });

  it('genBcrypt 生成: 60 字符, 带成本 10 前缀, 可异步校验通过/失败', async () => {
    const hash = await genBcrypt('password', 10);
    expect(hash).toMatch(/^\$2[abyx]\$10\$[./A-Za-z0-9]{53}$/);
    expect(hash.length).toBe(60);
    expect(bcryptCostOf(hash)).toBe(10);
    expect(await verifyBcrypt('password', hash)).toBe(true);
    expect(await verifyBcrypt('wrong', hash)).toBe(false);
  });

  it('中文口令生成与校验一致', async () => {
    const hash = await genBcrypt('中文口令#密码$测试', 10);
    expect(await verifyBcrypt('中文口令#密码$测试', hash)).toBe(true);
    expect(await verifyBcrypt('中文口令', hash)).toBe(false);
  });

  it(`最小成本 ${BCRYPT_COST_MIN} 可用, 哈希可校验`, async () => {
    const hash = await genBcrypt('admin', BCRYPT_COST_MIN);
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifyBcrypt('admin', hash)).toBe(true);
  });

  it('成本低于 4 按 4 处理 (页面 InputNumber 已限 4~15)', async () => {
    const hash = await genBcrypt('x', 3);
    expect(hash.startsWith('$2b$04$')).toBe(true);
    expect(await verifyBcrypt('x', hash)).toBe(true);
  });

  it('isValidBcryptHash 识别合法/非法哈希', () => {
    expect(isValidBcryptHash('$2a$10$N9qo8uLOickgx2ZMRZoMye8fOsiTWZqYtkxvXkKm8BMzjT7t/vIdq')).toBe(true);
    expect(isValidBcryptHash('$2b$12$abcdefghijklmnopqrstuujr5dF95nlffmIUNubpV71FPx1zncrEm')).toBe(true);
    expect(isValidBcryptHash('$1$abcdefghijklmnopqrstuu')).toBe(false); // 非 bcrypt
    expect(isValidBcryptHash('plain')).toBe(false);
    expect(isValidBcryptHash('')).toBe(false);
    expect(bcryptCostOf('plain')).toBe(null);
  });
});
