// JSON5 处理: 解析 (支持注释/单引号/无引号键/尾逗号等超集语法) / 格式化 / 压缩 / 转树
// 注意: json5 的 ESM 入口 (dist/index.mjs) 仅 default 导出 { parse, stringify },
// CJS 主入口同理是整模块对象; 统一用 default import (synthetic default) 双端兼容。
import JSON5 from 'json5';

export const INDENT = 2;

export const j5Parse = JSON5.parse;

// 格式化 (2 空格缩进; 开启缩进时输出尾逗号, 为合法 JSON5)
export const j5Pretty = (text: string): string => JSON5.stringify(JSON5.parse(text), null, INDENT);

// 压缩为一行 (无缩进不输出尾逗号, 更接近单行风格)
export const j5Compact = (text: string): string => JSON5.stringify(JSON5.parse(text), null, null);

// 解析并返回原始值 (供树面板使用; 失败抛 SyntaxError)
export const j5ParseValue = (text: string): unknown => JSON5.parse(text);
