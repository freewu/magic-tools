// Mermaid 编辑器 静态数据: 内置示例 / 导出选项
// label / group 为 zh 原文, 界面展示时经 lang.ts 的 u() 取词
//
// 示例覆盖 mermaid 11.17 内置的全部图形类型 (Flowchart / Sequence / Class / State / ER /
// Mindmap / Architecture / Block / C4 / Cynefin / Event Modeling / Gantt / Git / Ishikawa /
// Kanban / Packet / Pie / Quadrant / Radar / Railroad (IR·ABNF·EBNF·PEG) / Requirement /
// Sankey / Timeline / TreeView / Treemap / User Journey / Venn / Wardley / XY)。
//
// 未内置 (本机无法预览, 故隐藏, 不在下拉框中出现):
//   - Use Case: mermaid 11.17 没有 usecase 解析器 (未注册, 无对应语法)
//   - ZenUML: 官方外挂插件 (@mermaid-js/mermaid-zenuml), 未随 mermaid 主包发布
//   - flowchart-elk: 需额外注册 ELK 布局加载器 (@mermaid-js/layout-elk), 未内置
//
// 个别图形受 mermaid 自身词法限制, 示例只能写 ASCII:
//   - sankey: 标签词法只接受 ASCII, 中文标签会报 Parse error (标题用 front-matter title)
//   - wardley: 节点名需加引号才能使用中文 (关系两端同样要带引号)
//   - requirement: text 字段中文需加引号
//   - architecture: 默认内置 cloud/database/disk/internet/server 图标, 无需联网

export type MermaidSampleGroup = 'basic' | 'chart' | 'flow' | 'grammar';

export interface MermaidSample {
  /** 示例 id: 同时用作导出文件名前缀 (mermaid-flowchart.svg) */
  id: string;
  /** 下拉框分组 (zh 原文, 走 u() 翻译) */
  group: MermaidSampleGroup;
  /** 下拉框显示名 (zh 原文, 走 u() 翻译) */
  label: string;
  /** Mermaid 源码 */
  code: string;
}

/** 分组标题 (zh 原文, 走 u() 翻译); key 顺序 = 下拉框分组顺序 */
export const GROUP_LABELS: Record<MermaidSampleGroup, string> = {
  basic: '基础图',
  chart: '数据图表',
  flow: '流程与排期',
  grammar: '语法图',
};

export const SAMPLES: MermaidSample[] = [
  {
    id: 'flowchart',
    group: 'basic',
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
    group: 'basic',
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
    group: 'basic',
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
    group: 'basic',
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
    id: 'er',
    group: 'basic',
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
    id: 'mindmap',
    group: 'basic',
    label: '思维导图 (mindmap)',
    code: `mindmap
  root((Mermaid 编辑器))
    基础图
      流程图
      时序图
      类图
      思维导图
    数据图表
      饼图
      桑基图
    导出
      SVG
      PNG
      WebP`,
  },
  {
    id: 'journey',
    group: 'basic',
    label: '用户旅程图 (journey)',
    code: `journey
  title 用户下单旅程
  section 浏览商品
    打开首页: 5: 用户
    搜索商品: 4: 用户
    查看详情: 5: 用户
  section 下单支付
    加入购物车: 4: 用户
    提交订单: 3: 用户, 系统
    完成支付: 2: 用户, 支付网关`,
  },
  {
    id: 'c4',
    group: 'basic',
    label: 'C4 架构图 (C4Context)',
    code: `C4Context
  title 商城系统上下文图
  Person(user, "顾客", "浏览商品并下单")
  System(shop, "商城系统", "提供商品、订单与支付能力")
  System_Ext(pay, "支付网关", "处理支付请求")
  System_Ext(sms, "短信服务", "发送通知短信")
  Rel(user, shop, "浏览 / 下单")
  Rel(shop, pay, "发起支付")
  Rel(shop, sms, "发送短信")`,
  },
  {
    id: 'architecture',
    group: 'basic',
    label: '架构图 (architecture-beta)',
    code: `architecture-beta
  group api(cloud)[接入层]
  service cdn(internet)[CDN] in api
  service web(server)[Web 服务] in api
  group backend(cloud)[应用层]
  service svc(server)[应用服务] in backend
  service db(database)[数据库] in backend
  service cache(disk)[缓存] in backend
  cdn:R -- L:web
  web:R -- L:svc
  svc:R -- L:db
  svc:B -- T:cache`,
  },
  {
    id: 'block',
    group: 'basic',
    label: '块图 (block-beta)',
    code: `block-beta
  columns 3
  web["浏览器"] cdn["CDN"] gw["API 网关"]
  svcA["订单服务"] svcB["用户服务"] db[("数据库")]
  web --> cdn
  cdn --> gw
  gw --> svcA
  gw --> svcB
  svcA --> db
  svcB --> db`,
  },
  {
    id: 'requirement',
    group: 'basic',
    label: '需求图 (requirementDiagram)',
    code: `requirementDiagram
  requirement login_req {
    id: 1
    text: "用户可以使用账号密码登录"
    risk: high
    verifymethod: test
  }
  element login_module {
    type: simulation
  }
  element login_page {
    type: other
  }
  login_module - satisfies -> login_req
  login_page - traces -> login_req`,
  },
  {
    id: 'pie',
    group: 'chart',
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
    id: 'quadrant',
    group: 'chart',
    label: '象限图 (quadrantChart)',
    code: `quadrantChart
  title 需求优先级评估
  x-axis 实现成本低 --> 实现成本高
  y-axis 价值低 --> 价值高
  quadrant-1 优先做
  quadrant-2 尽快做
  quadrant-3 暂缓
  quadrant-4 视情况做
  需求A: [0.2, 0.8]
  需求B: [0.35, 0.62]
  需求C: [0.55, 0.75]
  需求D: [0.75, 0.4]
  需求E: [0.85, 0.2]`,
  },
  {
    id: 'xychart',
    group: 'chart',
    label: 'XY 图 (xychart)',
    code: `xychart
  title "月度访问量"
  x-axis ["1月", "2月", "3月", "4月", "5月", "6月"]
  y-axis "访问量 (千次)" 10 --> 60
  bar [12, 18, 25, 32, 45, 52]
  line [12, 18, 25, 32, 45, 52]`,
  },
  {
    id: 'sankey',
    group: 'chart',
    label: '桑基图 (sankey)',
    code: `---
title: 用户转化漏斗
---
sankey
Home,Detail,120
Home,Search,60
Search,Detail,45
Detail,Cart,70
Cart,Order,52
Order,Paid,46
Order,Failed,6`,
  },
  {
    id: 'radar',
    group: 'chart',
    label: '雷达图 (radar-beta)',
    code: `radar-beta
  title 候选人能力对比
  axis html["HTML"], css["CSS"], js["JavaScript"], ts["TypeScript"], react["React"], test["测试"]
  curve a["候选人 A"]{85, 80, 90, 75, 70, 60}
  curve b["候选人 B"]{70, 75, 85, 88, 90, 80}
  max 100
  min 0`,
  },
  {
    id: 'treemap',
    group: 'chart',
    label: '矩形树图 (treemap-beta)',
    code: `treemap-beta
"源码"
    "src/App": 60
    "src/lib": 20
    "src/hook": 12
"工程配置"
    "package.json": 6
    "vite.config.mts": 4
    "tsconfig.json": 3`,
  },
  {
    id: 'venn',
    group: 'chart',
    label: '韦恩图 (venn-beta)',
    code: `venn-beta
  title "团队技能重叠"
  set a["前端"]:20
    text a1["React / Vue"]
    text a2["工程化"]
  set b["后端"]:16
    text b1["Java / Go"]
  set c["运维"]:10
  union a,b["全栈"]:4
  union b,c["部署"]:3`,
  },
  {
    id: 'packet',
    group: 'chart',
    label: '数据包图 (packet)',
    code: `packet
title TCP 报文头部
0-15: "源端口"
16-31: "目的端口"
32-63: "序号"
64-95: "确认号"
96-99: "数据偏移"
100-105: "保留"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "窗口"
128-143: "校验和"
144-159: "紧急指针"
160-191: "选项与填充"
192-255: "数据 (变长)"`,
  },
  {
    id: 'gantt',
    group: 'flow',
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
    id: 'gitgraph',
    group: 'flow',
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
  {
    id: 'timeline',
    group: 'flow',
    label: '时间线 (timeline)',
    code: `timeline
  title 工具箱版本演进
  section 起步
    1.0 : 加解密与哈希工具
    2.0 : 支持桌面 + Web 双端
  section 扩展
    2.5 : 图片处理工具集
    2.11 : Mermaid 编辑器`,
  },
  {
    id: 'kanban',
    group: 'flow',
    label: '看板 (kanban)',
    code: `kanban
  todo[待办]
    t1[补充 Mermaid 示例]@{ assigned: 'me', priority: 'High' }
    t2[整理说明文档]
  doing[进行中]
    t3[新增图形类型预览]
  done[已完成]
    t4[导出 SVG / PNG / WebP]`,
  },
  {
    id: 'ishikawa',
    group: 'flow',
    label: '鱼骨图 (ishikawa-beta)',
    code: `ishikawa-beta
    页面加载慢
    网络
        带宽不足
        CDN 未命中
    前端
        首屏资源过大
        未做代码分割
    后端
        SQL 未加索引
        接口串行调用
    环境
        低端机型
        弱网环境`,
  },
  {
    id: 'cynefin',
    group: 'flow',
    label: 'Cynefin 框架 (cynefin-beta)',
    code: `cynefin-beta
  title 线上故障分类
  complex
    "排查根因"
    "混沌演练"
  complicated
    "分析监控数据"
    "专家会诊"
  clear
    "重启服务"
    "应用已知修复"
  chaotic
    "立即呼叫值班"
  confusion
    "未知故障模式"
  complex --> complicated : "模式已明确"
  clear --> chaotic : "过度自信"`,
  },
  {
    id: 'wardley',
    group: 'flow',
    label: 'Wardley 地图 (wardley-beta)',
    code: `wardley-beta
title 电商平台价值链
anchor "用户" [0.95, 0.63]
component "下单" [0.79, 0.61]
component "支付" [0.63, 0.81]
component "商品库" [0.52, 0.80]
component "数据库" [0.43, 0.35]
component "云主机" [0.10, 0.70]
"用户" -> "下单"
"下单" -> "支付"
"下单" -> "商品库"
"商品库" -> "数据库"
"数据库" -> "云主机"
evolve "数据库" 0.62
note "数据库托管化后可按量扩容" [0.30, 0.49]`,
  },
  {
    id: 'eventmodeling',
    group: 'flow',
    label: '事件建模 (eventmodeling)',
    code: `eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem { description: string, price: number }
tf 03 evt ItemAdded
tf 04 rmo CartItems

rf 05 evt Inventory.Changed
tf 06 pcr InventoryProcessor
tf 07 cmd ChangeInventory
tf 08 evt Cart.InventoryChanged`,
  },
  {
    id: 'treeview',
    group: 'flow',
    label: '目录树 (treeView-beta)',
    code: `treeView-beta
├── src/
│   ├── App/
│   │   ├── MermaidEditor/
│   │   │   ├── index.tsx ## 页面
│   │   │   └── lib.ts ## 纯逻辑
│   │   └── index.tsx
│   └── lib/
│       └── tauri.ts
├── package.json
└── README.md`,
  },
  {
    id: 'railroad-ebnf',
    group: 'grammar',
    label: '语法图 · EBNF (railroad-ebnf-beta)',
    code: `railroad-ebnf-beta
title "JSON 语法"
json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;`,
  },
  {
    id: 'railroad-abnf',
    group: 'grammar',
    label: '语法图 · ABNF (railroad-abnf-beta)',
    code: `railroad-abnf-beta
title "邮件地址"
address = local-part "@" domain ;
local-part = 1*( ALPHA / DIGIT / "." / "-" ) ;
domain = label *( "." label ) ;
label = 1*( ALPHA / DIGIT / "-" ) ;`,
  },
  {
    id: 'railroad-peg',
    group: 'grammar',
    label: '语法图 · PEG (railroad-peg-beta)',
    code: `railroad-peg-beta
title "四则运算 Grammar"
Expression <- Term (("+" / "-") Term)* ;
Term <- Factor (("*" / "/") Factor)* ;
Factor <- Number / "(" Expression ")" ;
Number <- Digit+ ;
Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;`,
  },
  {
    id: 'railroad-ir',
    group: 'grammar',
    label: '语法图 · IR (railroad-beta)',
    code: `railroad-beta
title "表达式 IR"
expression = sequence(nonterminal("term"), zeroOrMore(sequence(choice(terminal("+"), terminal("-")), nonterminal("term")))) ;
term = sequence(nonterminal("factor"), zeroOrMore(sequence(choice(terminal("*"), terminal("/")), nonterminal("factor")))) ;
factor = choice(nonterminal("number"), sequence(terminal("("), nonterminal("expression"), terminal(")"))) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;`,
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

/** 缩放倍率: 同时作用于预览与位图导出 (SVG 为矢量, 不受倍率影响); 1x = 原图尺寸 (预览自适应卡片宽度) */
export const SCALE_OPTIONS = [ 1, 2, 3, 4 ];

export const DEFAULT_SCALE = 1;

/** 位图导出质量 (WebP 有损压缩) */
export const RASTER_QUALITY = 0.92;
