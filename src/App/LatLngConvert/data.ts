// 输入格式选项 (AUTO 自动识别)
export const formatList = [
  { label: '自动识别', value: 'AUTO', placeholder: '自动识别十进制 / 度分秒 / 度分 / 国家标准格式' },
  { label: '十进制 (DD)', value: 'DD', placeholder: '39.20567, 116.12345' },
  { label: '度分秒 (DMS)', value: 'DMS', placeholder: '39°12′20.41″N, 116°7′24.42″E' },
  { label: '度分 (DM)', value: 'DM', placeholder: '39°12.3402′N, 116°7.4070′E' },
  { label: '国家标准 (DDMM.mm)', value: 'NMEA', placeholder: '3912.3402N, 11607.4070E' },
];

// 经纬度书写顺序
export const orderList = [
  { label: '纬度在前', value: 'latlng' },
  { label: '经度在前', value: 'lnglat' },
];

// 示例坐标 (点击载入, 覆盖四种格式与南北/东西半球, 以及经度在前的写法)
export const sampleList = [
  { key: 'dd', text: '39.908722, 116.3975' },
  { key: 'dms', text: '39°54′31.40″N, 116°23′51.00″E' },
  { key: 'dm', text: '39°54.5233′N, 116°23.85′E' },
  { key: 'nmea', text: '3954.5233N, 11623.8500E' },
  { key: 'lnglat', text: '116°23′51.00″E, 39°54′31.40″N' },
  { key: 'south', text: '-22.906847, -43.172896' },
];

export type FormatValue = 'AUTO' | 'DD' | 'DMS' | 'DM' | 'NMEA';
export type OrderValue = 'latlng' | 'lnglat';
