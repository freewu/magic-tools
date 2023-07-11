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