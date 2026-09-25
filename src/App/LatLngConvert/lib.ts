// 经纬度格式转换: 十进制 (DD) / 度分秒 (DMS) / 度分 (DM) / 国家标准 (DDMM.mm) 互转
// 纯函数实现, 页面与单测共用 (不依赖 DOM)

// 支持解析/输出的四种格式
export type CoordFormat = 'DD' | 'DMS' | 'DM' | 'NMEA';
// 输出格式 (含 AUTO 仅用于输入)
export type InputFormat = 'AUTO' | CoordFormat;
// 方向字母
export type Hemi = 'N' | 'S' | 'E' | 'W';
// 书写顺序
export type Order = 'latlng' | 'lnglat';

export interface ParsedCoord {
  /** 有符号十进制度 (南纬/西经为负) */
  value: number;
  /** 原方向字母 (无方向字母时为 null) */
  hemi: Hemi | null;
  /** 解析所用格式 */
  format: CoordFormat;
}

export interface CoordRow {
  /** 格式标识 */
  key: CoordFormat;
  /** 纬度文本 */
  lat: string;
  /** 经度文本 */
  lng: string;
  /** 组合文本 (纬度, 经度) */
  pair: string;
}

export interface ConvertResult {
  /** 解析出的十进制度 */
  lat: number;
  lng: number;
  /** 实际使用的输入格式 (AUTO 时为首个坐标的识别结果) */
  inputFormat: CoordFormat;
  /** 各格式输出 (纬度 / 经度 / 组合) */
  rows: CoordRow[];
}

// 带错误码的转换异常, 便于页面按语言渲染提示
export class CoordError extends Error {
  code: string;
  extra: string;
  constructor(code: string, message: string, extra = '') {
    super(message);
    this.name = 'CoordError';
    this.code = code;
    this.extra = extra;
  }
}

// ---------- 解析 ----------

// 方向字母只认「首/尾」的 N/S/E/W (避免把 d/m/s 简写的 s(秒) 误判为南纬)
const extractHemi = (token: string): Hemi | null => {
  const t = token.trim();
  if (t === '') return null;
  const last = t[t.length - 1];
  if (/[NSEWnsew]/.test(last)) return last.toUpperCase() as Hemi;
  const first = t[0];
  if (/[NSEWnsew]/.test(first)) return first.toUpperCase() as Hemi;
  return null;
};

// 抽取方向字母与全部数字 (忽略 ° ′ ″ 度分秒等符号)
const extractNumbers = (token: string): { hemi: Hemi | null; nums: number[] } => {
  const hemi = extractHemi(token);
  const cleaned = token.replace(/[NSEWnsew]/g, ' ');
  const parts = cleaned.split(/[^0-9.+-]+/).filter((s) => /[0-9]/.test(s));
  const nums = parts.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  return { hemi, nums };
};

// 是否带负号
const hasNegative = (token: string): boolean => /[-−]/.test(token.replace(/[NSEWnsew]/g, ' '));

// 自动识别单个坐标的书写格式
export const detectFormat = (token: string): CoordFormat => {
  const { hemi, nums } = extractNumbers(token);
  if (nums.length >= 3) return 'DMS';
  if (nums.length === 2) return 'DM';
  if (nums.length === 1) {
    const i = Math.floor(Math.abs(nums[0]));
    // 十进制纬度 <= 90, 经度 <= 180; 超出该范围且带方向字母 => 国家标准 DDMM.mm
    if (hemi && ((hemi === 'N' || hemi === 'S') ? i >= 100 : i > 180)) return 'NMEA';
    return 'DD';
  }
  throw new CoordError('INVALID', '无法识别坐标: ' + token, token);
};

// 解析单个坐标为有符号十进制度
export const parseCoord = (token: string, format: CoordFormat): ParsedCoord => {
  const { hemi, nums } = extractNumbers(token);
  if (nums.length === 0) throw new CoordError('INVALID', '无法识别坐标: ' + token, token);
  const sign = hemi === 'S' || hemi === 'W' ? -1 : hemi === 'N' || hemi === 'E' ? 1 : hasNegative(token) ? -1 : 1;
  let mag = 0;
  switch (format) {
    case 'DMS':
      mag = Math.abs(nums[0]) + (nums[1] ?? 0) / 60 + (nums[2] ?? 0) / 3600;
      break;
    case 'DM':
      mag = Math.abs(nums[0]) + (nums[1] ?? 0) / 60;
      break;
    case 'NMEA': {
      const a = Math.abs(nums[0]);
      const deg = Math.floor(a / 100);
      mag = deg + (a - deg * 100) / 60;
      break;
    }
    case 'DD':
    default:
      mag = Math.abs(nums[0]);
      break;
  }
  return { value: sign * mag, hemi, format };
};

// 按逗号 (含中英文) 或方向字母/空白切分出一对坐标
export const splitPair = (raw: string): string[] => {
  const s = raw.replace(/[，,;；、]/g, ',').trim();
  if (s === '') return [];
  if (s.includes(',')) {
    return s.split(',').map((x) => x.trim()).filter((x) => x !== '');
  }
  // 无逗号: 若恰好有两个方向字母, 按方向字母切分 (如 "39°54′27″N 116°23′26″E")
  const byHemi = s.match(/[^NSEW]*[NSEW]/g);
  if (byHemi && byHemi.length === 2) return byHemi.map((x) => x.trim()).filter((x) => x !== '');
  // 纯数字 / 空白分隔
  return s.split(/\s+/).map((x) => x.trim()).filter((x) => x !== '');
};

// ---------- 输出 ----------

const trimZeros = (s: string): string => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

// 补零到两位整数 (保留小数), fixed=true 时保留全部小数位
const padNum = (n: number, digits: number, fixed = false): string => {
  const s = n.toFixed(digits);
  const out = fixed ? s : trimZeros(s);
  const [i, f] = out.split('.');
  return f ? `${i.padStart(2, '0')}.${f}` : i.padStart(2, '0');
};

// 方向字母
export const hemiOf = (v: number, isLat: boolean): Hemi => {
  if (isLat) return v < 0 ? 'S' : 'N';
  return v < 0 ? 'W' : 'E';
};

// 十进制 (DD): 有符号小数度
export const formatDD = (v: number, digits = 6): string => trimZeros(v.toFixed(digits));

// 度分秒 (DMS): 39°12′20.41″N
export const formatDMS = (v: number, isLat: boolean, secDigits = 2): string => {
  const hemi = hemiOf(v, isLat);
  const a = Math.abs(v);
  let deg = Math.floor(a);
  let min = Math.floor((a - deg) * 60);
  let sec = Number((((a - deg) * 60 - min) * 60).toFixed(secDigits));
  if (sec >= 60) { sec -= 60; min += 1; }
  if (min >= 60) { min -= 60; deg += 1; }
  return `${deg}°${padNum(min, 0)}′${padNum(sec, secDigits)}″${hemi}`;
};

// 度分 (DM): 39°12.3402′N
export const formatDM = (v: number, isLat: boolean, minDigits = 4): string => {
  const hemi = hemiOf(v, isLat);
  const a = Math.abs(v);
  let deg = Math.floor(a);
  let min = Number(((a - deg) * 60).toFixed(minDigits));
  if (min >= 60) { min -= 60; deg += 1; }
  return `${deg}°${padNum(min, minDigits)}′${hemi}`;
};

// 国家标准 (DDMM.mm / DDDMM.mm): 3912.3402N
export const formatNMEA = (v: number, isLat: boolean, minDigits = 4): string => {
  const hemi = hemiOf(v, isLat);
  const a = Math.abs(v);
  let deg = Math.floor(a);
  let min = Number(((a - deg) * 60).toFixed(minDigits));
  if (min >= 60) { min -= 60; deg += 1; }
  const degWidth = isLat ? 2 : 3;
  const minInt = String(Math.floor(min)).padStart(2, '0');
  const minFrac = min.toFixed(minDigits).split('.')[1] ?? ''.padEnd(minDigits, '0');
  return `${String(deg).padStart(degWidth, '0')}${minInt}.${minFrac}${hemi}`;
};

// 按指定格式输出单个坐标
export const formatCoord = (v: number, isLat: boolean, format: CoordFormat): string => {
  switch (format) {
    case 'DMS': return formatDMS(v, isLat);
    case 'DM': return formatDM(v, isLat);
    case 'NMEA': return formatNMEA(v, isLat);
    case 'DD':
    default: return formatDD(v);
  }
};

// ---------- 组合转换 ----------

// 一对经纬度 -> 四种格式输出
export const convertCoordinate = (
  input: string,
  opts: { format: InputFormat; order: Order },
): ConvertResult => {
  const raw = input.trim();
  if (raw === '') throw new CoordError('EMPTY', '请输入经纬度');
  const tokens = splitPair(raw);
  if (tokens.length !== 2) throw new CoordError('PAIR', '请输入一对经纬度 (纬度, 经度)', raw);

  const fmt1 = opts.format === 'AUTO' ? detectFormat(tokens[0]) : opts.format;
  const fmt2 = opts.format === 'AUTO' ? detectFormat(tokens[1]) : opts.format;
  const p1 = parseCoord(tokens[0], fmt1);
  const p2 = parseCoord(tokens[1], fmt2);

  // 按方向字母判定纬度 / 经度, 无方向字母时按 order 选项
  const latTok1 = p1.hemi === 'N' || p1.hemi === 'S';
  const lngTok1 = p1.hemi === 'E' || p1.hemi === 'W';
  const latTok2 = p2.hemi === 'N' || p2.hemi === 'S';
  const lngTok2 = p2.hemi === 'E' || p2.hemi === 'W';
  let latP = opts.order === 'lnglat' ? p2 : p1;
  let lngP = opts.order === 'lnglat' ? p1 : p2;
  if (lngTok1 && latTok2) { latP = p2; lngP = p1; }
  else if (latTok1 && lngTok2) { latP = p1; lngP = p2; }

  if (Math.abs(latP.value) > 90) throw new CoordError('LAT_RANGE', '纬度超出范围 (-90 ~ 90)', formatDD(latP.value));
  if (Math.abs(lngP.value) > 180) throw new CoordError('LNG_RANGE', '经度超出范围 (-180 ~ 180)', formatDD(lngP.value));

  const lat = latP.value;
  const lng = lngP.value;
  const mk = (key: CoordFormat, latText: string, lngText: string): CoordRow => ({
    key,
    lat: latText,
    lng: lngText,
    pair: `${latText}, ${lngText}`,
  });

  const rows: CoordRow[] = [
    mk('DD', formatDD(lat), formatDD(lng)),
    mk('DMS', formatDMS(lat, true), formatDMS(lng, false)),
    mk('DM', formatDM(lat, true), formatDM(lng, false)),
    mk('NMEA', formatNMEA(lat, true), formatNMEA(lng, false)),
  ];

  return { lat, lng, inputFormat: fmt1, rows };
};

// ---------- 默认项 (设置中心) ----------

const DEFAULT_FORMAT_KEY = 'latlng-convert:default-format';
const DEFAULT_ORDER_KEY = 'latlng-convert:default-order';

export function getDefaultFormat(): InputFormat {
  const v = localStorage.getItem(DEFAULT_FORMAT_KEY);
  return v === 'DD' || v === 'DMS' || v === 'DM' || v === 'NMEA' ? v : 'AUTO';
}

export function setDefaultFormat(format: InputFormat): void {
  localStorage.setItem(DEFAULT_FORMAT_KEY, format);
}

export function getDefaultOrder(): Order {
  const v = localStorage.getItem(DEFAULT_ORDER_KEY);
  return v === 'lnglat' ? 'lnglat' : 'latlng';
}

export function setDefaultOrder(order: Order): void {
  localStorage.setItem(DEFAULT_ORDER_KEY, order);
}
