const DEFAULT_TYPE = 'gps-convert:default-type';

// 获取默认显示的 App
export function getDefaultType() :string  {
    const type = localStorage.getItem(DEFAULT_TYPE);
    // 如果没有设置默认展示的应用，默认显示应用中心
    return (type === null)? "GCJ02" : type;
}

// 设置默认显示的应用
export function setDefaultType(type: string) : void  {
    localStorage.setItem(DEFAULT_TYPE,type);
}


export type GPSPoint = {
  lng :number,
  lat :number
};

export const pointToString = (point :GPSPoint):string => {
  return `${point.lng},${point.lat}`;
}

// 腾讯地图 维度在前
export const tencentMapPointToString = (point :GPSPoint):string => {
  return `${point.lat},${point.lng}`;
}

// 百度坐标 转 火星坐标
const x_pi=3.14159265358979324 * 3000.0 / 180.0;
export const bd09Togcj02 = (baidu_point :GPSPoint) :GPSPoint => {
  let mars_point = { lng: 0, lat: 0 };
  let x = baidu_point.lng - 0.0065;
  let y = baidu_point.lat - 0.006;
  let z = Math.sqrt(x*x+y*y)- 0.00002 * Math.sin(y * x_pi);
  let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  mars_point.lng = z * Math.cos(theta);
  mars_point.lat = z * Math.sin(theta);
  return mars_point;
}

// 火星坐标 转 百度坐标
export const gcj02Tobd09 = (mars_point :GPSPoint) :GPSPoint =>  {
  let baidu_point={ lng: 0,lat: 0 };
  let x = mars_point.lng;
  let y = mars_point.lat;
  let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
  let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
  baidu_point.lng = z * Math.cos(theta) + 0.0065;
  baidu_point.lat = z * Math.sin(theta) + 0.006;
  return baidu_point;
}

const pi = 3.14159265358979324;
const a = 6378245.0; // 卫星椭球坐标投影到平面地图坐标系的投影因子
const ee = 0.00669342162296594323; // 椭球的偏心率

// 判断是否在国内，不在国内则不做偏移
export const outOfChina = (lng :number, lat :number) :boolean => {
  return ((lng < 72.004 || lng > 137.8347) && (lat < 0.8293 || lat > 55.8271));
}

const transformLat = (x :number,y :number) :number => {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
  return ret;
}

const transformLng = (x :number,y :number) :number => {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
  return ret;
}

// WGS84 转 火星坐标
export const wgs84Togcj02 = (wgs84_point :GPSPoint) :GPSPoint => {
  var mars_point={ lng: 0, lat: 0};
  if (outOfChina(wgs84_point.lng, wgs84_point.lat)) {
    return wgs84_point;
  }
  let x = wgs84_point.lng - 105.0;
  let y = wgs84_point.lat - 35.0
  let dLat = transformLat(x,y);
  let dLng = transformLng(x,y);
  let radLat = wgs84_point.lat / 180.0 * pi;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
  mars_point.lat = wgs84_point.lat + dLat;
  mars_point.lng = wgs84_point.lng + dLng;
  return mars_point
}

// 火星坐标 转 WGS84
export const gcj02Towgs84 = (mars_point :GPSPoint) :GPSPoint => {
  let x = mars_point.lng - 105.0;
  let y = mars_point.lat - 35.0
  let dLat = transformLat(x, y)
  let dLng = transformLng(x, y)
  let radLat = mars_point.lat / 180.0 * pi
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  let sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)

  return {
    'lat': mars_point.lat - dLat,
    'lng': mars_point.lng - dLng
  }
}
