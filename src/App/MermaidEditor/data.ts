// Mermaid 编辑器 静态数据: 内置示例 / 导出选项
// label 为 zh 原文, 界面展示时经 lang.ts 的 u() 取词

export interface MermaidSample {
  /** 示例 id: 同时用作导出文件名前缀 (mermaid-flowchart.svg) */
  id: string;
  /** 下拉框显示名 (zh 原文, 走 u() 翻译) */
  label: string;
  /** Mermaid 源码 */
  code: string;
}

export const SAMPLES: MermaidSample[] = [
  {
    id: 'flowchart',
    label: '流程图 (flowchart)',
    code: `flowchart TD
  A[开始] --> B{是否登录}
  B -- 是 --> C[进入首页]
  B -- 否 --> D[跳转登录页]
  D --> E[提交账号密码]
  E --> B
  C --> F[结束]`,
  },
  {
    id: 'sequence',
    label: '时序图 (sequenceDiagram)',
    code: `sequenceDiagram
  autonumber
  participant U as 用户
  participant A as 前端
  participant S as 服务端
  participant D as 数据库
  U->>A: 提交登录表单
  A->>S: POST /api/login
  S->>D: 查询用户记录
  D-->>S: 用户记录
  S-->>A: 200 OK + token
  A-->>U: 登录成功, 写入本地凭证`,
  },
  {
    id: 'class',
    label: '类图 (classDiagram)',
    code: `classDiagram
  class 形状 {
    +String 名称
    +面积() double
  }
  class 圆 {
    +double 半径
    +面积() double
  }
  class 矩形 {
    +double 宽
    +double 高
  }
  形状 <|-- 圆
  形状 <|-- 矩形`,
  },
  {
    id: 'state',
    label: '状态图 (stateDiagram-v2)',
    code: `stateDiagram-v2
  [*] --> 待支付
  待支付 --> 已支付 : 付款成功
  待支付 --> 已取消 : 超时未付款
  已支付 --> 已发货 : 商家发货
  已发货 --> 已完成 : 确认收货
  已完成 --> [*]
  已取消 --> [*]`,
  },
  {
    id: 'gantt',
    label: '甘特图 (gantt)',
    code: `gantt
  title 项目排期示例
  dateFormat YYYY-MM-DD
  axisFormat %m-%d
  section 需求
  需求调研 :a1, 2024-03-01, 5d
  需求评审 :a2, after a1, 3d
  section 开发
  接口开发 :b1, after a2, 10d
  前端开发 :b2, after a2, 12d
  section 测试
  联调测试 :c1, after b2, 5d
  上线 :milestone, after c1, 0d`,
  },
  {
    id: 'pie',
    label: '饼图 (pie)',
    code: `pie showData
  title 浏览器市场份额 (示例数据)
  "Chrome" : 65
  "Safari" : 18
  "Edge" : 8
  "Firefox" : 5
  "其他" : 4`,
  },
  {
    id: 'er',
    label: 'ER 图 (erDiagram)',
    code: `erDiagram
  用户 ||--o{ 订单 : 下单
  订单 ||--|{ 商品 : 包含
  用户 {
    int id PK
    string 名称
    string 邮箱
  }
  订单 {
    int id PK
    int 用户id FK
    datetime 创建时间
  }`,
  },
  {
    id: 'gitgraph',
    label: 'Git 分支图 (gitGraph)',
    code: `gitGraph
  commit id: "init"
  branch develop
  commit id: "feat: 登录"
  commit id: "fix: 样式"
  checkout main
  merge develop tag: "v1.0.0"
  commit id: "hotfix: 文案"`,
  },
];

/** 导出文件名前缀 (未选择示例时的兜底) */
export const DEFAULT_FILE_BASE = 'mermaid-diagram';

/** 位图导出时的画布背景 (SVG 导出始终透明) */
export type RasterBackground = 'white' | 'dark' | 'transparent';

export const BACKGROUND_OPTIONS: Array<{ value: RasterBackground; label: string; color: string | null }> = [
  { value: 'white', label: '白色', color: '#ffffff' },
  { value: 'dark', label: '深色', color: '#1f1f1f' },
  { value: 'transparent', label: '透明', color: null },
];

/** 位图导出倍率 (SVG 为矢量, 不受影响) */
export const SCALE_OPTIONS = [ 1, 2, 3, 4 ];

export const DEFAULT_SCALE = 2;

/** 位图导出质量 (WebP 有损压缩) */
export const RASTER_QUALITY = 0.92;
