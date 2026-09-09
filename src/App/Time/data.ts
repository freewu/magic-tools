export const emptyResult = {
  "ts10": "",
  "ts13": "",
  "rfc3339": "",
  "iso8601": "",
  "rfc2822": "",
  "locale": "",
  "utc": "",
  "custom": "",
  "gps": "",
  "gpsWeekTow": "",
  "gpsTotal": "",
  "bdt": "",
  "bdtWeekTow": "",
  "bdtTotal": "",
  "gst": "",
  "gstWeekTow": "",
  "gstTotal": "",
  "glonass": "",
  "jd": "",
  "mjd": "",
};

import { getLastWeek, getNextWeek, getLastMonth, getNextMonth,formatDateTime } from "./lib"
import { getMonthBegin, getMonthEnd, getLastMonthBegin, getLastMonthEnd,getNextMonthBegin, getNextMonthEnd } from "./lib"

export const timeList = [
  { key: 'nowTs', lable: "当前时间戳", value: (new Date()).getTime() + "" },
  { key: 'now', lable: "当前时间", value: formatDateTime(new Date()) },
  { key: 'lastW', lable: "上周", value: formatDateTime(getLastWeek()) },
  { key: 'nextW', lable: "下周", value: formatDateTime(getNextWeek()) },
  { key: 'lastM', lable: "上月", value: formatDateTime(getLastMonth()) },
  { key: 'nextM', lable: "下月", value: formatDateTime(getNextMonth()) },
  { key: 'mBegin', lable: "本月初", value: formatDateTime(getMonthBegin()) },
  { key: 'mEnd', lable: "本月末", value: formatDateTime(getMonthEnd()) },
  { key: 'lmBegin', lable: "上月初", value: formatDateTime(getLastMonthBegin()) },
  { key: 'lmEnd', lable: "上月末", value: formatDateTime(getLastMonthEnd()) },
  { key: 'nmBegin', lable: "下月初", value: formatDateTime(getNextMonthBegin()) },
  { key: 'nmEnd', lable: "下月末", value: formatDateTime(getNextMonthEnd()) },
]