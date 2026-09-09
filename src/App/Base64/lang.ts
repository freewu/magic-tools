// Base64 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 面板交互文案 (按需扩展); 说明性长文 (tips/intro) 暂保留简中, 后续批次再翻
export default {
  default: 'zh-CN',
  'zh-CN': {
    // appName 缺省回退 define.tsx AppName (= 'Base64 编解码')
    encode: 'Base64 编码',
    decode: 'Base64 解码',
    safe: '安全',
    clear: '清除',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    encodePh: '输入需要进行 Base64 编码的内容  或 拖拽文件到框内打开',
    decodePh: '输入需要进行 Base64 解码的内容  或 拖拽文件到框内打开',
    decodeFailed: '解码失败！！！',
    divider: 'Base64 编码说明',
  },
  'zh-TW': {
    appName: 'Base64 編解碼',
    encode: 'Base64 編碼',
    decode: 'Base64 解碼',
    safe: '安全',
    clear: '清除',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    encodePh: '輸入需要進行 Base64 編碼的內容，或將檔案拖入框內開啟',
    decodePh: '輸入需要進行 Base64 解碼的內容，或將檔案拖入框內開啟',
    decodeFailed: '解碼失敗！！！',
    divider: 'Base64 編碼說明',
  },
  en: {
    appName: 'Base64 Encode / Decode',
    encode: 'Encode',
    decode: 'Decode',
    safe: 'URL-safe',
    clear: 'Clear',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    encodePh: 'Enter text to encode, or drag & drop a file here',
    decodePh: 'Enter text to decode, or drag & drop a file here',
    decodeFailed: 'Decode failed!',
    divider: 'About Base64',
  },
} as const;
