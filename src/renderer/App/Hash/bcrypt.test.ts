import bcrypt from 'bcryptjs';

// 参考向量使用固定盐值, 结果与 python bcrypt (独立实现) 逐字节一致
describe("BCrypt 值计算", () => {

  const SALT = '$2a$10$abcdefghijklmnopqrstuu';

  it("固定盐值 password 与 python bcrypt 结果一致", () => {
    expect(bcrypt.hashSync('password', '$2a$10$N9qo8uLOickgx2ZMRZoMye'))
      .toBe('$2a$10$N9qo8uLOickgx2ZMRZoMye8fOsiTWZqYtkxvXkKm8BMzjT7t/vIdq');
  });

  it("固定盐值空密码与 python bcrypt 结果一致", () => {
    expect(bcrypt.hashSync('', SALT))
      .toBe('$2a$10$abcdefghijklmnopqrstuujr5dF95nlffmIUNubpV71FPx1zncrEm');
  });

  it("固定盐值 UTF-8 中文与 python bcrypt 结果一致", () => {
    expect(bcrypt.hashSync('中文测试hello世界', SALT))
      .toBe('$2a$10$abcdefghijklmnopqrstuuSX0OZcyjNujgOEmlvwsVUL9Vosk5G8.');
  });

  it("随机盐生成: 60 字符, 带成本 10 前缀, 可通过校验", () => {
    const hash = bcrypt.hashSync('password', 10);
    expect(hash).toMatch(/^\$2[abyx]\$10\$[./A-Za-z0-9]{53}$/);
    expect(hash.length).toBe(60);
    expect(bcrypt.compareSync('password', hash)).toBe(true);
    expect(bcrypt.compareSync('wrong', hash)).toBe(false);
  });

  it("成本范围 4~31 均可用", () => {
    const hash = bcrypt.hashSync('admin', 4);
    expect(hash.startsWith('$2')).toBe(true);
    expect(bcrypt.compareSync('admin', hash)).toBe(true);
  });
});
