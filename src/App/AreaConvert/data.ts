export const unitTypeList = [
  { label: '公制', value: 'ms', placeholder: 'metric system'},
  { label: '英制', value: 'iu', placeholder: 'Imperial units'},
  { label: '市制', value: 'cn', placeholder: ''},
  { label: '日式', value: 'jp', placeholder: ''},
];

export const typeList = [
  { label: '平方公里', value: 'km2', type:'ms', placeholder: '1 平方公里km² = 1000000 平方米 m²'},
  { label: '公顷', value: 'gq', type:'ms', placeholder: '1 公顷 = 10000 平方米 m²'},
  { label: '公亩', value: 'gm', type:'ms', placeholder: '1 公亩 = 100 平方米 m²'},
  { label: '平方米',   value: 'm2',  type:'ms', placeholder: '1 平方米 m² = 0.0001 公顷 = 0.01 公亩' },
  { label: '平方分米', value: 'dm2', type:'ms', placeholder: '1 平方分米 dm² = 0.01 平方米 m²' },
  { label: '平方厘米', value: 'cm2', type:'ms', placeholder: '1 平方厘米 cm² = 0.0001 平方米 m²' },
  { label: '平方毫米', value: 'mm2', type:'ms', placeholder: '1 平方毫米 mm² = 0.000001 平方米 m²' },

  { label: '平方英里', value: 'mile2', type:'iu', placeholder: '1 平方英里 = 2590000 平方米 m²'},
  { label: '英亩', value: 'ym', type:'iu', placeholder: '1 英亩 = 4046.85642 平方米 m²'},
  { label: '路得', value: 'ld', type:'iu', placeholder: '1 路得 = 1011.7136203 平方米m²'},
  { label: '平方杆', value: 'g', type:'iu', placeholder: '1 平方杆 = 25.2928469 平方米m²'},
  { label: '平方码', value: 'yard2', type:'iu', placeholder: '1 平方码 = 0.83612736 平方米 m²'},
  { label: '平方英尺', value: 'foot2', type:'iu', placeholder: '1 平方英尺 = 0.09290304 平方米 m²'},
  { label: '平方英寸', value: 'inch2', type:'iu', placeholder: '1 平方英寸 = 0.00064516 平方米 m²'},

  { label: '坪', value: 'jp-ping', type:'jp', placeholder: '1 坪 = 3.30578622 平方米 m²'},
  { label: '叠', value: 'jp-die', type:'jp', placeholder: '1 叠 = 1.62 平方米 m²'},
  { label: '町', value: 'jp-ding', type:'jp', placeholder: '1 町 = 0.00991736 平方米 m²'},
  { label: '段', value: 'jp-duan', type:'jp', placeholder: '1 段 = 0.00099174 平方米 m²'},
  { label: '亩', value: 'jp-mu', type:'jp', placeholder: '1 亩 = 0.00009917 平方米 m²'},

  { label: '顷', value: 'qin', type:'cn', placeholder: '1顷 = 100亩 = 66666 平方米 m²'},
  { label: '亩', value: 'mu', type:'cn', placeholder: '1亩 = 666.66 平方米 m²'},
  { label: '分', value: 'fen', type:'cn', placeholder: '1分 = 0.1亩 = 66.666 平方米 m²'},
  { label: '厘', value: 'li', type:'cn', placeholder: '1厘 = 0.01亩 = 6.6666 平方米 m² '},
  { label: '毫', value: 'hao', type:'cn', placeholder: '1毫 = 0.001亩 = 0.66666 平方米 m²'},
  { label: '平方丈', value: 'zhuang2', type:'cn', placeholder: '1平方丈 = 100平方尺 = 11.11平方米'},
  { label: '平方尺', value: 'chi2', type:'cn', placeholder: '1平方尺 = 0.1111平方米'},
  { label: '平方寸', value: 'cun2', type:'cn', placeholder: '1平方寸 = 0.01平方尺 = 0.001111平方米'},
];

// 常用面积预设 (最上方的彩色标签, 点击后自动切到对应制式与单位并换算)
export const presetList = [
  { id: 'a4', label: 'A4 纸 0.06237 平方米', value: '0.06237', unit: 'm2' },
  { id: 'parking', label: '标准车位 12.5 平方米', value: '12.5', unit: 'm2' },
  { id: 'basketball', label: '篮球场 420 平方米', value: '420', unit: 'm2' },
  { id: 'football', label: '足球场 7140 平方米', value: '7140', unit: 'm2' },
  { id: 'gugong', label: '故宫 72 万平方米', value: '720000', unit: 'm2' },
  { id: 'tiananmen', label: '天安门广场 44 万平方米', value: '440000', unit: 'm2' },
  { id: 'km2', label: '1 平方千米 100 万平方米', value: '1', unit: 'km2' },
  { id: 'vatican', label: '梵蒂冈 0.44 平方千米', value: '0.44', unit: 'km2' },
  { id: 'ha', label: '1 公顷 10000 平方米', value: '1', unit: 'gq' },
  { id: 'ym', label: '1 英亩 4046.86 平方米', value: '1', unit: 'ym' },
  { id: 'mu', label: '1 亩 666.67 平方米', value: '1', unit: 'mu' },
  { id: 'ping', label: '1 坪 3.3058 平方米', value: '1', unit: 'jp-ping' },
];