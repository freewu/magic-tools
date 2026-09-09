// URL 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// appName 缺省回退 define.tsx AppName; 面板交互文案见下
export default {
  default: 'zh-CN',
  'zh-CN': {
    clear: '清除',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    encodePh: '输入需要进行 URL 编码的内容  或 拖拽文件到框内打开',
    decodePh: '输入需要进行 URL 解码的内容  或 拖拽文件到框内打开',
    decodeFailed: '解码失败！！！',
    divider: 'URL 编码说明',
  },
  'zh-TW': {
    appName: 'URL 編解碼',
    clear: '清除',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    encodePh: '輸入需要進行 URL 編碼的內容，或將檔案拖入框內開啟',
    decodePh: '輸入需要進行 URL 解碼的內容，或將檔案拖入框內開啟',
    decodeFailed: '解碼失敗！！！',
    divider: 'URL 編碼說明',
  },
  en: {
    appName: 'URL Encode / Decode',
    clear: 'Clear',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    encodePh: 'Enter text to URL-encode, or drag & drop a file here',
    decodePh: 'Enter text to URL-decode, or drag & drop a file here',
    decodeFailed: 'Decode failed!',
    divider: 'About URL Encoding',
  },
} as const;
