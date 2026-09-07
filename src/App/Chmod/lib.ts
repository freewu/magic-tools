// chmod 权限位工具
// 位值: 读 4 / 写 2 / 执行 1; 特殊位: setuid 4 / setgid 2 / sticky 1
export type ChmodPerm = {
  special :number; // 0-7: setuid(4) setgid(2) sticky(1)
  user :number;    // 0-7 属主
  group :number;   // 0-7 属组
  other :number;   // 0-7 其它
};

const OCT_TO_CHARS :Record<number, string> = {
  0: '---', 1: '--x', 2: '-w-', 3: '-wx', 4: 'r--', 5: 'r-x', 6: 'rw-', 7: 'rwx',
};

export const bitsToChars = (bits :number) :string => OCT_TO_CHARS[bits & 7] ?? '---';

const digit = (bits :number) :number => (bits & 7);

// 按 special 渲染 9 位 ls 符号 (-rwsr-xr-x 之类)
export const lsSymbol = (p :ChmodPerm) :string => {
  const base = bitsToChars(digit(p.user)) + bitsToChars(digit(p.group)) + bitsToChars(digit(p.other));
  const arr = base.split('');
  // user 位: setuid
  if (p.special & 4) arr[2] = (p.user & 1) ? 's' : 'S';
  if (p.special & 2) arr[5] = (p.group & 1) ? 's' : 'S';
  if (p.special & 1) arr[8] = (p.other & 1) ? 't' : 'T';
  return arr.join('');
};

// 数字 chmod 值: 3 位 (如 755) / 有特殊位则 4 位 (如 4755)
export const modeDigits = (p :ChmodPerm) :string => {
  const base = `${digit(p.user)}${digit(p.group)}${digit(p.other)}`;
  return p.special === 0 ? base : `${p.special}${base}`;
};

// 符号写法命令参数: u=rwx,g=rx,o=rx[,u+s][,g+s][,o+t]
export const symbolicMode = (p :ChmodPerm) :string => {
  const parts :string[] = [
    `u=${bitsToChars(digit(p.user)).replace(/-/g, '')}`,
    `g=${bitsToChars(digit(p.group)).replace(/-/g, '')}`,
    `o=${bitsToChars(digit(p.other)).replace(/-/g, '')}`,
  ];
  if (p.special & 4) parts.push('u+s');
  if (p.special & 2) parts.push('g+s');
  if (p.special & 1) parts.push('o+t');
  return parts.join(',');
};

export const chmodCommand = (p :ChmodPerm, filename :string) :string =>
  `chmod ${modeDigits(p)} ${filename || 'file'}`;

export type ChmodMeaning = {
  target :string; // 属主 user / 属组 group / 其它 other
  bits :number;
  chars :string;
  read :boolean;
  write :boolean;
  exec :boolean;
  special :string; // setuid/setgid/sticky 说明
};

// 输出可展示的含义明细
export const describeChmod = (p :ChmodPerm) :ChmodMeaning[] => {
  const rows = [
    { target: '属主 (user / u)', bits: digit(p.user) },
    { target: '属组 (group / g)', bits: digit(p.group) },
    { target: '其它 (other / o)', bits: digit(p.other) },
  ];
  return rows.map((r, i) => {
    let special = '';
    if (i === 0 && (p.special & 4)) special = 'setuid (提权执行)';
    if (i === 1 && (p.special & 2)) special = 'setgid (继承属组)';
    if (i === 2 && (p.special & 1)) special = 'sticky (防删除)';
    return {
      target: r.target,
      bits: r.bits,
      chars: bitsToChars(r.bits),
      read: (r.bits & 4) !== 0,
      write: (r.bits & 2) !== 0,
      exec: (r.bits & 1) !== 0,
      special,
    };
  });
};

// ---------- 解读 ----------
export type ParsedChmod = {
  perm :ChmodPerm;
  typeChar :string; // ls 类型字符 (- 文件 / d 目录 / l 链接…)
};

// 数字(755/4755/0777)或 ls 符号(-rwxr-xr-x)或 chmod 命令均可解读; 失败抛 Error
export const parseChmod = (input :string) :ParsedChmod => {
  let s = input.trim();
  if (s === '') throw new Error('输入为空');
  s = s.replace(/^chmod\s+/iu, '');
  const token = s.split(/\s+/u)[0] ?? '';
  // ls 风格: 可选类型前缀后接 9 位权限
  const lsMatch = token.match(/^([-dlbcps])?([rwxXsStT-]{9})$/u);
  if (lsMatch) {
    const bits9 = lsMatch[2];
    const groupCh = (i :number) :string => bits9.slice(3 * i, 3 * i + 3);
    const userStr = groupCh(0);
    const groupStr = groupCh(1);
    const otherStr = groupCh(2);
    const u = (userStr[0] === 'r' ? 4 : 0) | (userStr[1] === 'w' ? 2 : 0) | (userStr[2] === 'x' || userStr[2] === 's' ? 1 : 0);
    const g = (groupStr[0] === 'r' ? 4 : 0) | (groupStr[1] === 'w' ? 2 : 0) | (groupStr[2] === 'x' || groupStr[2] === 's' ? 1 : 0);
    const o = (otherStr[0] === 'r' ? 4 : 0) | (otherStr[1] === 'w' ? 2 : 0) | (otherStr[2] === 'x' || otherStr[2] === 't' ? 1 : 0);
    let special = 0;
    if (userStr[2] === 's' || userStr[2] === 'S') special |= 4;
    if (groupStr[2] === 's' || groupStr[2] === 'S') special |= 2;
    if (otherStr[2] === 't' || otherStr[2] === 'T') special |= 1;
    return { perm: { special, user: u, group: g, other: o }, typeChar: lsMatch[1] ?? '-' };
  }
  // 数字风格
  if (/^[0-7]{3,4}$/u.test(token)) {
    const digits = token.padStart(4, '0'); // 3 位时前补 special=0
    const special = Number(digits[0]);
    const user = Number(digits[1]);
    const group = Number(digits[2]);
    const other = Number(digits[3]);
    return { perm: { special, user, group, other }, typeChar: '-' };
  }
  throw new Error(`无法识别的权限格式: "${token}" (支持 755 / 4755 / -rwxr-xr-x 等)`);
};
