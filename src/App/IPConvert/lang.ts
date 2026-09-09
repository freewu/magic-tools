// IPConvert 语言包: UI 文案 (zh-CN 默认, 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '',
    ipPh: 'IPv4 地址, 如 192.168.1.1',
    intPh: '十进制整数, 支持 0x 前缀',
  },
  'zh-TW': {
    appName: 'IP 轉換',
    ipPh: 'IPv4 位址, 如 192.168.1.1',
    intPh: '十進位整數, 支援 0x 前綴',
  },
  'en': {
    appName: 'IP Converter',
    ipPh: 'IPv4 address, e.g. 192.168.1.1',
    intPh: 'Decimal integer (0x prefix supported)',
  },
} as const;
