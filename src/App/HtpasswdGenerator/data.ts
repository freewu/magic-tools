// htpasswd 生成 - 支持的加密方式定义

export type HtpasswdMethod = 'bcrypt' | 'apr1' | 'sha1' | 'plain';

export type HtpasswdMethodItem = {
  value: HtpasswdMethod;
  label: string;   // 下拉框显示文本
  cmd: string;     // 对应的 htpasswd 命令行参数
  tip: string;     // 下拉框提示
};

export const HTPASSWD_METHODS: ReadonlyArray<HtpasswdMethodItem> = [
  {
    value: 'bcrypt',
    label: 'bcrypt ($2y$)',
    cmd: 'htpasswd -B',
    tip: '自带随机盐, 抗暴力破解能力最强, 新密码推荐使用 (部分旧系统需 Apache 2.4+)',
  },
  {
    value: 'apr1',
    label: 'Apache MD5 ($apr1$)',
    cmd: 'htpasswd -m',
    tip: 'Apache 默认算法, 兼容性最好, 除 Apache 外的多数 Web 服务均支持',
  },
  {
    value: 'sha1',
    label: 'SHA1 ({SHA})',
    cmd: 'htpasswd -s',
    tip: '固定盐值 (无盐), 存在彩虹表风险, 不建议用于新密码',
  },
  {
    value: 'plain',
    label: '明文 (不推荐)',
    cmd: 'htpasswd -p',
    tip: '密码以明文存储, 部分服务端编译时已禁用该方式',
  },
];

// 默认加密方式
export const DEFAULT_METHOD: HtpasswdMethod = 'bcrypt';

// bcrypt 默认成本 (cost, 迭代次数 = 2^cost)
export const DEFAULT_BCRYPT_ROUNDS = 10;
export const BCRYPT_ROUNDS_MIN = 4;
export const BCRYPT_ROUNDS_MAX = 15;

// 用户名 / 密码 不允许包含的字符
export const FORBIDDEN_CHARS = ':\r\n';
