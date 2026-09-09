// BCDCodec 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 面板交互文案 (按需扩展); 说明性长文 (tips/intro) 暂保留简中, 后续批次再翻
// 码型下拉选项取自 data.ts (8421/5421/2421/余3码 等技术名词), 作为内容数据保留原文
export default {
  default: 'zh-CN',
  'zh-CN': {
    // appName 缺省回退 define.tsx AppName (= 'BCD 编解码')
    typeLabel: '码型:',
    encode: '编码',
    decode: '解码',
    clear: '清除',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    encodePh: '输入十进制数字 (0-9, 可用空格/换行分隔) 进行 BCD 编码',
    decodePh: '输入 BCD 码串 (0/1, 每 4 位一组可用空格分组) 进行解码',
    encodeFail: '编码失败: {msg}',
    decodeFail: '解码失败: {msg}',
    divider: 'BCD 编解码说明',
  },
  'zh-TW': {
    appName: 'BCD 編解碼',
    typeLabel: '碼型：',
    encode: '編碼',
    decode: '解碼',
    clear: '清除',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    encodePh: '輸入十進位數字 (0-9，可用空格/換行分隔) 進行 BCD 編碼',
    decodePh: '輸入 BCD 碼串 (0/1，每 4 位一組可用空格分組) 進行解碼',
    encodeFail: '編碼失敗：{msg}',
    decodeFail: '解碼失敗：{msg}',
    divider: 'BCD 編解碼說明',
  },
  en: {
    appName: 'BCD Codec',
    typeLabel: 'Code type:',
    encode: 'Encode',
    decode: 'Decode',
    clear: 'Clear',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    encodePh: 'Enter decimal digits (0-9, space / newline separated) to BCD-encode',
    decodePh: 'Enter BCD bits (0/1, groupable every 4 bits with spaces) to decode',
    encodeFail: 'Encode failed: {msg}',
    decodeFail: 'Decode failed: {msg}',
    divider: 'About BCD',
  },
} as const;
