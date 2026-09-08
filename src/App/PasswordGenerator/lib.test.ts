import { genPassword, passwordStrength, humanSeconds, PW_LENGTH_MIN } from './lib';

describe('genPassword 密码生成', () => {
  test('默认配置生成 16 位且四类字符齐全', () => {
    const p = genPassword();
    expect(p).toHaveLength(16);
    expect(/[A-Z]/.test(p)).toBe(true);
    expect(/[a-z]/.test(p)).toBe(true);
    expect(/\d/.test(p)).toBe(true);
    expect(/[^A-Za-z0-9]/.test(p)).toBe(true);
  });

  test('排除易混淆字符时不包含 IOlo01', () => {
    for (let i = 0; i < 30; i++) {
      const p = genPassword({ length: 32, excludeAmbiguous: true });
      expect(p).not.toMatch(/[IOlo01]/);
    }
  });

  test('仅数字模式输出纯数字', () => {
    const d = genPassword({
      length: 8, upper: false, lower: false, digit: true,
      symbol: false, excludeAmbiguous: false,
    });
    expect(d).toMatch(/^\d{8}$/);
  });

  test('全部关闭时回退为小写+数字', () => {
    const p = genPassword({
      length: 12, upper: false, lower: false, digit: false,
      symbol: false, excludeAmbiguous: false,
    });
    expect(p).toHaveLength(12);
    expect(/[A-Z]/.test(p)).toBe(false);
    expect(/[^a-z0-9]/.test(p)).toBe(false);
  });

  test('长度收敛到下限且重复生成不固定', () => {
    expect(genPassword({ length: 1 })).toHaveLength(PW_LENGTH_MIN);
    const a = genPassword({ length: 16 });
    const b = genPassword({ length: 16 });
    expect(a === b).toBe(false);
  });
});

describe('passwordStrength 强度检测', () => {
  test('纯数字短密码为极弱', () => {
    expect(passwordStrength('123456').level.key).toBe('very-weak');
    expect(passwordStrength('123456').crackedList).toBe(true);
    expect(passwordStrength('111111').score).toBe(0);
  });

  test('常见弱口令命中库 (含常见替换)', () => {
    expect(passwordStrength('password').score).toBe(0);
    expect(passwordStrength('Password1').score).toBe(0);
    expect(passwordStrength('P@ssw0rd123').crackedList).toBe(true);
    expect(passwordStrength('123456789').crackedList).toBe(true);
  });

  test('键盘连续序列被降级', () => {
    const r = passwordStrength('qwerty12345');
    expect(r.foundSequence).toBe(true);
    expect(r.score).toBeLessThanOrEqual(1);
  });

  test('连续重复字符有惩罚', () => {
    const r = passwordStrength('aA1aaaaaB2');
    expect(r.maxRun).toBeGreaterThanOrEqual(5);
  });

  test('典型强密码评分高', () => {
    const r = passwordStrength('Xk9#mQ2$vLz7@rB4');
    expect(r.level.key).toBe('very-strong');
    expect(r.score).toBe(4);
    expect(r.crackedList).toBe(false);
  });

  test('12 位大小写数字符号混合为强或以上', () => {
    const r = passwordStrength('Tr0ub4dor&3-xY');
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  test('长度不足 8 封顶为弱', () => {
    expect(passwordStrength('Ab3!xY9').score).toBeLessThanOrEqual(1);
  });

  test('空串返回 score 0', () => {
    expect(passwordStrength('').score).toBe(0);
  });
});

describe('humanSeconds 时长格式化', () => {
  test('基本单位', () => {
    expect(humanSeconds(1)).toContain('1');
    expect(humanSeconds(100)).toContain('分钟');
    expect(humanSeconds(86400)).toContain('天');
    expect(humanSeconds(3.156e7)).toContain('年');
  });
  test('超大数值', () => {
    expect(humanSeconds(Infinity)).toBe('超过 10 亿年');
    expect(humanSeconds(1e30)).toBe('超过 10 亿年');
  });
});
