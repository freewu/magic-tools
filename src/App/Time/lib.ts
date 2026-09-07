// 格式化时间为 YYYY-MM-DD HH:ii:ss 格式
export const formatDateTime = (date :Date) => {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();
  return `${year}-${paddingZero(month)}-${paddingZero(day)} ${paddingZero(hour)}:${paddingZero(minute)}:${paddingZero(second)}`;
}

// 补 0 处理
export const paddingZero = (n :number) => {
  return (n >= 0 && n <= 9)? "0" + String(n) : String(n);
}

// 上周
export const getLastWeek = () :Date => {
  return new Date((new Date()).getTime() - (7 * 24 * 60 * 60 * 1000))
}

// 下周
export const getNextWeek = () :Date => {
  return new Date((new Date()).getTime() + (7 * 24 * 60 * 60 * 1000))
}

// 上月
export const getLastMonth = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月
  let day = now.getDate();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();

  // 当前时间为 1月时 
  if(1 === month) return new Date(`${year - 1}-12-${day} ${hour}:${minute}:${second}`);
  // 上月总天数
  let preSize= new Date(year, month - 1, 0).getDate();
  //  2 月可能是 28 或 29天,如果本日为3月的  30 / 31 日时 只能取 02-28 或 02-29  
  if( day > preSize ) return new Date(`${year - 1}-${month}-${preSize} ${hour}:${minute}:${second}`); 

  return new Date(`${year}-${month - 1 }-${day} ${hour}:${minute}:${second}`);
}

// 下月
export const getNextMonth = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月
  let day = now.getDate();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();

  // 当前时间为 12月时 
  if(12 === month) return new Date(`${year + 1}-1-${day} ${hour}:${minute}:${second}`);
  // 下月总天数
  let preSize= new Date(year, month + 1, 0).getDate();
  //  2 月可能是 28 或 29天,如果本日为1月的  30 / 31 日时 只能取 02-28 或 02-29  
  if( day > preSize ) return new Date(`${year - 1}-${month}-${preSize} ${hour}:${minute}:${second}`); 

  return new Date(`${year}-${month + 1 }-${day} ${hour}:${minute}:${second}`);
}

// 本月初
export const getMonthBegin = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月

  return new Date(`${year}-${month}-1 00:00:00`);
}

// 本月未
export const getMonthEnd = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月
  let totleDay = new Date(year, month, 0).getDate();; // 本月总天数

  return new Date(`${year}-${month}-${totleDay} 23:59:59`);
}

// 上月初
export const getLastMonthBegin = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月

  // 当前时间为 1月时 
  if(1 === month) return new Date(`${year - 1}-12-1 00:00:00`);
  return new Date(`${year}-${ month - 1 }-1 00:00:00`);
}

// 上月未
export const getLastMonthEnd = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月
  let totalDay= new Date(year, month - 1, 0).getDate(); // 上月总天数

  // 当前时间为 1 月时 
  if(1 === month) return new Date(`${year - 1}-12-${totalDay} 00:00:00`);
  return new Date(`${year}-${ month - 1 }-${totalDay} 00:00:00`);
}

// 下月初
export const getNextMonthBegin = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月

  // 当前时间为 12 月时 
  if(12 === month) return new Date(`${year + 1}-1-1 00:00:00`);
  return new Date(`${year}-${ month + 1 }-1 00:00:00`);
}

// 下月未
export const getNextMonthEnd = () :Date => {
  let now = new Date();
  let year = now.getFullYear();// getYear()+1900=getFullYear()
  let month = now.getMonth() + 1;// 0-11表示1-12月
  let totalDay= new Date(year, month + 1, 0).getDate(); // 上月总天数

  // 当前时间为 12 月时 
  if(12 === month) return new Date(`${year + 1}-1-${totalDay} 00:00:00`);
  return new Date(`${year}-${ month + 1 }-${totalDay} 00:00:00`);
}
// ==================== 导航/天文时间系统 ====================
// TAI-UTC 闰秒表: 每项为 [该 UTC 时刻起生效, 差值秒]
// (1972-01-01 引入闰秒; 此前的 1970/1971 按 10 近似)
const LEAP_TAI_UTC: Array<[number, number]> = [
  [Date.UTC(1972, 0, 1), 10], [Date.UTC(1972, 6, 1), 11], [Date.UTC(1973, 0, 1), 12],
  [Date.UTC(1974, 0, 1), 13], [Date.UTC(1975, 0, 1), 14], [Date.UTC(1976, 0, 1), 15],
  [Date.UTC(1977, 0, 1), 16], [Date.UTC(1978, 0, 1), 17], [Date.UTC(1979, 0, 1), 18],
  [Date.UTC(1980, 0, 1), 19], [Date.UTC(1981, 6, 1), 20], [Date.UTC(1982, 6, 1), 21],
  [Date.UTC(1983, 6, 1), 22], [Date.UTC(1985, 6, 1), 23], [Date.UTC(1988, 0, 1), 24],
  [Date.UTC(1990, 0, 1), 25], [Date.UTC(1991, 0, 1), 26], [Date.UTC(1992, 6, 1), 27],
  [Date.UTC(1993, 6, 1), 28], [Date.UTC(1994, 6, 1), 29], [Date.UTC(1996, 0, 1), 30],
  [Date.UTC(1997, 6, 1), 31], [Date.UTC(1999, 0, 1), 32], [Date.UTC(2006, 0, 1), 33],
  [Date.UTC(2009, 0, 1), 34], [Date.UTC(2012, 6, 1), 35], [Date.UTC(2015, 6, 1), 36],
  [Date.UTC(2017, 0, 1), 37],
];

// 某 UTC 时刻的 TAI-UTC 差值 (秒)
export const taiMinusUtc = (utcMs: number): number => {
  let v = 10;
  for (const [ms, diff] of LEAP_TAI_UTC) {
    if (utcMs >= ms) v = diff; else break;
  }
  return v;
};

const WEEK_SEC = 604800;

export type WeekTow = { week: number; tow: number; total: number };

const splitWeek = (total: number): WeekTow => ({
  week: Math.floor(total / WEEK_SEC),
  tow: ((total % WEEK_SEC) + WEEK_SEC) % WEEK_SEC,
  total,
});

// GPS 时间 (GPST): 连续秒计数(不含闰秒), 历元 1980-01-06 00:00:00 UTC (unix 315964800),
// 当时 TAI-UTC=19 且 GPST=TAI-19, 故 GPST 秒 = unix秒 - 历元 + (当前TAI-UTC - 19)
export const gpsTimeOf = (utcMs: number): WeekTow => {
  const sec = Math.floor(utcMs / 1000);
  return splitWeek(sec - 315964800 + (taiMinusUtc(utcMs) - 19));
};

// 北斗时间 (BDT): 历元 2006-01-01 00:00:00 UTC (unix 1136073600), 当时 TAI-UTC=33 且 BDT=UTC
export const bdtTimeOf = (utcMs: number): WeekTow => {
  const sec = Math.floor(utcMs / 1000);
  return splitWeek(sec - 1136073600 + (taiMinusUtc(utcMs) - 33));
};

// 伽利略时间 (GST): 与 GPS 同步 (GGTO≈0, 周对齐), 历元 = GPS 第 1024 周起点 (1999-08-22)
// => GST 总秒 = GPS 总秒 - 1024 周
export const gstTimeOf = (utcMs: number): WeekTow => {
  const g = gpsTimeOf(utcMs);
  return splitWeek(g.total - 1024 * WEEK_SEC);
};

// 格洛纳斯时间: UTC+3 (莫斯科), 与 UTC 同步闰秒 → 直接展示 UTC+3 的墙上时间
// (用 UTC 组件避免本地时区干扰)
export const glonassTimeText = (utcMs: number): string => {
  const d = new Date(utcMs + 3 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${paddingZero(d.getUTCMonth() + 1)}-${paddingZero(d.getUTCDate())} ${paddingZero(d.getUTCHours())}:${paddingZero(d.getUTCMinutes())}:${paddingZero(d.getUTCSeconds())}`;
};

// 儒略日 JD (自公元前 4713-01-01 正午) 与简化儒略日 MJD (JD-2400000.5)
// unix 历元 (1970-01-01T00:00:00Z) 的 JD = 2440587.5
export const julianDayOf = (utcMs: number): { jd: number; mjd: number } => {
  const jd = utcMs / 86400000 + 2440587.5;
  return { jd, mjd: jd - 2400000.5 };
};
