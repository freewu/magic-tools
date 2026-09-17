// CSR 申请文件: 表单默认值 / 可选项 / 文件名
import type { CsrKeyBits, CsrSubjectInput, PrivateKeyFormat } from './lib';

/** 输出文件名 (与 CA 申请书 / 服务端配置文档里的常见命名保持一致) */
export const KEY_FILE_NAME = 'server.key';
export const CSR_FILE_NAME = 'server.csr';

/** 表单默认主体 (@see CsrSubjectInput) */
export const DEFAULT_SUBJECT: CsrSubjectInput = {
  commonName: '',
  organization: '',
  organizationalUnit: '',
  locality: '',
  state: '',
  country: 'CN',
  email: '',
};

/** 密钥算法可选位数 (2048 起步, 4096 更安全但生成更慢) */
export const KEY_BITS_OPTIONS: CsrKeyBits[] = [ 2048, 3072, 4096 ];

/** 私钥格式可选值 */
export const KEY_FORMAT_OPTIONS: { value: PrivateKeyFormat; label: string; tip: string }[] = [
  { value: 'pkcs8', label: 'PKCS#8 (PRIVATE KEY)', tip: 'OpenSSL 3.x 默认格式, Nginx / Apache / IIS 均可直接使用' },
  { value: 'pkcs1', label: 'PKCS#1 (RSA PRIVATE KEY)', tip: '旧版软件 (OpenSSL 1.x / 部分面板) 更常见的格式, 两者可互相转换' },
];

/** 表单字段定义 (顺序即界面顺序) */
export interface SubjectFieldSpec {
  key: keyof CsrSubjectInput;
  /** 字段名 (语言键, 中文原文) */
  label: string;
  /** 输入提示 */
  placeholder: string;
  /** 是否必填 */
  required?: boolean;
  /** 最大长度 (按字符计) */
  maxLength?: number;
  /** 输入时自动转大写 (国家代码) */
  upper?: boolean;
}

export const SUBJECT_FIELDS: SubjectFieldSpec[] = [
  { key: 'commonName', label: '通用名称 (CN)', placeholder: 'example.com 或 公司名 (必填)', required: true, maxLength: 64 },
  { key: 'organization', label: '组织 (O)', placeholder: '如 深圳市某某科技有限公司', maxLength: 64 },
  { key: 'organizationalUnit', label: '部门 (OU)', placeholder: '如 运维部 / 技术部', maxLength: 64 },
  { key: 'locality', label: '城市 (L)', placeholder: '如 深圳市', maxLength: 64 },
  { key: 'state', label: '省份 (ST)', placeholder: '如 广东省', maxLength: 64 },
  { key: 'country', label: '国家代码 (C)', placeholder: 'CN', maxLength: 2, upper: true },
  { key: 'email', label: '邮箱 (Email)', placeholder: 'admin@example.com (选填)', maxLength: 128 },
];

/** SAN 输入框的占位提示 */
export const SAN_PLACEHOLDER = 'example.com\nwww.example.com\n*.example.com\n192.168.1.10 (IP 自动识别, 也可写 IP:192.168.1.10)';

/** CN 最大长度 (X.509 建议值) */
export const CN_MAX = 64;
