// 即时渲染 Markdown 的示例文档与选项常量
//
// 示例覆盖 Vditor (lute 引擎) 的主要语法: 标题 / 列表 / 表格 / 任务 / 脚注 /
// 代码块高亮 / 行内与块级公式 / 提示块 (callout) / 上下标 / 高亮标记。
// 代码围栏用 FENCE 常量拼接, 避免在模板字符串里转义反引号。
import type { EditorMode } from './lib';

const FENCE = '```';

export interface VditorSample {
  id: string;
  /** 中文标签 (经语言包翻译) */
  label: string;
  md: string;
}

/** 编辑器模式选项 (ir 为默认, 即"即时渲染") */
export const MODE_OPTIONS: { value: EditorMode; label: string }[] = [
  { value: 'ir', label: '即时渲染' },
  { value: 'sv', label: '分屏预览' },
  { value: 'wysiwyg', label: '所见即所得' },
];

export const SAMPLES: VditorSample[] = [
  {
    id: 'basic',
    label: '基础语法',
    md: `# Markdown 基础语法

> 边写边看: **即时渲染** 模式下光标所在块会立刻变成渲染结果。

## 文本样式

**粗体**、*斜体*、~~删除线~~、\`行内代码\`、==高亮标记==、H~2~O 下标、x^2^ 上标。

## 列表

- 无序项
  - 嵌套项 (缩进两个空格)
  - 另一个嵌套项
- 有序项

1. 第一步
2. 第二步
   1. 子步骤

## 引用与分隔线

> 一级引用
>
> > 嵌套引用

---

## 链接与图片

[magic-tools 仓库](https://github.com/freewu/magic-tools) 与 **自动链接** https://example.com

![示例图片](https://picsum.photos/seed/md/640/240)
`,
  },
  {
    id: 'gfm',
    label: '表格 / 任务 / 脚注',
    md: `# 表格 · 任务 · 脚注

## 表格 (支持对齐)

| 功能 | 快捷键 | 说明 |
| :--- | :---: | ---: |
| 加粗 | Ctrl+B | 选中的文字加粗 |
| 插入表格 | Ctrl+Shift+T | 弹出表格行列选择 |
| 全屏 | Ctrl+Alt+F | 编辑器占满窗口 |

## 任务列表

- [x] 预览 Markdown 表格
- [x] 勾选任务项
- [ ] 继续补充文档
  - [ ] 嵌套任务

## 脚注

Vditor 使用 lute 引擎解析 Markdown[^1], 与 CommonMark 基本一致[^gfm]。

[^1]: lute 是 88250 开发的 Go 语言 Markdown 引擎。
[^gfm]: 额外支持表格 / 任务列表 / 删除线等 GitHub 扩展语法。

## 提示块 (callout)

> [!NOTE]
> 提示块用于强调补充信息。

> [!WARNING]
> 注意: 即时渲染模式下工具栏也可以插入提示块。
`,
  },
  {
    id: 'code',
    label: '代码块与高亮',
    md: `# 代码块与语法高亮

行内代码: \`const a = 1\`, 指定语言的围栏代码块会按语言高亮。

${FENCE}ts
// TypeScript: 泛型 + 可选链
interface Tool {
  name: string;
  type?: 'formatter' | 'generator';
}

const pick = <T, K extends keyof T>(item: T, key: K): T[K] => item[key];
export const label = (tool: Tool): string => pick(tool, 'name')?.toUpperCase() ?? '';
${FENCE}

${FENCE}bash
# 安装依赖并启动开发服务器
npm ci
npm run dev:renderer
${FENCE}

${FENCE}json
{
  "name": "magic-tools",
  "features": [ "formatter", "generator", "webmaster" ],
  "offline": true
}
${FENCE}

${FENCE}
未指定语言的代码块使用默认样式。
${FENCE}
`,
  },
  {
    id: 'math',
    label: '数学公式',
    md: `# 数学公式 (KaTeX)

行内公式: 质能方程 $E = mc^2$, 勾股定理 $a^2 + b^2 = c^2$。

## 块级公式

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## 矩阵

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

## 化学式 (mhchem)

$$\\ce{2H2 + O2 -> 2H2O}$$
`,
  },
  {
    id: 'doc',
    label: '技术文档模板',
    md: `# 接口文档: 用户登录

## 请求

${FENCE}http
POST /api/v1/login HTTP/1.1
Content-Type: application/json

{ "username": "demo", "password": "******" }
${FENCE}

## 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | :---: | --- |
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 (前端先做一次 SHA-256) |
| remember | boolean | 否 | 是否记住登录状态, 默认 false |

## 响应

${FENCE}json
{
  "code": 0,
  "data": { "token": "eyJhbGciOi...", "expiresIn": 7200 },
  "message": "ok"
}
${FENCE}

## 错误码

| code | 说明 | 处理建议 |
| ---: | --- | --- |
| 1001 | 用户名或密码错误 | 提示用户重试, 连续 5 次锁定 10 分钟 |
| 1002 | 账号被禁用 | 联系管理员 |
| 5000 | 服务端异常 | 稍后重试 |

## 备注

> [!TIP]
> 所有时间字段均为 UTC 秒级时间戳, 展示时再转本地时区。
`,
  },
  {
    id: 'report',
    label: '周报模板',
    md: `# 第 38 周工作周报 (09-14 ~ 09-18)

## 本周完成

- [x] 「iptables 规则」新增简单配置页签 (开放端口 / 封禁 IP / 端口转发)
- [x] 「nginx 配置」开关改为复选框, 一行 6-8 个
- [x] 桌面端窗口默认尺寸调整为 1200 x 728
- [x] 发布 v2.13.0 (三平台构建 + Pages 部署)

## 进行中

| 任务 | 进度 | 预计完成 |
| --- | :---: | --- |
| 即时渲染 Markdown 工具 | 70% | 09-19 |
| 文档站同步更新 | 30% | 09-20 |

## 风险与求助

> [!WARNING]
> Vditor 的运行时资源 (lute / katex) 体积较大, 构建时需要按需拷贝, 避免打进首屏。

## 下周计划

1. 完成 Markdown 工具并与现有「Markdown 编辑器」做能力对比
2. 补充单元测试与文档 (README / 文档站)
3. 按需发布下个版本
`,
  },
];

/** 默认示例 (打开页面时的初始文档) */
export const DEFAULT_SAMPLE_ID = SAMPLES[0].id;

/** 按 id 取示例 */
export function findSample(id: string): VditorSample | undefined {
  return SAMPLES.find((s) => s.id === id);
}
