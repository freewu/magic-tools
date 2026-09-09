// BaseXCodec 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 面板交互文案 (按需扩展); 说明性长文 (tips/intro) 暂保留简中, 后续批次再翻
export default {
  default: 'zh-CN',
  'zh-CN': {
    // appName 缺省回退 define.tsx AppName (= 'BaseX 编解码')
    typeLabel: '码型:',
    encode: '编码',
    decode: '解码',
    clear: '清除',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    encodePh: '输入需要进行 {code} 编码的内容  或 拖拽文件到框内打开',
    decodePh: '输入需要进行 {code} 解码的内容  或 拖拽文件到框内打开',
    decodeFail: '解码失败: {msg}',
    divider: 'BaseX 编码说明',
  },
  'zh-TW': {
    appName: 'BaseX 編解碼',
    typeLabel: '碼型：',
    encode: '編碼',
    decode: '解碼',
    clear: '清除',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    encodePh: '輸入需要進行 {code} 編碼的內容，或將檔案拖入框內開啟',
    decodePh: '輸入需要進行 {code} 解碼的內容，或將檔案拖入框內開啟',
    decodeFail: '解碼失敗：{msg}',
    divider: 'BaseX 編碼說明',
  },
  en: {
    appName: 'BaseX Codec',
    typeLabel: 'Encoding:',
    encode: 'Encode',
    decode: 'Decode',
    clear: 'Clear',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    encodePh: 'Enter text to encode as {code}, or drag & drop a file here',
    decodePh: 'Enter {code} text to decode, or drag & drop a file here',
    decodeFail: 'Decode failed: {msg}',
    divider: 'About BaseX',
  },
} as const;
