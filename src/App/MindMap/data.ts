// 思维导图 静态数据: 内置示例 / 配色方案 / 视图参数 / 导出选项
// label / 界面文案均为 zh 原文, 展示时经 lang.ts 的 u() 取词
//
// 基于 markmap (markmap-lib 解析 Markdown -> markmap-view 用 d3 渲染为 SVG)。
// 每个示例的 Markdown 都遵循 markmap 的解析规则:
//   - 标题 (#/##/###) 与列表 (- / 1.) 都能建节点, 但同一父节点下混用会互相覆盖,
//     故示例内统一使用标题, 需要演示列表时才整段使用列表;
//   - 折叠标记 <!-- markmap: fold --> 必须与标题写在同一行才生效;
//   - frontmatter 里的 markmap 字段可覆盖视图参数 (如 colorFreezeLevel)。

export interface MindMapSample {
  /** 示例 id: 同时用作导出文件名前缀 (mindmap-project.svg) */
  id: string;
  /** 下拉框显示名 (zh 原文, 走 u() 翻译) */
  label: string;
  /** 该示例的简要说明 (zh 原文, 走 u() 翻译) */
  desc: string;
  /** Markdown 大纲源码 */
  code: string;
}

export const SAMPLES: MindMapSample[] = [
  {
    id: 'project',
    label: '项目计划',
    desc: '迭代目标 / 排期 / 风险, 适合周会与项目启动',
    code: `---
title: MagicTools v2.18 迭代计划
markmap:
  colorFreezeLevel: 2
---

# MagicTools v2.18 迭代计划

## 目标

### 图片工具易用性

### 格式化工具链补齐

### 桌面端启动速度

## 排期

### 第 1 周 需求评审与原型

### 第 2-3 周 开发与自测

### 第 4 周 回归测试与发布

## 风险

### markmap / mermaid 体积偏大

### 浏览器与 WebView2 兼容性

## 分工

### 前端 3 人

### 测试 1 人
`,
  },
  {
    id: 'learning',
    label: '学习路线',
    desc: '由浅入深的知识路径, 适合技术学习规划',
    code: `# 前端工程师学习路线

## 基础

### HTML 语义化

### CSS 布局与响应式

### JavaScript

#### 语法与类型

#### 异步与事件循环

#### 原型与继承

## 工程化

### 构建工具

#### Vite

#### Rollup

### 包管理与 Monorepo

### 代码规范与提交检查

## 框架

### React

#### 组件与状态

#### 性能优化

### Vue

## 浏览器与网络

### HTTP 缓存

### 跨域与安全

### 性能指标 (LCP / INP / CLS)

## 进阶方向

### 可视化 (Canvas / SVG / WebGL)

### 客户端 (Electron / Tauri)

### 服务端 (Node / Deno)
`,
  },
  {
    id: 'meeting',
    label: '会议纪要',
    desc: '待办清单 + 结论沉淀, 复选框可直接标记状态',
    code: `# 产品周会纪要 (示例)

## 时间与参与人

### 2026-09-26 10:00

### 产品 / 前端 / 后端 / 测试

## 结论

### 图片工具优先补齐像素风与思维导图

### 下一版继续压缩首屏体积

### 桌面端保留离线可用能力

## 待办

- [x] 确认 markmap 依赖体积
- [x] 补齐中英繁三语文案
- [ ] 补充工具说明页
- [ ] 更新应用中心截图

## 待确认问题

### Web 版是否需要导出 PNG

### 设置中心是否需要默认配色项
`,
  },
  {
    id: 'knowledge',
    label: '知识体系',
    desc: '读书笔记 / 领域知识地图, 适合长期积累',
    code: `# 浏览器渲染知识地图

## 网络

### DNS 解析

### TCP / TLS 握手

### HTTP 缓存策略

## 解析

### HTML -> DOM 树

### CSS -> CSSOM 树

### JavaScript 阻塞与 async / defer

## 渲染

### 样式计算

### 布局 (Layout / Reflow)

### 绘制 (Paint)

### 合成 (Composite / GPU)

## 性能优化

### 减少重排重绘

### 长任务拆分

### 资源优先级与预加载

## 常见误区

### 操作 DOM 就一定慢

### will-change 越多越好
`,
  },
  {
    id: 'requirements',
    label: '需求拆解',
    desc: '把一句需求拆成可执行的功能点',
    code: `# 需求拆解: 图片批量压缩

## 用户故事

### 作为设计师, 我希望一次压缩多张图

### 作为运营, 我希望压缩后保持清晰度

## 功能点

### 多选与拖拽上传

### 统一参数 (质量 / 最长边 / 格式)

### 队列与进度展示

### 结果打包下载

## 非功能需求

### 单张 20MB 图片可处理

### 全程本地处理, 不上传服务器

### 桌面端与 Web 版行为一致

## 验收标准

### 压缩后体积下降 50% 以上

### 肉眼无明显色差
`,
  },
  {
    id: 'syntax',
    label: 'markmap 语法速查',
    desc: '标题 / 列表 / 折叠 / 复选框 / 代码块等写法示例',
    code: `# markmap 语法速查

## 标题建层级

### 一级标题 # 是根节点

### 二级标题 ## 是根的一级子节点

### 想再深一层就继续加 #

## 列表也建节点

- 无序列表用 - 或 *
- 缩进两格表示下一层
  - 缩进越多层级越深
  - 同一层请保持相同缩进

## 折叠与展开

### 标题后加折叠标记即可默认收起 <!-- markmap: fold -->

### 整棵树默认折叠用 foldAll 标记 (本示例未开启)

### 点击节点上的圆点可随手折叠或展开

## 行内格式

### 支持 **加粗** 与 *斜体*

### 支持 \`行内代码\` 与 [链接](https://markmap.js.org/)

### 支持删除线 ~~已废弃~~ 与高亮 ==重点==

## 代码块

\`\`\`js
// 代码块会整块作为节点内容
const mindmap = (md) => transform(md).root;
\`\`\`

## 复选框

- [x] 已完成项会显示为勾选

- [ ] 未完成项会显示为方框

## frontmatter 覆盖视图参数

### 文件开头用 --- 包裹 frontmatter

### 其中 markmap.colorFreezeLevel 可冻结配色层级
`,
  },
];

/** 导出文件名前缀 (未选中示例时兜底) */
export const DEFAULT_FILE_BASE = 'mindmap';

// ---------------- 配色方案 ----------------

export type ColorSchemeKey = 'default' | 'blue' | 'green' | 'mono' | 'warm' | 'cool';

export interface ColorScheme {
  /** 下拉框显示名 (zh 原文, 走 u() 翻译) */
  label: string;
  /** 分级配色 (markmap 按节点路径依次取色); 空数组 = 使用 markmap 默认配色 */
  colors: string[];
}

/** key 顺序 = 下拉框顺序 */
export const COLOR_SCHEME_KEYS: ColorSchemeKey[] = [ 'default', 'blue', 'green', 'mono', 'warm', 'cool' ];

export const COLOR_SCHEMES: Record<ColorSchemeKey, ColorScheme> = {
  default: { label: '多色', colors: [] },
  blue: { label: '蓝', colors: [ '#1971c2' ] },
  green: { label: '绿', colors: [ '#2f9e44' ] },
  mono: { label: '灰', colors: [ '#495057' ] },
  warm: { label: '暖色', colors: [ '#e8590c', '#f08c00', '#f59f00', '#fab005', '#ffd43b' ] },
  cool: { label: '冷色', colors: [ '#0c8599', '#1098ad', '#15aabf', '#22b8cf', '#66d9e8' ] },
};

export const COLOR_DEFAULT: ColorSchemeKey = 'default';

// ---------------- 视图参数 ----------------

/** 展开层级: -1 = 全部展开 (markmap 约定) */
export const DEPTH_ALL = -1;

export const DEPTH_OPTIONS: number[] = [ DEPTH_ALL, 1, 2, 3, 4 ];

/** 层级下拉显示名 (zh 原文, 走 u() 翻译) */
export const DEPTH_LABELS: Record<number, string> = {
  [DEPTH_ALL]: '全部',
  1: '一层',
  2: '两层',
  3: '三层',
  4: '四层',
};

export const DEPTH_DEFAULT = DEPTH_ALL;

/** 节点字号 (px) */
export const FONT_SIZES = [ 12, 14, 16, 18, 20, 22 ];

export const FONT_DEFAULT = 16;

/** 行高 = 字号的固定倍数 (markmap 的 foreignObject 靠行高计算节点高度) */
export const LINE_HEIGHT_RATIO = 1.25;

/** 预览画布高度 (px) */
export const PREVIEW_HEIGHT = 520;

/** 动画时长固定 0: 逐帧动画会让「导出」拿到中间态 (透明度/连线为 0), 静态渲染更可靠 */
export const DURATION = 0;

/** 水平 / 垂直间距与节点内边距 (markmap view 参数, 保持默认值的显式声明) */
export const SPACING_HORIZONTAL = 80;
export const SPACING_VERTICAL = 5;
export const PADDING_X = 8;
export const NODE_MIN_HEIGHT = 16;

/** 导出 SVG 时内容四周留白 (px) */
export const EXPORT_PADDING = 16;

// ---------------- 导出选项 ----------------

/** 位图导出时的画布背景 (SVG 导出始终透明) */
export type RasterBackground = 'white' | 'dark' | 'transparent';

export const BACKGROUND_OPTIONS: Array<{ value: RasterBackground; label: string; color: string | null }> = [
  { value: 'white', label: '白色', color: '#ffffff' },
  { value: 'dark', label: '深色', color: '#1f1f1f' },
  { value: 'transparent', label: '透明', color: null },
];

/** 位图导出倍率 (矢量导出不受影响) */
export const SCALE_OPTIONS = [ 1, 2, 3, 4 ];

/** 缩放下拉显示名: 百分比与倍率同时给出 (zh 原文, 走 u() 翻译) */
export const SCALE_LABELS: Record<number, string> = {
  1: '100% (x1)',
  2: '200% (x2)',
  3: '300% (x3)',
  4: '400% (x4)',
};

export const DEFAULT_SCALE = 1;

/** 位图导出质量 (WebP 有损压缩) */
export const RASTER_QUALITY = 0.92;
