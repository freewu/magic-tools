import {
  parseChmod,
  modeDigits,
  lsSymbol,
  symbolicMode,
  chmodCommand,
  bitsToChars,
  describeChmod,
  type ChmodPerm,
} from './lib';

describe('Chmod 数字/符号解读', () => {
  it('755 -> 属主 rwx / 属组 r-x / 其它 r-x', () => {
    const { perm } = parseChmod('755');
    expect(perm).toEqual({ special: 0, user: 7, group: 5, other: 5 });
  });

  it('0755 (前导 0) 等价 755', () => {
    expect(parseChmod('0755').perm).toEqual({ special: 0, user: 7, group: 5, other: 5 });
  });

  it('4755 -> 特殊位 setuid + 755', () => {
    const { perm } = parseChmod('4755');
    expect(perm.special).toBe(4);
    expect(perm).toEqual({ special: 4, user: 7, group: 5, other: 5 });
  });

  it('600 / 777 / 000', () => {
    expect(parseChmod('600').perm).toEqual({ special: 0, user: 6, group: 0, other: 0 });
    expect(parseChmod('777').perm.user).toBe(7);
    expect(parseChmod('000').perm).toEqual({ special: 0, user: 0, group: 0, other: 0 });
  });

  it('ls 风格 -rwxr-xr-x -> 755', () => {
    const { perm } = parseChmod('-rwxr-xr-x');
    expect(perm).toEqual({ special: 0, user: 7, group: 5, other: 5 });
  });

  it('ls 风格目录/链接带类型前缀', () => {
    expect(parseChmod('drwx------').typeChar).toBe('d');
    expect(parseChmod('drwx------').perm).toEqual({ special: 0, user: 7, group: 0, other: 0 });
    expect(parseChmod('lrwxrwxrwx').perm).toEqual({ special: 0, user: 7, group: 7, other: 7 });
  });

  it('特殊位符号: s/S/t/T', () => {
    expect(parseChmod('-rwsr-xr-x').perm.special).toBe(4);
    expect(parseChmod('-rwsr-xr-x').perm.user).toBe(7);
    expect(parseChmod('-r-Sr-xr-x').perm).toEqual({ special: 4, user: 4, group: 5, other: 5 });
    expect(parseChmod('-rwxr-sr-x').perm.special).toBe(2);
    expect(parseChmod('-rwxr-xr-t').perm).toEqual({ special: 1, user: 7, group: 5, other: 5 });
    expect(parseChmod('-rwsr-sr-t').perm).toEqual({ special: 7, user: 7, group: 5, other: 5 });
  });

  it('chmod 命令整行解读 (忽略文件名校验)', () => {
    const { perm } = parseChmod('chmod 755 myfile.sh');
    expect(perm).toEqual({ special: 0, user: 7, group: 5, other: 5 });
  });

  it('非法输入抛错', () => {
    expect(() => parseChmod('')).toThrow();
    expect(() => parseChmod('8')).toThrow();
    expect(() => parseChmod('888')).toThrow();
    expect(() => parseChmod('abc')).toThrow();
    expect(() => parseChmod('rwx')).toThrow();
    expect(() => parseChmod('-rwxr-x')).toThrow();
  });
});

describe('Chmod 生成', () => {
  const p755 :ChmodPerm = { special: 0, user: 7, group: 5, other: 5 };
  const p4755 :ChmodPerm = { special: 4, user: 7, group: 5, other: 5 };

  it('bitsToChars', () => {
    expect(bitsToChars(0)).toBe('---');
    expect(bitsToChars(1)).toBe('--x');
    expect(bitsToChars(7)).toBe('rwx');
    expect(bitsToChars(6)).toBe('rw-');
  });

  it('modeDigits 3/4 位与 ls 符号', () => {
    expect(modeDigits(p755)).toBe('755');
    expect(lsSymbol(p755)).toBe('rwxr-xr-x');
    expect(modeDigits(p4755)).toBe('4755');
    expect(lsSymbol(p4755)).toBe('rwsr-xr-x');
    const p = { special: 1, user: 7, group: 5, other: 5 };
    expect(modeDigits(p)).toBe('1755');
    expect(lsSymbol(p)).toBe('rwxr-xr-t');
    // setuid 无执行位 -> 大写 S
    const pS = { special: 4, user: 4, group: 5, other: 5 };
    expect(lsSymbol(pS)).toBe('r-Sr-xr-x');
  });

  it('symbolicMode', () => {
    expect(symbolicMode(p755)).toBe('u=rwx,g=rx,o=rx');
    expect(symbolicMode(p4755)).toBe('u=rwx,g=rx,o=rx,u+s');
    expect(symbolicMode({ special: 6, user: 7, group: 5, other: 5 })).toBe('u=rwx,g=rx,o=rx,u+s,g+s');
    expect(symbolicMode({ special: 7, user: 7, group: 5, other: 5 })).toBe('u=rwx,g=rx,o=rx,u+s,g+s,o+t');
  });

  it('chmodCommand', () => {
    expect(chmodCommand(p755, 'file.txt')).toBe('chmod 755 file.txt');
    expect(chmodCommand(p4755, '')).toBe('chmod 4755 file');
  });

  it('describeChmod 含义明细', () => {
    const rows = describeChmod(p4755);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ target: '属主 (user / u)', bits: 7, chars: 'rwx', read: true, write: true, exec: true, special: 'setuid (提权执行)' });
    expect(rows[1]).toMatchObject({ chars: 'r-x', special: '' });
    expect(rows[2]).toMatchObject({ chars: 'r-x' });
  });

  it('roundtrip: 数字/符号互转一致', () => {
    for (const input of ['755', '4755', '1777', '666', '000', '6713', '2755']) {
      const parsed = parseChmod(input).perm;
      expect(modeDigits(parseChmod(modeDigits(parsed)).perm)).toBe(modeDigits(parsed));
      const ls = lsSymbol(parsed);
      expect(lsSymbol(parseChmod(ls).perm)).toBe(ls);
    }
  });
});
