// 类型列表
export const typeList = [
  { label: 'WGS84坐标系', value: 'WGS84', placeholder: '地球坐标系,国际通用坐标系' },
  { label: 'GCJ02坐标系', value: 'GCJ02',  placeholder: '火星坐标系,WGS84 坐标系加密后的坐标系；Google国内地图、高德、QQ地图 使用' },
  { label: 'BD09坐标系', value: 'BD09', placeholder: '百度坐标系，GCJ02 坐标系加密后的坐标系' },
  //{ label: 'CGCS坐标系', value: 'CGCS', placeholder: '国家 2000 大地坐标系' },
  { label: '腾讯地图', value: 'TXMAP', placeholder: '火星坐标系,WGS84展示 纬度在前，经度在后' },
];

export const emptyResult :GPSConvertResult = {
  "WGS84": "",
  "GCJ02": "",
  "BD09": "",
  "CGCS": "",
  "TXMAP": "",
};

export type GPSConvertResult = {
  "WGS84": string,
  "GCJ02": string,
  "BD09": string,
  "CGCS": string,
  "TXMAP": string,
}

// 提供的地图坐标拾取服务
export const pickList = [
  { label : "百度地图", url:"https://api.map.baidu.com/lbsapi/getpoint/index.html" },
  { label : "高德地图", url:"https://lbs.amap.com/tools/picker" },
  { label : "腾讯地图", url:"https://lbs.qq.com/getPoint/" },
];
