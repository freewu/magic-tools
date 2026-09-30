import { getDefaultPasswordList, getPasswordList, setPasswordList } from './lib';

describe('Hash lib (常用密码列表)', () => {
  beforeEach(() => localStorage.clear());

  test('默认列表含 8 个常见弱口令', () => {
    const list = getDefaultPasswordList();
    expect(list).toHaveLength(8);
    expect(list).toContain('admin');
    expect(list).toContain('123456');
    expect(list).toContain('root');
    expect(list).toContain('password');
  });

  test('未设置时 getPasswordList 返回默认列表', () => {
    expect(getPasswordList()).toEqual(getDefaultPasswordList());
  });

  test('setPasswordList 持久化并可读回 (过滤空项)', () => {
    setPasswordList([ 'abc', 'def' ]);
    expect(getPasswordList()).toEqual([ 'abc', 'def' ]);

    // 存储含空串项 → 读出时被过滤
    setPasswordList([ '', 'x' ]);
    const filtered = getPasswordList();
    expect(filtered).toContain('x');
    expect(filtered).not.toContain('');
  });

  test('存储为空列表时回退默认', () => {
    setPasswordList([]);
    expect(getPasswordList()).toEqual(getDefaultPasswordList());
    // 只有空串也回退
    setPasswordList([ ' ', '' ]);
    expect(getPasswordList()).toEqual(getDefaultPasswordList());
  });
});
