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

// CGCS2000 转 WGS84
export const cgcs2000ToWgs84 = (cgcs2000_point :GPSPoint) :GPSPoint => {
  return {
    'lat': cgcs2000_point.lat,
    'lng': cgcs2000_point.lng,
  }
}
// WGS84 转 CGCS2000
export const wgs84Tocgcs2000 = (wgs84_point :GPSPoint) :GPSPoint => {
  return {
    'lat': wgs84_point.lat,
    'lng': wgs84_point.lng,
  }
}
/**
// package com.gis.util;
 
// import java.util.ArrayList;
// import java.util.Iterator;
// import java.util.List;
 
 
// public class JavaRtkUtils {
// 	private double p = 206264.80624709636D;
 
// 	public static void main(String[] args) {
// 		// 84     118.79222222222222,32.06444444444444,
// 		// 2000   118.79232883438817,32.064499855041504,
 
// 		double[] cs2000ToWgs84 = cs2000ToWgs84(118.79232883438817,32.064499855041504, 3);
// 		for (double d : cs2000ToWgs84) {
// 			System.out.println(d);
// 		}
// 		double[] wgs84To2000 = wgs84To2000(118.79222222222222,32.06444444444444, 3);
// 		for (double d : wgs84To2000) {
// 			System.out.println(d);
// 		}
// 	}
// 	private double[] xyTowgs84(double x, double y, double L0) {
// 		double a = 6378137.0D;
// 		double efang = 0.0066943799901413D;
// 		double e2fang = 0.0067394967422764D;
// 		y = y - (double) 500000;
// 		double m0 = 0.0D;
// 		double m2 = 0.0D;
// 		double m4 = 0.0D;
// 		double m6 = 0.0D;
// 		double m8 = 0.0D;
// 		m0 = a * ((double) 1 - efang);
// 		m2 = 1.5D * efang * m0;
// 		m4 = efang * m2 * 5.0D / 4.0D;
// 		m6 = efang * m4 * 7.0D / 6.0D;
// 		m8 = efang * m6 * 9.0D / 8.0D;
// 		double a0 = 0.0D;
// 		double a2 = 0.0D;
// 		double a4 = 0.0D;
// 		double a6 = 0.0D;
// 		double a8 = 0.0D;
// 		a0 = m0 + m2 / 2.0D + m4 * 3.0D / 8.0D + m6 * 5.0D / 16.0D + m8 * 35.0D / 128.0D;
// 		a2 = m2 / 2.0D + m4 / 2.0D + m6 * 15.0D / 32.0D + m8 * 7.0D / 16.0D;
// 		a4 = m4 / 8.0D + m6 * 3.0D / 16.0D + m8 * 7.0D / 32.0D;
// 		a6 = m6 / 32.0D + m8 / 16.0D;
// 		a8 = m8 / 128.0D;
// 		double FBf = 0.0D;
// 		double Bf0 = x / a0;
 
// 		for (double Bf1 = 0.0D; Bf0 - Bf1 >= 1.0E-4D; Bf0 = (x - FBf) / a0) {
// 			Bf1 = Bf0;
// 			FBf = -a2 * Math.sin((double) 2 * Bf0) / (double) 2 + a4 * Math.sin((double) 4 * Bf0) / (double) 4
// 					- a6 * Math.sin((double) 6 * Bf0) / (double) 6 + a8 * Math.sin((double) 8 * Bf0) / (double) 8;
// 		}
 
// 		double Wf = Math.sqrt((double) 1 - efang * Math.sin(Bf0) * Math.sin(Bf0));
// 		double Nf = a / Wf;
// 		double Mf = a * ((double) 1 - efang) / Math.pow(Wf, 3.0D);
// 		double nffang = e2fang * Math.cos(Bf0) * Math.cos(Bf0);
// 		double tf = Math.tan(Bf0);
// 		double B = Bf0 - tf * y * y / ((double) 2 * Mf * Nf)
// 				+ tf * ((double) 5 + (double) 3 * tf * tf + nffang - (double) 9 * nffang * tf * tf) * Math.pow(y, 4.0D)
// 						/ ((double) 24 * Mf * Math.pow(Nf, 3.0D))
// 				- tf * ((double) 61 + (double) 90 * tf * tf + (double) 45 * Math.pow(tf, 4.0D)) * Math.pow(y, 6.0D)
// 						/ ((double) 720 * Mf * Math.pow(Nf, 5.0D));
// 		double l = y / (Nf * Math.cos(Bf0))
// 				- ((double) 1 + (double) 2 * tf * tf + nffang) * Math.pow(y, 3.0D)
// 						/ ((double) 6 * Math.pow(Nf, 3.0D) * Math.cos(Bf0))
// 				+ ((double) 5 + (double) 28 * tf * tf + (double) 24 * Math.pow(tf, 4.0D)) * Math.pow(y, 5.0D)
// 						/ ((double) 120 * Math.pow(Nf, 5.0D) * Math.cos(Bf0));
// 		double L = l + L0;
// 		double[] array_B = this.rad2dms(B);
// 		double[] array_L = this.rad2dms(L);
// 		double Bdec = this.dms2dec(array_B);
// 		double Ldec = this.dms2dec(array_L);
// 		return new double[] { Bdec, Ldec };
// 	}
// 	private  double[] xyTo2000(double x, double y, double L0) {
// 		double a = 6378137.0D;
// 		double efang = 0.0066943800229008D;
// 		double e2fang = 0.0067394967422764D;
// 		y = y - (double) 500000;
// 		double m0 = 0.0D;
// 		double m2 = 0.0D;
// 		double m4 = 0.0D;
// 		double m6 = 0.0D;
// 		double m8 = 0.0D;
// 		m0 = a * ((double) 1 - efang);
// 		m2 = 1.5D * efang * m0;
// 		m4 = efang * m2 * 5.0D / 4.0D;
// 		m6 = efang * m4 * 7.0D / 6.0D;
// 		m8 = efang * m6 * 9.0D / 8.0D;
// 		double a0 = 0.0D;
// 		double a2 = 0.0D;
// 		double a4 = 0.0D;
// 		double a6 = 0.0D;
// 		double a8 = 0.0D;
// 		a0 = m0 + m2 / 2.0D + m4 * 3.0D / 8.0D + m6 * 5.0D / 16.0D + m8 * 35.0D / 128.0D;
// 		a2 = m2 / 2.0D + m4 / 2.0D + m6 * 15.0D / 32.0D + m8 * 7.0D / 16.0D;
// 		a4 = m4 / 8.0D + m6 * 3.0D / 16.0D + m8 * 7.0D / 32.0D;
// 		a6 = m6 / 32.0D + m8 / 16.0D;
// 		a8 = m8 / 128.0D;
// 		double FBf = 0.0D;
// 		double Bf0 = x / a0;
		
// 		for (double Bf1 = 0.0D; Bf0 - Bf1 >= 1.0E-4D; Bf0 = (x - FBf) / a0) {
// 			Bf1 = Bf0;
// 			FBf = -a2 * Math.sin((double) 2 * Bf0) / (double) 2 + a4 * Math.sin((double) 4 * Bf0) / (double) 4
// 					- a6 * Math.sin((double) 6 * Bf0) / (double) 6 + a8 * Math.sin((double) 8 * Bf0) / (double) 8;
// 		}
		
// 		double Wf = Math.sqrt((double) 1 - efang * Math.sin(Bf0) * Math.sin(Bf0));
// 		double Nf = a / Wf;
// 		double Mf = a * ((double) 1 - efang) / Math.pow(Wf, 3.0D);
// 		double nffang = e2fang * Math.cos(Bf0) * Math.cos(Bf0);
// 		double tf = Math.tan(Bf0);
// 		double B = Bf0 - tf * y * y / ((double) 2 * Mf * Nf)
// 				+ tf * ((double) 5 + (double) 3 * tf * tf + nffang - (double) 9 * nffang * tf * tf) * Math.pow(y, 4.0D)
// 				/ ((double) 24 * Mf * Math.pow(Nf, 3.0D))
// 				- tf * ((double) 61 + (double) 90 * tf * tf + (double) 45 * Math.pow(tf, 4.0D)) * Math.pow(y, 6.0D)
// 				/ ((double) 720 * Mf * Math.pow(Nf, 5.0D));
// 		double l = y / (Nf * Math.cos(Bf0))
// 				- ((double) 1 + (double) 2 * tf * tf + nffang) * Math.pow(y, 3.0D)
// 				/ ((double) 6 * Math.pow(Nf, 3.0D) * Math.cos(Bf0))
// 				+ ((double) 5 + (double) 28 * tf * tf + (double) 24 * Math.pow(tf, 4.0D)) * Math.pow(y, 5.0D)
// 				/ ((double) 120 * Math.pow(Nf, 5.0D) * Math.cos(Bf0));
// 		double L = l + L0;
// 		double[] array_B = this.rad2dms(B);
// 		double[] array_L = this.rad2dms(L);
// 		double Bdec = this.dms2dec(array_B);
// 		double Ldec = this.dms2dec(array_L);
// 		return new double[] { Bdec, Ldec };
// 	}
 
// 	private double gaussLongToDegreen(double B, double L, double N) {
// 		double L00 = (double) Math.round(L / (double) N) * (double) N;
// 		return L00 / (double) 180 * 3.1415926D;
// 	}
 
// 	private double[] rad2dms(double rad) {
// 		double[] a = new double[] { 0.0D, 0.0D, 0.0D };
// 		double dms = rad * p;
// 		a[0] = Math.floor(dms / 3600.0D);
// 		a[1] = Math.floor((dms - a[0] * (double) 3600) / 60.0D);
// 		a[2] = (double) ((int) Math.floor(dms - a[0] * (double) 3600)) - a[1] * (double) 60;
// 		return a;
// 	}
 
// 	private double dms2dec(double[] dms) {
// 		double dec = 0.0D;
// 		dec = dms[0] + dms[1] / 60.0D + dms[2] / 3600.0D;
// 		return dec;
// 	}
// 	private double getL0(double B, double L, double degree,int flag){
// 		double a = 6378137.0D;
// 		double b = flag==1?6356752.314245179D:6356752.314140355D;
// 		double e = flag==1?0.081819190842621D:0.0818191910428158D;
// 		double eC = flag==1?0.0820944379496957D:0.0820944381519172D;
// 		double L0 = 0.0D;
// 		int n;
// 		if (degree == 6.0D) {
// 			n = (int) Math.round((L + degree / (double) 2) / degree);
// 			L0 = degree * (double) n - degree / (double) 2;
// 		} else {
// 			n = (int) Math.round(L / degree);
// 			L0 = degree * (double) n;
// 		}
// 		return L0;
// 	}
// 	/**
// 	 * @param flag 1 传入2000坐标转84  2 传入84坐标转2000
// 	 * @return
// 	 */
// 	private double[] GetXY(double B, double L, double degree,int flag) {
// 		double[] xy = new double[] { 0.0D, 0.0D };
// 		double a = 6378137.0D;
// 		double b = flag==1?6356752.314245179D:6356752.314140355D;
// 		double e = flag==1?0.081819190842621D:0.0818191910428158D;
// 		double eC = flag==1?0.0820944379496957D:0.0820944381519172D;
// 		double L0 = 0.0D;
// 		int n;
// 		if (degree == 6.0D) {
// 			n = (int) Math.round((L + degree / (double) 2) / degree);
// 			L0 = degree * (double) n - degree / (double) 2;
// 		} else {
// 			n = (int) Math.round(L / degree);
// 			L0 = degree * (double) n;
// 		}
// 		double radB = B * 3.141592653589793D / (double) 180;
// 		double radL = L * 3.141592653589793D / (double) 180;
// 		double deltaL = (L - L0) * 3.141592653589793D / (double) 180;
// 		double N = a * a / b / Math.sqrt((double) 1 + eC * eC * Math.cos(radB) * Math.cos(radB));
// 		double C1 = 1.0D + 0.75D * e * e + 0.703125D * Math.pow(e, 4.0D) + 0.68359375D * Math.pow(e, 6.0D)
// 				+ 0.67291259765625D * Math.pow(e, 8.0D);
// 		double C2 = 0.75D * e * e + 0.9375D * Math.pow(e, 4.0D) + 1.025390625D * Math.pow(e, 6.0D)
// 				+ 1.07666015625D * Math.pow(e, 8.0D);
// 		double C3 = 0.234375D * Math.pow(e, 4.0D) + 0.41015625D * Math.pow(e, 6.0D)
// 				+ 0.538330078125D * Math.pow(e, 8.0D);
// 		double C4 = 0.068359375D * Math.pow(e, 6.0D) + 0.15380859375D * Math.pow(e, 8.0D);
// 		double C5 = 0.00240325927734375D * Math.pow(e, 8.0D);
// 		double t = Math.tan(radB);
// 		double eta = eC * Math.cos(radB);
// 		double X = a * ((double) 1 - e * e)
// 				* (C1 * radB - C2 * Math.sin((double) 2 * radB) / (double) 2
// 						+ C3 * Math.sin((double) 4 * radB) / (double) 4 - C4 * Math.sin((double) 6 * radB) / (double) 6
// 						+ C5 * Math.sin((double) 8 * radB));
// 		xy[0] = X
// 				+ N * Math.sin(radB)
// 						* Math.cos(
// 								radB)
// 						* Math.pow(deltaL, 2.0D)
// 						* ((double) 1 + Math.pow(deltaL * Math.cos(radB), 2.0D)
// 								* ((double) 5 - t * t + (double) 9 * eta * eta + (double) 4 * Math.pow(eta, 4.0D))
// 								/ (double) 12
// 								+ Math.pow(deltaL * Math.cos(radB), 4.0D)
// 										* ((double) 61 - (double) 58 * t * t + Math.pow(t, 4.0D)) / (double) 360)
// 						/ (double) 2;
// 		xy[1] = N * deltaL * Math.cos(radB)
// 				* ((double) 1 + Math.pow(deltaL * Math.cos(radB), 2.0D) * ((double) 1 - t * t + eta * eta) / (double) 6
// 						+ Math.pow(deltaL * Math.cos(radB), 4.0D) * ((double) 5 - (double) 18 * t * t
// 								+ Math.pow(t, 4.0D) - (double) 14 * eta * eta - (double) 58 * eta * eta * t * t)
// 								/ (double) 120)
// 				+ (double) 500000;
// 		return new double[] { xy[0], xy[1] };
// 	}
// 	// @将WGS84经纬度转为大地2000坐标。我们是国家电网项目数据很精确的了。
// 	// @param B 纬度
// 	// @param L 经度
// 	// @param degree //
// 	// @param withBand 默认=false
// 	// @return
// 	private static Double[] gps84ToXY(double B, double L, double degree) {
// 		double[] xy = new double[] { 0.0D, 0.0D };
// 		double a = 6378137.0D;
// 		double b = 6356752.314245179D;
// 		double e = 0.081819190842621D;
// 		double eC = 0.0820944379496957D;
// 		double L0 = 0.0D;
// 		int n;
// 		if (degree == 6.0D) {
// 			n = (int) Math.round((L + degree / (double) 2) / degree);
// 			L0 = degree * (double) n - degree / (double) 2;
// 		} else {
// 			n = (int) Math.round(L / degree);
// 			L0 = degree * (double) n;
// 		}
// 		// 开始计算
// 		double radB = B * 3.141592653589793D / (double) 180;
// 		double radL = L * 3.141592653589793D / (double) 180;
// 		double deltaL = (L - L0) * 3.141592653589793D / (double) 180;
// 		double N = a * a / b / Math.sqrt(1 + eC * eC * Math.cos(radB) * Math.cos(radB));
// 		double C1 = 1.0 + 3.0 / 4 * e * e + 45.0 / 64 * Math.pow(e, 4) + 175.0 / 256 * Math.pow(e, 6)
// 				+ 11025.0 / 16384 * Math.pow(e, 8);
// 		double C2 = 3.0 / 4 * e * e + 15.0 / 16 * Math.pow(e, 4) + 525.0 / 512 * Math.pow(e, 6)
// 				+ 2205.0 / 2048 * Math.pow(e, 8);
// 		double C3 = 15.0 / 64 * Math.pow(e, 4) + 105.0 / 256 * Math.pow(e, 6) + 2205.0 / 4096 * Math.pow(e, 8);
// 		double C4 = 35.0 / 512 * Math.pow(e, 6) + 315.0 / 2048 * Math.pow(e, 8);
// 		double C5 = 315.0 / 131072 * Math.pow(e, 8);
// 		double t = Math.tan(radB);
// 		double eta = eC * Math.cos(radB);
// 		double X = a * (1 - e * e) * (C1 * radB - C2 * Math.sin(2 * radB) / 2 + C3 * Math.sin(4 * radB) / 4
// 				- C4 * Math.sin(6 * radB) / 6 + C5 * Math.sin(8 * radB));
 
// 		xy[0] = X + N * Math.sin(radB) * Math.cos(radB) * Math.pow(deltaL, 2)
// 				* (1 + Math.pow(deltaL * Math.cos(radB), 2) * (5 - t * t + 9 * eta * eta + 4 * Math.pow(eta, 4)) / 12
// 						+ Math.pow(deltaL * Math.cos(radB), 4) * (61 - 58 * t * t + Math.pow(t, 4)) / 360)
// 				/ 2;
// 		xy[1] = N * deltaL * Math.cos(radB)
// 				* (1 + Math.pow(deltaL * Math.cos(radB), 2) * (1 - t * t + eta * eta) / 6
// 						+ Math.pow(deltaL * Math.cos(radB), 4)
// 								* (5 - 18 * t * t + Math.pow(t, 4) - 14 * eta * eta - 58 * eta * eta * t * t) / 120)
// 				+ 500000; // +n * 1000000;
// 		return new Double[] { xy[0], xy[1] };
// 	}
// 	public static double[]   wgs84To2000(double longitude, double latitude, double degree){
// 		JavaRtkUtils rtkUtils = new JavaRtkUtils();
// 		double[] getXY2000 = rtkUtils.GetXY(latitude,longitude, degree,2);
// 		double l0 = rtkUtils.getL0(latitude,longitude, degree,2);
// 		double[] xytolatlon = xytolatlon2000(getXY2000[0], getXY2000[1], l0);
// 		double lat = xytolatlon[0];
// 		xytolatlon[0]=xytolatlon[1];
// 		xytolatlon[1]=lat;
// 		return xytolatlon;
// 	}
// 	/**
// 	 * @param degree  3度带还是6度带
// 	 * @return
// 	 */
// 	public static double[]   cs2000ToWgs84(double longitude, double latitude, double degree){
// 		JavaRtkUtils rtkUtils = new JavaRtkUtils();
// 		double[] getXY2000 = rtkUtils.GetXY(latitude,longitude, degree,1);
// 		double gaussLongToDegreen = rtkUtils.gaussLongToDegreen(latitude, longitude, degree);
// 		double[] xyTowgs84 = rtkUtils.xyTowgs84(getXY2000[0], getXY2000[1], gaussLongToDegreen);
// 		double lat = xyTowgs84[0];
// 		xyTowgs84[0]=xyTowgs84[1];
// 		xyTowgs84[1]=lat;
// 		return xyTowgs84;
// 	}
 
// 	private static double [] xytolatlon(double X, double Y ,double L0) {
// 	        double lat ,lon;
// 	        Y-=500000;
// //	        double a = 6378137.0D;
// //			double b = 6356752.314245179D;
// //			double e = 0.081819190842621D;
// //			double ee = 0.0820944379496957D;
// //			double iPI =Math.PI/180;//pi/180
			
// 	        double []  result  = new double[2];
// 	        double iPI = 0.0174532925199433;//pi/180
// 	        double a = 6378137.0; //长半轴 m
// 	        double b = 6356752.31414; //短半轴 m
// 	        double f = 1/298.257222101;//扁率 a-b/a
// 	        double e = 0.0818191910428; //第一偏心率 Math.sqrt(5)
// 	        double ee = Math.sqrt(a*a-b*b)/b; //第二偏心率
// 	        double bf = 0; //底点纬度
// 	        double a0 = 1+(3*e*e/4) + (45*e*e*e*e/64) + (175*e*e*e*e*e*e/256) + (11025*e*e*e*e*e*e*e*e/16384) + (43659*e*e*e*e*e*e*e*e*e*e/65536);
// 	        double b0 = X/(a*(1-e*e)*a0);
// 	        double c1 = 3*e*e/8 +3*e*e*e*e/16 + 213*e*e*e*e*e*e/2048 + 255*e*e*e*e*e*e*e*e/4096;
// 	        double c2 = 21*e*e*e*e/256 + 21*e*e*e*e*e*e/256 + 533*e*e*e*e*e*e*e*e/8192;
// 	        double c3 = 151*e*e*e*e*e*e*e*e/6144 + 151*e*e*e*e*e*e*e*e/4096;
// 	        double c4 = 1097*e*e*e*e*e*e*e*e/131072;
// 	        bf = b0 + c1*Math.sin(2*b0) + c2*Math.sin(4*b0) +c3*Math.sin(6*b0) + c4*Math.sin(8*b0); // bf =b0+c1*sin2b0 + c2*sin4b0 + c3*sin6b0 +c4*sin8b0 +...
// 	        double tf = Math.tan(bf);
// 	        double n2 = ee*ee*Math.cos(bf)*Math.cos(bf); //第二偏心率平方成bf余弦平方
// 	        double c = a*a/b;
// 	        double v=Math.sqrt(1+ ee*ee*Math.cos(bf)*Math.cos(bf));
// 	        double mf = c/(v*v*v); //子午圈半径
// 	        double nf = c/v;//卯酉圈半径
	 
// 	        //纬度计算
// 	        lat=bf-(tf/(2*mf)*Y)*(Y/nf) * (1-1/12*(5+3*tf*tf+n2-9*n2*tf*tf)*(Y*Y/(nf*nf))+1/360*(61+90*tf*tf+45*tf*tf*tf*tf)*(Y*Y*Y*Y/(nf*nf*nf*nf)));
// 	        //经度偏差
// 	        lon=1/(nf*Math.cos(bf))*Y -(1/(6*nf*nf*nf*Math.cos(bf)))*(1+2*tf*tf +n2)*Y*Y*Y + (1/(120*nf*nf*nf*nf*nf*Math.cos(bf)))*(5+28*tf*tf+24*tf*tf*tf*tf)*Y*Y*Y*Y*Y;
// 	        result[0] =lat/iPI;
// 	        result[1] =L0+lon/iPI;
// 	        return result;
// 	    }
// 	private static double [] xytolatlon2000(double X, double Y ,double L0) {
// 		double lat ,lon;
// 		Y-=500000;
// 	        double a = 6378137.0D;
// 			double b = 6356752.314245179D;
// 			double e = 0.081819190842621D;
// 			double ee = 0.0820944379496957D;
// 			double iPI =Math.PI/180;//pi/180
		
// 		double []  result  = new double[2];
// //		double iPI = 0.0174532925199433;//pi/180
// //		double a = 6378137.0; //长半轴 m
// //		double b = 6356752.31414; //短半轴 m
// //		double e = 0.0818191910428; //第一偏心率 Math.sqrt(5)
// //		double ee = Math.sqrt(a*a-b*b)/b; //第二偏心率
// 		double f = 1/298.257222101;//扁率 a-b/a
// 		double bf = 0; //底点纬度
// 		double a0 = 1+(3*e*e/4) + (45*e*e*e*e/64) + (175*e*e*e*e*e*e/256) + (11025*e*e*e*e*e*e*e*e/16384) + (43659*e*e*e*e*e*e*e*e*e*e/65536);
// 		double b0 = X/(a*(1-e*e)*a0);
// 		double c1 = 3*e*e/8 +3*e*e*e*e/16 + 213*e*e*e*e*e*e/2048 + 255*e*e*e*e*e*e*e*e/4096;
// 		double c2 = 21*e*e*e*e/256 + 21*e*e*e*e*e*e/256 + 533*e*e*e*e*e*e*e*e/8192;
// 		double c3 = 151*e*e*e*e*e*e*e*e/6144 + 151*e*e*e*e*e*e*e*e/4096;
// 		double c4 = 1097*e*e*e*e*e*e*e*e/131072;
// 		bf = b0 + c1*Math.sin(2*b0) + c2*Math.sin(4*b0) +c3*Math.sin(6*b0) + c4*Math.sin(8*b0); // bf =b0+c1*sin2b0 + c2*sin4b0 + c3*sin6b0 +c4*sin8b0 +...
// 		double tf = Math.tan(bf);
// 		double n2 = ee*ee*Math.cos(bf)*Math.cos(bf); //第二偏心率平方成bf余弦平方
// 		double c = a*a/b;
// 		double v=Math.sqrt(1+ ee*ee*Math.cos(bf)*Math.cos(bf));
// 		double mf = c/(v*v*v); //子午圈半径
// 		double nf = c/v;//卯酉圈半径
		
// 		//纬度计算
// 		lat=bf-(tf/(2*mf)*Y)*(Y/nf) * (1-1/12*(5+3*tf*tf+n2-9*n2*tf*tf)*(Y*Y/(nf*nf))+1/360*(61+90*tf*tf+45*tf*tf*tf*tf)*(Y*Y*Y*Y/(nf*nf*nf*nf)));
// 		//经度偏差
// 		lon=1/(nf*Math.cos(bf))*Y -(1/(6*nf*nf*nf*Math.cos(bf)))*(1+2*tf*tf +n2)*Y*Y*Y + (1/(120*nf*nf*nf*nf*nf*Math.cos(bf)))*(5+28*tf*tf+24*tf*tf*tf*tf)*Y*Y*Y*Y*Y;
// 		result[0] =lat/iPI;
// 		result[1] =L0+lon/iPI;
// 		return result;
// 	}
	
 
// }