// SHA3Hash 语言包: UI 文案 (zh-CN 默认, 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '',
    copyOk: '复制到粘贴板成功！！！',
    clear: '清除',
    upper: '结果大写字符展示',
    ph: '输入需要计算 SHA3 Hash 值的内容 或 拖拽文件到框内打开',
    shakeLen: 'SHAKE 输出长度',
    shakeTip: 'SHAKE128/256 的输出长度 (bit), 须为 8 的整数倍',
  },
  'zh-TW': {
    appName: 'SHA3 Hash 值計算',
    copyOk: '複製到剪貼簿成功！！！',
    clear: '清除',
    upper: '結果以大寫字元顯示',
    ph: '輸入需要計算 SHA3 Hash 值的內容 或 拖曳檔案到框內開啟',
    shakeLen: 'SHAKE 輸出長度',
    shakeTip: 'SHAKE128/256 的輸出長度 (bit), 須為 8 的整數倍',
  },
  'en': {
    appName: 'SHA-3 Hash',
    copyOk: 'Copied to clipboard!!!',
    clear: 'Clear',
    upper: 'Show result in uppercase',
    ph: 'Enter content to hash, or drop a file into the box',
    shakeLen: 'SHAKE output length',
    shakeTip: 'SHAKE128/256 output length (bit); must be a multiple of 8',
  },
} as const;
