// 希尔密码 (Hill Cipher): 基于线性代数的分组密码
// 密钥为 n×n 字母矩阵 (密钥串长度需为完全平方: 4 → 2×2, 9 → 3×3), 明文按 n 个字母一组
// 与矩阵相乘 (mod 26) 得密文组; 解密需矩阵行列式与 26 互质 (存在模逆)

/** 密钥串 -> 字母序号矩阵 (行优先) */
const keyToMatrix = (key :string) :number[][] => {
  const letters = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length !== 4 && letters.length !== 9) {
    throw new Error('密钥长度需为 4 (2×2 矩阵) 或 9 (3×3 矩阵), 例如 HILL / GYBNQKURP');
  }
  const n = Math.sqrt(letters.length);
  const m :number[][] = [];
  for (let i = 0; i < n; i++) {
    const row :number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(letters.charCodeAt(i * n + j) - 65);
    }
    m.push(row);
  }
  return m;
};

/** 提取文本中的字母 (A-Z), 转大写序号 */
const lettersOf = (text :string) :number[] =>
  Array.from(text.toUpperCase().replace(/[^A-Z]/g, ''), (ch) => ch.charCodeAt(0) - 65);

/** 矩阵与列向量相乘 (mod 26) */
const mulMatVec = (m :number[][], v :number[]) :number[] =>
  m.map((row) => {
    let s = 0;
    for (let j = 0; j < row.length; j++) s += row[j] * v[j];
    return ((s % 26) + 26) % 26;
  });

/** 去掉矩阵第 r 行第 c 列后的子矩阵 */
const minor = (m :number[][], r :number, c :number) :number[][] =>
  m.filter((_, i) => i !== r).map((row) => row.filter((_, j) => j !== c));

/** 整数行列式 (m 尺寸 ≤ 3) */
const det = (m :number[][]) :number => {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let s = 0;
  for (let j = 0; j < n; j++) {
    const sign = j % 2 === 0 ? 1 : -1;
    s += sign * m[0][j] * det(minor(m, 0, j));
  }
  return s;
};

/** a 关于 26 的模逆 (1..25), 不存在返回 null */
const modInverse = (a :number) :number | null => {
  let t = 0, nt = 1, r = 26, nr = ((a % 26) + 26) % 26;
  while (nr !== 0) {
    const q = Math.floor(r / nr);
    [t, nt] = [nt, t - q * nt];
    [r, nr] = [nr, r - q * nr];
  }
  if (r !== 1) return null;
  return ((t % 26) + 26) % 26;
};

/** 矩阵求模逆 (adjugate × det^-1), 不可逆返回 null */
const invertMatrix = (m :number[][]) :number[][] | null => {
  const n = m.length;
  const d = ((det(m) % 26) + 26) % 26;
  const invDet = modInverse(d);
  if (invDet === null) return null;
  const inv :number[][] = [];
  for (let i = 0; i < n; i++) {
    const row :number[] = [];
    for (let j = 0; j < n; j++) {
      const cof = det(minor(m, j, i)) * ((i + j) % 2 === 0 ? 1 : -1); // adj 转置交换下标
      row.push((((cof % 26) + 26) % 26) * invDet % 26);
    }
    inv.push(row);
  }
  return inv;
};

/** 希尔加密: 仅处理 A-Z (自动移除其它字符), 末尾自动补 X 至分块整数倍 */
export const hillEncrypt = (text :string, key :string) :string => {
  const m = keyToMatrix(key);
  const n = m.length;
  const nums = lettersOf(text);
  if (nums.length === 0) return '';
  // 补 X 到 n 的整数倍
  while (nums.length % n !== 0) nums.push(23);
  let out = '';
  for (let i = 0; i < nums.length; i += n) {
    const block = nums.slice(i, i + n);
    for (const c of mulMatVec(m, block)) out += String.fromCharCode(c + 65);
  }
  return out;
};

/** 希尔解密: 密文须全为字母且长度为 n 的整数倍; 密钥矩阵不可逆时报错 */
export const hillDecrypt = (cipher :string, key :string) :string => {
  const m = keyToMatrix(key);
  const n = m.length;
  const inv = invertMatrix(m);
  if (inv === null) throw new Error('密钥矩阵不可逆 (行列式需与 26 互质), 无法解密');
  const nums = lettersOf(cipher);
  if (nums.length === 0) return '';
  if (nums.length % n !== 0) throw new Error(`密文长度需为 ${n} 的整数倍 (当前 ${nums.length} 个字母)`);
  let out = '';
  for (let i = 0; i < nums.length; i += n) {
    const block = nums.slice(i, i + n);
    for (const c of mulMatVec(inv, block)) out += String.fromCharCode(c + 65);
  }
  return out;
};

/** 密钥矩阵阶数 (2 / 3), 非法返回 0 */
export const hillKeySize = (key :string) :number => {
  const letters = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length === 4) return 2;
  if (letters.length === 9) return 3;
  return 0;
};

/** 密钥串是否长度合法 (可为空) */
export const hillKeyShapeValid = (key :string) :boolean =>
  hillKeySize(key) !== 0 || key.toUpperCase().replace(/[^A-Z]/g, '') === '';

// -------- 默认密钥 (localStorage) --------
const DEFAULT_KEY_ITEM = 'hill-crypto:default-key';

/** 获取默认密钥 */
export const getDefaultKey = () :string =>
  localStorage.getItem(DEFAULT_KEY_ITEM) ?? '';

/** 保存默认密钥 (存大写字母串) */
export const setDefaultKey = (key :string) :void => {
  localStorage.setItem(DEFAULT_KEY_ITEM, key.toUpperCase().replace(/[^A-Z]/g, ''));
};
