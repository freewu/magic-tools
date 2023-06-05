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