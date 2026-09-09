// JWTDecoder 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 面板交互文案 (按需扩展); 说明性长文 (tips/intro/算法说明) 暂保留简中, 后续批次再翻
// lib 内解析错误提示为内容数据保留原文
export default {
  default: 'zh-CN',
  'zh-CN': {
    // appName 缺省回退 define.tsx AppName (= 'JWT 解码')
    placeholder: '粘贴 JWT (header.payload.signature, 例如 eyJhbGciOi...)',
    copyOk: '复制到粘贴板成功！！！',
    copyTitle: '双击复制内容到粘贴板',
    metaInfo: 'Header 元信息: {meta}',
    metaNone: '无 alg/typ/kid 字段',
    headerTitle: '① 头部 (Header)',
    payloadTitle: '② 负载 (Payload)',
    sigTitle: '③ 签名 (Signature)',
    sigEmpty: '(空签名, 可能为 none 算法)',
    clickTitle: '点击复制 HEX 签名',
    divider: 'JWT 解码说明',
  },
  'zh-TW': {
    appName: 'JWT 解碼器',
    placeholder: '貼上 JWT (header.payload.signature，例如 eyJhbGciOi...)',
    copyOk: '複製到剪貼簿成功！！！',
    copyTitle: '雙擊複製內容到剪貼簿',
    metaInfo: 'Header 元資訊：{meta}',
    metaNone: '無 alg/typ/kid 欄位',
    headerTitle: '① 標頭 (Header)',
    payloadTitle: '② 負載 (Payload)',
    sigTitle: '③ 簽名 (Signature)',
    sigEmpty: '(空簽名，可能為 none 演算法)',
    clickTitle: '點擊複製 HEX 簽名',
    divider: 'JWT 解碼說明',
  },
  en: {
    appName: 'JWT Decoder',
    placeholder: 'Paste a JWT (header.payload.signature, e.g. eyJhbGciOi...)',
    copyOk: 'Copied to clipboard!',
    copyTitle: 'Double-click to copy',
    metaInfo: 'Header metadata: {meta}',
    metaNone: 'no alg/typ/kid field',
    headerTitle: '① Header',
    payloadTitle: '② Payload',
    sigTitle: '③ Signature',
    sigEmpty: '(no signature; possibly a "none" algorithm)',
    clickTitle: 'Click to copy HEX signature',
    divider: 'About JWT Decoding',
  },
} as const;
