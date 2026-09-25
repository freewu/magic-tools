// JWTDecoder 生成 (编码) 页签的选项与默认值

/** 签名算法选项 (标签在页面按语言渲染) */
export const algList = [ 'HS256', 'HS384', 'HS512', 'none' ] as const;

/** 默认头部 */
export const DEFAULT_HEADER = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';

/** 默认负载 (jwt.io 官方示例声明) */
export const DEFAULT_PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}';

/** 默认密钥 (jwt.io 官方示例密钥) */
export const DEFAULT_SECRET = 'your-256-bit-secret';

/** 可在头部 alg 字段中识别的算法 */
export const ALG_VALUES = [ 'HS256', 'HS384', 'HS512', 'none' ];
