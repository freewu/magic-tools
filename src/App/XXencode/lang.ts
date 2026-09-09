// XXencode 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 面板交互文案 (按需扩展); 说明性长文 (tips/intro) 暂保留简中, 后续批次再翻
export default {
  default: 'zh-CN',
  'zh-CN': {
    // appName 缺省回退 define.tsx AppName (= 'XXencode 编解码')
    encode: 'XXencode 编码',
    decode: 'XXencode 解码',
    clear: '清除',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    encodePh: '输入需要 XXencode 编码的内容',
    decodePh: '输入需要 XXencode 解码的内容 (支持带 begin/end 头尾的经典格式)',
    encodeFail: '编码失败: {msg}',
    decodeFail: '解码失败: {msg}',
    divider: 'XXencode 编码说明',
  },
  'zh-TW': {
    appName: 'XXencode 編解碼',
    encode: 'XXencode 編碼',
    decode: 'XXencode 解碼',
    clear: '清除',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    encodePh: '輸入需要 XXencode 編碼的內容',
    decodePh: '輸入需要 XXencode 解碼的內容（支援帶 begin/end 頭尾的經典格式）',
    encodeFail: '編碼失敗：{msg}',
    decodeFail: '解碼失敗：{msg}',
    divider: 'XXencode 編碼說明',
  },
  en: {
    appName: 'XXencode',
    encode: 'XXencode Encode',
    decode: 'XXencode Decode',
    clear: 'Clear',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    encodePh: 'Enter text to XXencode',
    decodePh: 'Enter XXencoded text to decode (classic begin/end format supported)',
    encodeFail: 'Encode failed: {msg}',
    decodeFail: 'Decode failed: {msg}',
    divider: 'About XXencoding',
  },
} as const;
