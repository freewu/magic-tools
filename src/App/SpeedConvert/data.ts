export const unitTypeList = [
  { label: '公制', value: 'ms', placeholder: 'metric system'},
  { label: '英制', value: 'iu', placeholder: 'Imperial units'},
];

export const typeList = [
  { label: '厘米每秒(m/s)', value: 'cms', type:'ms', placeholder: ''},
  { label: '米每秒(m/s)',   value: 'ms',  type:'ms', placeholder: '' },
  { label: '千米每秒(km/s)', value: 'kms', type:'ms', placeholder: '' },
  { label: '千米每时(km/h)', value: 'kmh', type:'ms', placeholder: '' },
  //{ label: '光速', value: 'ls', type:'ms', placeholder: '' },
  { label: '马赫', value: 'mach', type:'ms', placeholder: '马赫的大约速度换算一般认为相当于340.3 m/s，又大约等同于1225 km/h，761.2 mph，或者1116 ft/s。即视为等于声音在15摄氏度（59华氏度，288.15开氏度）的空气中传播的速度' },
  { label: '节', value: 'knot', type:'ms', placeholder: '指 海里 / 小时，节是航海中代表速度的单位' },

  { label: '英里每时(m/h)', value: 'mph', type:'iu', placeholder: ''},
  { label: '英尺每秒(ft/s)', value: 'fts', type:'iu', placeholder: ''},
  { label: '英尺每分钟(ft/min)', value: 'ftmin', type:'iu', placeholder: ''},
  { label: '英寸每秒(in/s)', value: 'ins', type:'iu', placeholder: ''},
];

// 常用速度预设 (点击后自动填入数量并切换到对应单位), 文案见 lang.ts 的 ps_<id>
export const presetList = [
  { id: 'gravity', label: '重力加速度 9.80665 m/s', value: '9.80665', unit: 'ms' },
  { id: 'v1', label: '第一宇宙速度 7.9 km/s', value: '7.9', unit: 'kms' },
  { id: 'v2', label: '第二宇宙速度 11.2 km/s', value: '11.2', unit: 'kms' },
  { id: 'v3', label: '第三宇宙速度 16.7 km/s', value: '16.7', unit: 'kms' },
  { id: 'light', label: '光速 299792.458 km/s', value: '299792.458', unit: 'kms' },
  { id: 'sound', label: '音速 1 马赫', value: '1', unit: 'mach' },
  { id: 'train', label: '高铁 350 km/h', value: '350', unit: 'kmh' },
  { id: 'car', label: '高速限速 120 km/h', value: '120', unit: 'kmh' },
  { id: 'walk', label: '步行 5 km/h', value: '5', unit: 'kmh' },
  { id: 'knot', label: '1 节 (1.852 km/h)', value: '1', unit: 'knot' },
];