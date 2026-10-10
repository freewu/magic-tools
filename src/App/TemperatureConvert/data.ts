export const typeList = [
  { label: '摄氏度 °C', value: 'c', placeholder: '在 1 标准大气压下，纯净的冰水混合物的温度为 0 °C，水的沸点为 100 °C' },
  { label: '华氏度 °F', value: 'f', placeholder: '在标准大气压下，冰的熔点为 32 ℉，水的沸点为 212 ℉，中间有 180 等分，每等分为华氏1度' },
  { label: '开尔文 K', value: 'k', placeholder: '开尔文是以绝对零度作为计算起点，即 -273.15 ℃ = 0K' },
  { label: '兰金温标 °R', value: 'r', placeholder: '以绝对零度为计算起点的华氏温度' },
  { label: '德利尔温标 °D', value: 'd', placeholder: '将水的沸点定于零度，然后将水银体积随温度降低收缩十万分之一定为一个间隔' },
  { label: '牛顿温标 °N', value: 'n', placeholder: '0 °N 定义为雪融化的温度（水的冰点）， 33 °N 定义为水沸腾的温度（水的沸点）' },
  { label: '列氏温标 °Ré', value: 're', placeholder: '水的冰点被定为列氏 0 度，而沸点则为列氏 80 度' },
  { label: '罗氏温标 °Rø', value: 'ra', placeholder: '将水的冰点定为罗氏 7.5 度，沸点定为罗氏 60 度' },
];

// 常用温度预设 (点击后自动填入数量并切换到对应温标), 文案见 lang.ts 的 ps_<id>
export const presetList = [
  { id: 'abszero', label: '绝对零度 -273.15 °C', value: '-273.15', unit: 'c' },
  { id: 'ice', label: '冰点 0 °C', value: '0', unit: 'c' },
  { id: 'room', label: '室温 25 °C', value: '25', unit: 'c' },
  { id: 'body', label: '体温 37 °C', value: '37', unit: 'c' },
  { id: 'boil', label: '沸点 100 °C', value: '100', unit: 'c' },
  { id: 'fice', label: '华氏冰点 32 °F', value: '32', unit: 'f' },
  { id: 'fboil', label: '华氏沸点 212 °F', value: '212', unit: 'f' },
  { id: 'ln2', label: '液氮 -196 °C', value: '-196', unit: 'c' },
  { id: 'oven', label: '烤箱 180 °C', value: '180', unit: 'c' },
];