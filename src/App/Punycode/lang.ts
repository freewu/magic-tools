// Punycode 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 面板交互文案 (按需扩展); 说明性长文 (tips/intro) 暂保留简中, 后续批次再翻
export default {
  default: 'zh-CN',
  'zh-CN': {
    // appName 缺省回退 define.tsx AppName (= 'Punycode 编解码')
    encode: '编码',
    decode: '解码',
    clear: '清除',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    encodePh: '输入需要编码为 Punycode 的文本 (如: 中文、中文.中国、bücher.de)  或 拖拽文件到框内打开',
    decodePh: '输入需要解码的 Punycode 文本 (如: xn--fiq228c、xn--fiq228c.xn--fiqs8s、xn--bcher-kva.de)  或 拖拽文件到框内打开',
    encodeFailed: '编码失败！！！',
    decodeFailed: '解码失败: 输入不是有效的 Punycode 文本！！！',
    divider: 'Punycode 编码说明',
  },
  'zh-TW': {
    appName: 'Punycode 編解碼',
    encode: '編碼',
    decode: '解碼',
    clear: '清除',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    encodePh: '輸入需要編碼為 Punycode 的文字（如：中文、中文.中國、bücher.de），或將檔案拖入框內開啟',
    decodePh: '輸入需要解碼的 Punycode 文字（如：xn--fiq228c、xn--fiq228c.xn--fiqs8s、xn--bcher-kva.de），或將檔案拖入框內開啟',
    encodeFailed: '編碼失敗！！！',
    decodeFailed: '解碼失敗：輸入不是有效的 Punycode 文字！！！',
    divider: 'Punycode 編碼說明',
  },
  en: {
    appName: 'Punycode Encode / Decode',
    encode: 'Encode',
    decode: 'Decode',
    clear: 'Clear',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    encodePh: 'Enter text to encode to Punycode (e.g. 中文, 中文.中国, bücher.de), or drag & drop a file here',
    decodePh: 'Enter Punycode text to decode (e.g. xn--fiq228c, xn--fiq228c.xn--fiqs8s, xn--bcher-kva.de), or drag & drop a file here',
    encodeFailed: 'Encode failed!',
    decodeFailed: 'Decode failed: input is not valid Punycode!',
    divider: 'About Punycode Encoding',
  },
} as const;
