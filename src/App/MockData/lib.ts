// 数据生成: Mock.js 语法模板解析 + 规则生成 + JSON/JSONL/CSV/SQL 序列化
// 纯函数实现 (不依赖 mockjs), 便于单测; 随机性全部走 Math.random, 便于种子化扩展
import JSON5 from 'json5';
import { COUNT_MAX, COUNT_MIN, DEFAULT_COUNT, DEFAULT_FORMAT, DEFAULT_TABLE, FORMAT_LIST, type MockFormat } from './data';

// ---------------- 设置存取 (设置 → 生成器 → 数据生成) ----------------
const KEY_FORMAT = 'mock-data.format';
const KEY_TABLE = 'mock-data.table';
const KEY_COUNT = 'mock-data.count';

const rawGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const rawSet = (k: string, v: string): void => {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
};

/** 生成数量钳制到 [1, 1000] (非法值回退默认 100) */
export const clampCount = (v: number): number => {
  if (!Number.isFinite(v)) return DEFAULT_COUNT;
  return Math.min(COUNT_MAX, Math.max(COUNT_MIN, Math.round(v)));
};

export function getDefaultCount(): number {
  const v = rawGet(KEY_COUNT);
  if (v === null || v.trim() === '') return DEFAULT_COUNT;
  const n = Number(v);
  return Number.isFinite(n) ? clampCount(n) : DEFAULT_COUNT;
}
export function setDefaultCount(v: number): void {
  rawSet(KEY_COUNT, String(clampCount(v)));
}

/** 输出格式白名单校验 (读回设置 / 兼容旧值) */
export const isMockFormat = (v: unknown): v is MockFormat => FORMAT_LIST.some((f) => f.value === v);

export function getDefaultFormat(): MockFormat {
  const v = rawGet(KEY_FORMAT);
  return isMockFormat(v) ? v : DEFAULT_FORMAT;
}
export function setDefaultFormat(v: MockFormat): void {
  rawSet(KEY_FORMAT, isMockFormat(v) ? v : DEFAULT_FORMAT);
}

/** 表名规整: 只保留字母/数字/下划线/$, 数字开头补下划线, 空值回退默认表名 */
export function normalizeTable(v: string): string {
  const s = (v ?? '').trim().replace(/[^0-9A-Za-z_$]/g, '_').replace(/^([0-9])/, '_$1').slice(0, 64);
  return s === '' ? DEFAULT_TABLE : s;
}
export function getDefaultTable(): string {
  return normalizeTable(rawGet(KEY_TABLE) ?? DEFAULT_TABLE);
}
export function setDefaultTable(v: string): void {
  rawSet(KEY_TABLE, normalizeTable(v));
}

// ---------------- 随机工具 ----------------
const rand = (min: number, max: number): number => {
  const a = Math.ceil(Math.min(min, max));
  const b = Math.floor(Math.max(min, max));
  return a + Math.floor(Math.random() * (b - a + 1));
};
const pickOne = <T,>(arr: readonly T[]): T => arr[rand(0, arr.length - 1)];
const shuffle = <T,>(arr: readonly T[]): T[] => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(0, i);
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
};
const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// ---------------- 数据池 ----------------
const FIRST_EN = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
const LAST_EN = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const WORD_EN = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet',
  'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango',
  'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu', 'apple', 'banana', 'cherry', 'dragon',
  'eagle', 'falcon', 'grape', 'harbor', 'island', 'jungle', 'knight', 'lemon', 'magnet', 'nectar',
  'ocean', 'puzzle', 'quartz', 'rocket', 'silver', 'tiger', 'umbrella', 'violet', 'walnut', 'yellow'];
const SURNAME_CN = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭',
  '何', '林', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许', '邓', '冯', '韩', '曹', '曾', '彭', '蔡', '潘', '田', '董'];
const GIVEN_CN = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛',
  '明', '超', '秀兰', '霞', '平', '刚', '桂英', '燕', '辉', '鹏', '浩', '宇', '晨', '忻', '雨', '泽', '鑫', '琳', '文', '志'];
const CJK_CHARS = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严首底液官德随病苏失尔死讲配女黄推显谈罪神艺呢席含企望密批营项防举球英氧势告李台落木帮轮破亚师围注远字材排供河态封另施减树溶怎止案言士均武固叶鱼波视仅费紧爱左章早朝害续轻服试食充兵源判护司足某练差致板田降黑犯负击范继兴似余坚曲输修故城夫够送笑船占右财吃富春职觉汉画功巴跟虽杂飞检吸助升阳互初创抗考投坏策古径换未跑留钢曾端责站简述钱副尽帝射草冲承独令限阿宣环双请超微让控州良轴找否纪益依优顶础载倒房突坐粉敌略客袁冷胜绝析块剂测丝协重诉求机怎类';

/** 行政区划精简内置数据 (34 省级 + 常见城市) */
const PROVINCES: { name: string; cities: string[] }[] = [
  { name: '北京市', cities: ['北京市'] },
  { name: '天津市', cities: ['天津市'] },
  { name: '上海市', cities: ['上海市'] },
  { name: '重庆市', cities: ['重庆市'] },
  { name: '河北省', cities: ['石家庄市', '唐山市', '保定市', '邯郸市'] },
  { name: '山西省', cities: ['太原市', '大同市', '临汾市'] },
  { name: '辽宁省', cities: ['沈阳市', '大连市', '鞍山市'] },
  { name: '吉林省', cities: ['长春市', '吉林市', '延边州'] },
  { name: '黑龙江省', cities: ['哈尔滨市', '齐齐哈尔市', '大庆市'] },
  { name: '江苏省', cities: ['南京市', '苏州市', '无锡市', '徐州市'] },
  { name: '浙江省', cities: ['杭州市', '宁波市', '温州市', '金华市'] },
  { name: '安徽省', cities: ['合肥市', '芜湖市', '蚌埠市'] },
  { name: '福建省', cities: ['福州市', '厦门市', '泉州市'] },
  { name: '江西省', cities: ['南昌市', '赣州市', '九江市'] },
  { name: '山东省', cities: ['济南市', '青岛市', '烟台市', '潍坊市'] },
  { name: '河南省', cities: ['郑州市', '洛阳市', '南阳市'] },
  { name: '湖北省', cities: ['武汉市', '宜昌市', '襄阳市'] },
  { name: '湖南省', cities: ['长沙市', '株洲市', '衡阳市'] },
  { name: '广东省', cities: ['广州市', '深圳市', '珠海市', '东莞市', '佛山市'] },
  { name: '海南省', cities: ['海口市', '三亚市'] },
  { name: '四川省', cities: ['成都市', '绵阳市', '宜宾市'] },
  { name: '贵州省', cities: ['贵阳市', '遵义市', '安顺市'] },
  { name: '云南省', cities: ['昆明市', '大理州', '曲靖市'] },
  { name: '陕西省', cities: ['西安市', '宝鸡市', '咸阳市'] },
  { name: '甘肃省', cities: ['兰州市', '天水市', '酒泉市'] },
  { name: '青海省', cities: ['西宁市', '海东市'] },
  { name: '内蒙古自治区', cities: ['呼和浩特市', '包头市', '鄂尔多斯市'] },
  { name: '广西壮族自治区', cities: ['南宁市', '桂林市', '柳州市'] },
  { name: '西藏自治区', cities: ['拉萨市', '日喀则市'] },
  { name: '宁夏回族自治区', cities: ['银川市', '石嘴山市'] },
  { name: '新疆维吾尔自治区', cities: ['乌鲁木齐市', '喀什地区', '伊犁州'] },
  { name: '台湾省', cities: ['台北市', '高雄市', '台中市'] },
  { name: '香港特别行政区', cities: ['香港岛', '九龙', '新界'] },
  { name: '澳门特别行政区', cities: ['澳门半岛', '氹仔', '路环'] },
];
const COUNTIES = ['东城区', '西城区', '朝阳区', '海淀区', '开发区', '高新区', '新城区', '城关区', '长安区', '锦绣区'];
const REGIONS_CN = ['华北', '华东', '华南', '华中', '西南', '西北', '东北'];
const TLDS = ['com', 'cn', 'net', 'org', 'io', 'dev', 'info', 'biz', 'me'];
const POOL_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const POOL_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const POOL_NUMBER = '0123456789';
const POOL_SYMBOL = '!@#$%^&*()[]{}<>?/~';

// ---------------- 日期格式化 ----------------
const formatDate = (d: Date, fmt: string): string => {
  const map: Record<string, string> = {
    yyyy: String(d.getFullYear()), yy: pad(d.getFullYear() % 100),
    MM: pad(d.getMonth() + 1), M: String(d.getMonth() + 1),
    dd: pad(d.getDate()), d: String(d.getDate()),
    HH: pad(d.getHours()), H: String(d.getHours()),
    mm: pad(d.getMinutes()), m: String(d.getMinutes()),
    ss: pad(d.getSeconds()), s: String(d.getSeconds()),
    SSS: pad(d.getMilliseconds(), 3),
  };
  return fmt.replace(/yyyy|SSS|yy|MM|dd|HH|mm|ss|M|d|H|m|s/g, (k) => map[k] ?? k);
};
const randomPastDate = (): Date => new Date(Date.now() - rand(0, 365 * 24 * 3600 * 1000));

// ---------------- 键规则 ('name|rule') ----------------
export interface KeyRule {
  /** 真实字段名 (去掉 |规则) */
  name: string;
  /** 数量 / 数值范围下限 (无规则时为 undefined) */
  min?: number;
  /** 数量 / 数值范围上限 */
  max?: number;
  /** 小数位下限 / 上限 */
  dmin?: number;
  dmax?: number;
  /** 自增步长 ('|+1') */
  plus?: number;
}

/** 解析 '字段名|规则'; 规则支持 count / min-max / min-max.dmin-dmax / +step */
export function parseKey(key: string): KeyRule {
  const i = key.indexOf('|');
  if (i < 0) return { name: key };
  const name = key.slice(0, i);
  const rule = key.slice(i + 1).trim();
  if (rule === '') return { name };
  const plus = /^\+(\d+)$/.exec(rule);
  if (plus) return { name, plus: Number(plus[1]) };
  const m = /^(\d+)(?:-(\d+))?(?:\.(\d+)(?:-(\d+))?)?$/.exec(rule);
  if (!m) return { name };
  const min = Number(m[1]);
  const max = m[2] === undefined ? min : Math.max(min, Number(m[2]));
  const out: KeyRule = { name, min, max };
  if (m[3] !== undefined) {
    out.dmin = Number(m[3]);
    out.dmax = m[4] === undefined ? Number(m[3]) : Math.max(Number(m[3]), Number(m[4]));
  }
  return out;
}

// ---------------- 生成上下文 ----------------
export interface GenCtx {
  /** 自增计数器 (按路径区分) */
  inc: Map<string, number>;
}
const newCtx = (): GenCtx => ({ inc: new Map<string, number>() });

/** 自增: 首次返回起始值, 之后每次 +step (跨记录连续) */
const nextInc = (ctx: GenCtx, key: string, start: number, step: number): number => {
  const cur = ctx.inc.get(key);
  if (cur === undefined) { ctx.inc.set(key, start); return start; }
  const next = cur + step;
  ctx.inc.set(key, next);
  return next;
};

/** CSV 单元格文本 (嵌套对象/数组序列化为 JSON 字符串) */
const cellText = (v: unknown): string =>
  v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

// ---------------- 占位符 (@xxx) ----------------
const numArg = (args: unknown[], i: number, dflt: number): number => {
  const v = args[i];
  return typeof v === 'number' && Number.isFinite(v) ? v : dflt;
};
const strArg = (args: unknown[], i: number, dflt: string): string => (typeof args[i] === 'string' ? args[i] as string : dflt);

/** 按顶级逗号切分参数 (忽略引号/括号内的逗号) */
export const splitArgs = (s: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let quote = '';
  let cur = '';
  for (const ch of s) {
    if (quote !== '') {
      cur += ch;
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim() !== '' || out.length > 0) out.push(cur.trim());
  return out;
};
const parseArg = (raw: string): unknown => {
  const s = raw.trim();
  if (s === '') return '';
  try { return JSON5.parse(s); } catch { return s; }
};

const poolByName = (name: string): string => {
  switch (name) {
    case 'lower': return POOL_LOWER;
    case 'upper': return POOL_UPPER;
    case 'number': return POOL_NUMBER;
    case 'symbol': return POOL_SYMBOL;
    case 'alpha': return POOL_LOWER + POOL_UPPER;
    default: return name === '' ? POOL_LOWER + POOL_UPPER + POOL_NUMBER : name;
  }
};
const randStr = (pool: string, len: number): string => {
  let out = '';
  for (let i = 0; i < len; i++) out += pool[rand(0, pool.length - 1)];
  return out;
};
const wordOf = (min = 3, max = 8): string => {
  const cand = WORD_EN.filter((w) => w.length >= min && w.length <= max);
  return pickOne(cand.length > 0 ? cand : WORD_EN);
};
const cwordOf = (pool: string, min = 1, max = 4): string => randStr(pool === '' ? CJK_CHARS : pool, rand(min, max));
const hexOf = (len: number): string => randStr('0123456789abcdef', len);

/** 18 位身份证号 (含校验位) */
const idCard = (): string => {
  const prefix = pickOne(['110101', '310101', '440103', '440301', '330106', '510107', '420106', '320105']);
  const d = randomPastDate();
  const birth = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const seq = pad(rand(1, 999), 3);
  const body = prefix + birth + seq;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += Number(body[i]) * weights[i];
  const check = '10X98765432'[sum % 11];
  return body + check;
};

type Resolver = (args: unknown[], ctx: GenCtx) => unknown;

/** @占位符表 (Mock.js 常用子集) */
const PLACEHOLDERS: Record<string, Resolver> = {
  // 基础
  boolean: () => Math.random() < 0.5,
  natural: (a) => rand(0, numArg(a, 0, 10000)),
  integer: (a) => rand(numArg(a, 0, -10000), numArg(a, 1, 10000)),
  float: (a) => {
    const min = numArg(a, 0, -10000);
    const max = numArg(a, 1, 10000);
    const dmin = numArg(a, 2, 0);
    const dmax = Math.max(dmin, numArg(a, 3, dmin));
    const dec = rand(dmin, dmax);
    return Number((min + Math.random() * (max - min)).toFixed(dec));
  },
  character: (a) => {
    const pool = poolByName(strArg(a, 0, 'lower'));
    return pool[rand(0, pool.length - 1)];
  },
  string: (a) => {
    const first = a[0];
    if (typeof first === 'number') return randStr(poolByName('alpha'), first);
    const pool = poolByName(strArg(a, 0, 'alpha'));
    return randStr(pool, numArg(a, 1, rand(3, 10)));
  },
  range: (a) => {
    const start = numArg(a, 0, 0);
    const stop = numArg(a, 1, 10);
    const step = numArg(a, 2, 1) || 1;
    const out: number[] = [];
    for (let v = start; step > 0 ? v < stop : v > stop; v += step) out.push(v);
    return out;
  },
  // 日期时间
  date: (a) => formatDate(randomPastDate(), strArg(a, 0, 'yyyy-MM-dd')),
  time: (a) => formatDate(randomPastDate(), strArg(a, 0, 'HH:mm:ss')),
  datetime: (a) => formatDate(randomPastDate(), strArg(a, 0, 'yyyy-MM-dd HH:mm:ss')),
  now: (a) => {
    const d = new Date();
    const unit = strArg(a, 0, '');
    if (unit === 'year') d.setFullYear(d.getFullYear() + 1);
    else if (unit === 'month') d.setMonth(d.getMonth() + 1);
    else if (unit === 'week') d.setDate(d.getDate() + 7);
    else if (unit === 'day') d.setDate(d.getDate() + 1);
    else if (unit === 'hour') d.setHours(d.getHours() + 1);
    else if (unit === 'minute') d.setMinutes(d.getMinutes() + 1);
    else if (unit === 'second') d.setSeconds(d.getSeconds() + 1);
    return formatDate(d, strArg(a, 1, 'yyyy-MM-dd HH:mm:ss'));
  },
  // 文本
  word: (a) => wordOf(numArg(a, 0, 3), numArg(a, 1, 8)),
  sentence: (a) => {
    const n = rand(numArg(a, 0, 3), numArg(a, 1, 8));
    const words: string[] = [];
    for (let i = 0; i < n; i++) words.push(wordOf());
    const s = words.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  },
  title: (a) => {
    const n = rand(numArg(a, 0, 3), numArg(a, 1, 8));
    const words: string[] = [];
    for (let i = 0; i < n; i++) { const w = wordOf(); words.push(w.charAt(0).toUpperCase() + w.slice(1)); }
    return words.join(' ');
  },
  paragraph: (a) => {
    const n = rand(numArg(a, 0, 3), numArg(a, 1, 7));
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const m = rand(3, 8);
      const words: string[] = [];
      for (let j = 0; j < m; j++) words.push(wordOf());
      const s = words.join(' ');
      out.push(s.charAt(0).toUpperCase() + s.slice(1) + '.');
    }
    return out.join(' ');
  },
  cword: (a) => cwordOf(strArg(a, 0, ''), numArg(a, 1, 1), numArg(a, 2, 4)),
  csentence: (a) => cwordOf('', numArg(a, 0, 5), numArg(a, 1, 20)) + '。',
  ctitle: (a) => cwordOf('', numArg(a, 0, 3), numArg(a, 1, 10)),
  cparagraph: (a) => {
    const n = rand(numArg(a, 0, 3), numArg(a, 1, 7));
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(cwordOf('', 8, 20) + '。');
    return out.join('');
  },
  capitalize: (a) => {
    const s = strArg(a, 0, wordOf());
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  upper: (a) => strArg(a, 0, wordOf()).toUpperCase(),
  lower: (a) => strArg(a, 0, wordOf()).toLowerCase(),
  // 人名
  first: () => pickOne(FIRST_EN),
  last: () => pickOne(LAST_EN),
  name: () => pickOne(FIRST_EN) + ' ' + pickOne(LAST_EN),
  cfirst: () => pickOne(SURNAME_CN),
  clast: () => pickOne(GIVEN_CN),
  cname: () => pickOne(SURNAME_CN) + pickOne(GIVEN_CN),
  // 网络
  protocol: () => pickOne(['http', 'https']),
  tld: () => pickOne(TLDS),
  domain: () => wordOf(3, 8) + '.' + pickOne(TLDS),
  url: () => pickOne(['http', 'https']) + '://' + wordOf(3, 8) + '.' + pickOne(TLDS) + '/' + wordOf(3, 10),
  email: () => wordOf(3, 8) + rand(1, 99) + '@' + wordOf(3, 8) + '.' + pickOne(TLDS),
  ip: () => `${rand(1, 254)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
  // 颜色
  color: () => '#' + hexOf(6),
  hex: () => hexOf(6),
  rgb: () => `rgb(${rand(0, 255)}, ${rand(0, 255)}, ${rand(0, 255)})`,
  rgba: () => `rgba(${rand(0, 255)}, ${rand(0, 255)}, ${rand(0, 255)}, ${(Math.random()).toFixed(2)})`,
  hsl: () => `hsl(${rand(0, 360)}, ${rand(0, 100)}%, ${rand(0, 100)}%)`,
  // 行政区划 / 编码
  region: () => pickOne(REGIONS_CN),
  province: () => pickOne(PROVINCES).name,
  city: () => pickOne(pickOne(PROVINCES).cities),
  county: () => pickOne(COUNTIES),
  zip: () => randStr('0123456789', 6),
  id: () => idCard(),
  guid: () => {
    const h = (n: number): string => randStr('0123456789abcdef', n);
    return `${h(8)}-${h(4)}-4${h(3)}-${pickOne(['8', '9', 'a', 'b'])}${h(3)}-${h(12)}`;
  },
  // 其它
  increment: (a, ctx) => nextInc(ctx, 'ph:increment', 1, numArg(a, 0, 1)),
  pick: (a) => (Array.isArray(a[0]) ? pickOne(a[0]) : ''),
  shuffle: (a) => (Array.isArray(a[0]) ? shuffle(a[0]) : []),
};

const resolveOne = (name: string, args: unknown[], ctx: GenCtx): unknown => {
  const fn = PLACEHOLDERS[name];
  return fn ? fn(args, ctx) : undefined;
};

const FULL_PLACEHOLDER = /^@([A-Za-z_]\w*)(?:\(([\s\S]*)\))?$/;
const MIX_PLACEHOLDER = /^@([A-Za-z_]\w*)(?:\(([^()]*)\))?/;

/**
 * 解析字符串中的 @占位符
 * - 整串就是一个占位符时返回原生值 (数字/布尔/数组), 否则按字符串拼接
 * - '\@' 转义为字面量 '@'; 未知占位符原样保留
 */
export function resolvePlaceholders(text: string, ctx: GenCtx): unknown {
  const t = text.trim();
  const full = FULL_PLACEHOLDER.exec(t);
  if (full) {
    const args = full[2] === undefined ? [] : splitArgs(full[2]).map(parseArg);
    const v = resolveOne(full[1], args, ctx);
    return v === undefined ? text : v;
  }
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && text[i + 1] === '@') { out += '@'; i += 2; continue; }
    if (ch !== '@') { out += ch; i++; continue; }
    const m = MIX_PLACEHOLDER.exec(text.slice(i));
    if (!m) { out += ch; i++; continue; }
    const args = m[2] === undefined ? [] : splitArgs(m[2]).map(parseArg);
    const v = resolveOne(m[1], args, ctx);
    out += v === undefined ? m[0] : String(v);
    i += m[0].length;
  }
  return out;
}

// ---------------- 模板生成 ----------------
const randRange = (kr: KeyRule): number => rand(kr.min ?? 1, kr.max ?? kr.min ?? 1);

/**
 * 生成一个值 (按 Mock.js 规则)
 * @param tpl  模板值
 * @param key  该值在父对象中的键 (可能带 |规则); 数组元素传 ''
 * @param path 生成路径 (自增计数器按路径区分)
 */
export function genValue(tpl: unknown, key: string, path: string, ctx: GenCtx): unknown {
  const kr = parseKey(key);
  const p = path === '' ? kr.name : path + '.' + kr.name;

  // 字符串: 数量规则 = 重复 N 次 (每次重新解析占位符)
  if (typeof tpl === 'string') {
    if (kr.min !== undefined) {
      const n = randRange(kr);
      let out = '';
      for (let i = 0; i < n; i++) out += String(resolvePlaceholders(tpl, ctx));
      return out;
    }
    return resolvePlaceholders(tpl, ctx);
  }

  // 数字: +step 自增 / min-max(.dmin-dmax) 随机
  if (typeof tpl === 'number') {
    if (kr.plus !== undefined) return nextInc(ctx, p, tpl, kr.plus);
    if (kr.min !== undefined) {
      if (kr.dmin !== undefined) {
        const dec = rand(kr.dmin, kr.dmax ?? kr.dmin);
        return Number((randRange(kr) + Math.random()).toFixed(dec));
      }
      return randRange(kr);
    }
    return tpl;
  }

  // 布尔: 数量规则 = 为 true 的概率 (count => 1/(count+1), min-max => min/(min+max))
  if (typeof tpl === 'boolean') {
    if (kr.min !== undefined) {
      const prob = kr.max === undefined || kr.max === kr.min ? 1 / (kr.min + 1) : kr.min / (kr.min + kr.max);
      return Math.random() < prob;
    }
    return tpl;
  }

  // 数组: +step 顺序取 / count 生成 N 个元素 (|1 且多元素 = 随机取一个)
  if (Array.isArray(tpl)) {
    if (tpl.length === 0) return [];
    if (kr.plus !== undefined) {
      const idx = ctx.inc.get('seq:' + p) ?? 0;
      ctx.inc.set('seq:' + p, idx + 1);
      return genValue(tpl[idx % tpl.length], '', p + `[${idx % tpl.length}]`, ctx);
    }
    if (kr.min !== undefined) {
      if (kr.min === 1 && kr.max === 1 && tpl.length > 1) return genValue(pickOne(tpl), '', p + '[pick]', ctx);
      const n = randRange(kr);
      const out: unknown[] = [];
      for (let i = 0; i < n; i++) out.push(genValue(pickOne(tpl), '', p + `[${i}]`, ctx));
      return out;
    }
    return tpl.map((v, i) => genValue(v, '', p + `[${i}]`, ctx));
  }

  // 对象: count 规则 = 随机取 N 个属性
  if (isPlainObject(tpl)) {
    const keys = Object.keys(tpl);
    const use = kr.min === undefined ? keys : shuffle(keys).slice(0, Math.min(randRange(kr), keys.length));
    const out: Record<string, unknown> = {};
    for (const k of use) out[parseKey(k).name] = genValue(tpl[k], k, p, ctx);
    return out;
  }

  return tpl;
}

/** 模板解析结果 */
export type TemplateResult =
  | { ok: true; tpl: Record<string, unknown> }
  | { ok: false; code: 'parse' | 'root'; detail?: string };

/**
 * 解析模板 (JSON5): 根节点必须是对象 (表示一条记录)
 * 便捷写法: 根节点只有一个带数量规则的数组字段时, 自动改用其元素模板 (兼容 Mock.js 的 list 写法)
 */
export function parseTemplate(text: string): TemplateResult {
  let parsed: unknown;
  try {
    parsed = JSON5.parse(text);
  } catch (e) {
    return { ok: false, code: 'parse', detail: e instanceof Error ? e.message : String(e) };
  }
  if (!isPlainObject(parsed)) return { ok: false, code: 'root' };
  const keys = Object.keys(parsed);
  if (keys.length === 1) {
    const v = parsed[keys[0]];
    if (parseKey(keys[0]).min !== undefined && Array.isArray(v) && v.length === 1 && isPlainObject(v[0])) {
      return { ok: true, tpl: v[0] };
    }
  }
  return { ok: true, tpl: parsed };
}

/** 按模板生成 count 条记录 (自增规则跨记录连续) */
export function generateRows(tpl: Record<string, unknown>, count: number): Record<string, unknown>[] {
  const ctx = newCtx();
  const n = clampCount(count);
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < n; i++) {
    const row = genValue(tpl, '', '#', ctx);
    out.push(isPlainObject(row) ? row : { value: row });
  }
  return out;
}

// ---------------- 序列化 ----------------
/** 收集所有列名 (按出现顺序去重) */
const columnsOf = (rows: Record<string, unknown>[]): string[] => {
  const cols: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  return cols;
};

const csvCell = (v: unknown): string => {
  const s = cellText(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

/** CSV (嵌套对象/数组按 JSON 字符串写入单元格) */
export function toCsv(rows: Record<string, unknown>[], header = true): string {
  if (rows.length === 0) return '';
  const cols = columnsOf(rows);
  const lines = rows.map((r) => cols.map((c) => csvCell(r[c])).join(','));
  return (header ? [cols.map(csvCell).join(',')] : []).concat(lines).join('\n');
}

/** JSONL (JSON Lines / NDJSON): 每行一条记录的紧凑 JSON, 便于流式读取与大数据导入 */
export function toJsonl(rows: Record<string, unknown>[]): string {
  return rows.map((r) => JSON.stringify(r) ?? 'null').join('\n');
}

const quoteSql = (s: string): string => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";

/** SQL 值字面量 */
export function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'object') return quoteSql(JSON.stringify(v));
  return quoteSql(String(v));
}

/** 由值推断列类型 (建表语句用) */
export function sqlTypeOf(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? 'INT' : 'DOUBLE';
  if (typeof v === 'boolean') return 'TINYINT(1)';
  if (v === null || v === undefined) return 'TEXT';
  if (typeof v === 'object') return 'TEXT';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'DATE';
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s)) return 'DATETIME';
  return s.length > 255 ? 'TEXT' : 'VARCHAR(255)';
}

/** SQL: 可选 CREATE TABLE + 每行一条 INSERT */
export function toSql(rows: Record<string, unknown>[], table: string, createTable: boolean): string {
  if (rows.length === 0) return '';
  const t = normalizeTable(table);
  const cols = columnsOf(rows);
  const parts: string[] = [];
  if (createTable) {
    const defs = cols.map((c) => {
      const sample = rows.find((r) => r[c] !== null && r[c] !== undefined)?.[c];
      return '  `' + c + '` ' + sqlTypeOf(sample);
    });
    parts.push('CREATE TABLE `' + t + '` (\n' + defs.join(',\n') + '\n);');
  }
  for (const r of rows) {
    const keys = Object.keys(r);
    if (keys.length === 0) continue;
    parts.push(
      'INSERT INTO `' + t + '` (' + keys.map((k) => '`' + k + '`').join(', ') + ') VALUES (' +
      keys.map((k) => sqlValue(r[k])).join(', ') + ');'
    );
  }
  return parts.join('\n');
}

// ---------------- 对外入口 ----------------
export interface GenInput {
  format: MockFormat;
  count: number;
  tableName?: string;
  createTable?: boolean;
  csvHeader?: boolean;
}

export type GenResult =
  | { ok: true; text: string; rows: Record<string, unknown>[] }
  | { ok: false; code: 'parse' | 'root'; detail?: string };

/** 模板文本 -> 目标格式文本 */
export function generateOutput(text: string, input: GenInput): GenResult {
  const parsed = parseTemplate(text);
  if (!parsed.ok) return { ok: false, code: parsed.code, detail: parsed.detail };
  const rows = generateRows(parsed.tpl, input.count);
  const format = input.format;
  const out = format === 'csv'
    ? toCsv(rows, input.csvHeader ?? true)
    : format === 'sql'
      ? toSql(rows, input.tableName ?? DEFAULT_TABLE, input.createTable ?? false)
      : format === 'jsonl'
        ? toJsonl(rows)
        : JSON.stringify(rows, null, 2);
  return { ok: true, text: out, rows };
}
