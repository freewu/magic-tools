// HmacHash 语言包: UI 文案 (zh-CN 默认, 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '',
    copyOk: '复制到粘贴板成功！！！',
    clear: '清除',
    upper: '结果大写字符显示',
    ph: '输入需要计算 Hash 值的内容 或 拖拽文件到框内打开',
    keyPh: '密钥',
  },
  'zh-TW': {
    appName: 'HmacHash 值計算',
    copyOk: '複製到剪貼簿成功！！！',
    clear: '清除',
    upper: '結果以大寫字元顯示',
    ph: '輸入需要計算 Hash 值的內容 或 拖曳檔案到框內開啟',
    keyPh: '密鑰',
  },
  'en': {
    appName: 'HMAC Calculator',
    copyOk: 'Copied to clipboard!!!',
    clear: 'Clear',
    upper: 'Show result in uppercase',
    ph: 'Enter content to hash, or drop a file into the box',
    keyPh: 'Key',
  },
} as const;
