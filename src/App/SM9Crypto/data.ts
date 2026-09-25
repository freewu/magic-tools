// SM9 加解密 — 常量 / 示例数据
// SM9 (GM/T 0044-2016) 标识密码: 主密钥由密钥中心生成, 用户私钥由「主私钥 + ID」提取

/** 标签页列表 (index.tsx 与测试共用) */
export const tabList = [
  { key: 'keygen', label: '密钥生成' },
  { key: 'encrypt', label: '加密' },
  { key: 'decrypt', label: '解密' },
  { key: 'sign', label: '签名验签' },
];

/** 默认用户 ID */
export const DEFAULT_ID = 'alice@example.com';

/** 示例明文 (UTF-8 字节数 ≤ 255) */
export const SAMPLE_PLAIN = 'Hello SM9 国密标识密码!';

/** 示例签名数据 */
export const SAMPLE_DATA = 'MagicTools SM9 签名测试数据';

/** SM9 单组明文上限 (字节, 与 GmSSL 的 SM9_MAX_PLAINTEXT_SIZE 一致) */
export const MAX_PLAINTEXT = 255;
