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