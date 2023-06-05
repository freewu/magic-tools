export const emptyResult = {
  "ts10": "",
  "ts13": "",
  "rfc3339": "",
  "iso8601": "",
  "rfc2822": "",
  "locale": "",
  "utc": "",
  "custom": "",
};

import { getLastWeek, getNextWeek, getLastMonth, getNextMonth,formatDateTime } from "./lib"
import { getMonthBegin, getMonthEnd, getLastMonthBegin, getLastMonthEnd,getNextMonthBegin, getNextMonthEnd } from "./lib"

export const timeList = [
  { lable: "当前时间戳",value: (new Date()).getTime() + "" },
  { lable: "当前时间",value: formatDateTime(new Date()) },
  { lable: "上周",value: formatDateTime(getLastWeek()) },
  { lable: "下周",value: formatDateTime(getNextWeek()) },
  { lable: "上月",value: formatDateTime(getLastMonth()) },
  { lable: "下月",value: formatDateTime(getNextMonth()) },
  { lable: "本月初",value: formatDateTime(getMonthBegin()) },
  { lable: "本月未",value: formatDateTime(getMonthEnd()) },
  { lable: "上月初",value: formatDateTime(getLastMonthBegin()) },
  { lable: "上月未",value: formatDateTime(getLastMonthEnd()) },
  { lable: "下月初",value: formatDateTime(getNextMonthBegin()) },
  { lable: "下月未",value: formatDateTime(getNextMonthEnd()) },
]