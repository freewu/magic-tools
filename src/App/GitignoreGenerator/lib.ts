// .gitignore 生成核心逻辑: 纯函数, 不引入任何依赖
import {
  GITIGNORE_CATEGORIES,
  GITIGNORE_TEMPLATES,
  GITIGNORE_PRESETS,
  type GitignorePreset,
  type GitignoreTemplate,
} from './data';

export type { GitignoreTemplate, GitignorePreset };
export { GITIGNORE_CATEGORIES, GITIGNORE_TEMPLATES, GITIGNORE_PRESETS };

// 生成选项
export interface GitignoreOptions {
  header: boolean;         // 顶部说明注释
  groupComments: boolean;  // 每个模板前的分组注释
  sortLibraryOrder: boolean; // 按模板库顺序输出 (否则按勾选顺序)
  dedupe: boolean;         // 跨模板去重
}

export const DEFAULT_GITIGNORE_OPTIONS: GitignoreOptions = {
  header: true,
  groupComments: true,
  sortLibraryOrder: true,
  dedupe: true,
};

// 选项默认值 (深拷贝, 避免外部改动常量)
export const emptyGitignoreOptions = (): GitignoreOptions => ({ ...DEFAULT_GITIGNORE_OPTIONS });

export interface GitignoreSection {
  id: string;
  label: string;
  category: string;
  lines: string[];
}

export interface GitignorePlan {
  errors: string[];        // 错误码 (gi-*)
  warnings: string[];      // 警告码 (gi-*)
  sections: GitignoreSection[];
  content: string;         // 最终 .gitignore 文本
  templateCount: number;   // 命中的模板数 (含自定义)
  ruleCount: number;       // 规则行数 (不含注释)
  commentCount: number;    // 注释行数
  duplicateCount: number;  // 被去重掉的行数
  fileName: string;
}

// 全部模板 id (按模板库顺序)
export const allTemplateIds = (): string[] => GITIGNORE_TEMPLATES.map((t) => t.id);

const TEMPLATE_MAP: Record<string, GitignoreTemplate> = (() => {
  const map: Record<string, GitignoreTemplate> = {};
  for (const t of GITIGNORE_TEMPLATES) map[t.id] = t;
  return map;
})();

// 规范化行: 去 \r / 首尾空白 / 空行 (注释行保留)
export const normalizeLines = (text: string): string[] => (
  text
    .split('\n')
    .map((l) => l.replace(/\r/g, '').trim())
    .filter((l) => l !== '')
);

// 解析自定义追加内容 (逐行), 行内重复只保留第一条
export const parseCustom = (text: string): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of normalizeLines(text)) {
    if (!seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }
  return out;
};

// 勾选 / 取消勾选 (返回新数组, 保持勾选顺序)
export const toggleTemplate = (selected: string[], id: string): string[] => (
  selected.includes(id) ? selected.filter((v) => v !== id) : [ ...selected, id ]
);

// 界面阈值: 分类内选项超过此值时改用下拉多选 (否则平铺复选框)
export const MAX_INLINE_OPTIONS = 5;

/**
 * 分组多选回写: 用某个分类的新选择替换该分类原有的勾选, 其它分类保持不变。
 * 新选项追加在末尾, 与逐项勾选的行为一致 (「按模板库顺序」开关关闭时输出顺序即勾选顺序)。
 */
export const mergeGroupSelection = (selected: string[], groupIds: string[], nextIds: string[]): string[] => {
  const group = new Set(groupIds);
  return [ ...selected.filter((id) => !group.has(id)), ...nextIds ];
};

// 应用组合预设: 返回新的勾选集合 (按预设顺序)
export const applyPresetSelection = (preset: GitignorePreset): string[] => (
  preset.ids.filter((id) => TEMPLATE_MAP[id] !== undefined)
);

// 生成 .gitignore
export const buildGitignore = (
  selected: string[],
  customText: string,
  options: GitignoreOptions,
): GitignorePlan => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 命中的模板 (按勾选顺序或模板库顺序)
  const ids = options.sortLibraryOrder
    ? GITIGNORE_TEMPLATES.filter((t) => selected.includes(t.id)).map((t) => t.id)
    : selected.filter((id) => TEMPLATE_MAP[id] !== undefined);

  const customLines = parseCustom(customText);

  if (ids.length === 0 && customLines.length === 0) {
    errors.push('gi-empty');
  }

  // 跨模板去重 (注释行不参与去重, 否则会丢掉分组标记)
  const seen = new Set<string>();
  let duplicateCount = 0;
  const sections: GitignoreSection[] = [];

  for (const id of ids) {
    const t = TEMPLATE_MAP[id];
    const lines: string[] = [];
    for (const line of normalizeLines(t.lines.join('\n'))) {
      if (line.startsWith('#') || !options.dedupe) {
        lines.push(line);
        continue;
      }
      if (seen.has(line)) {
        duplicateCount++;
        continue;
      }
      seen.add(line);
      lines.push(line);
    }
    if (lines.length > 0) {
      sections.push({ id: t.id, label: t.label, category: t.category, lines });
    }
  }

  // 自定义追加 (始终放在最后; 同样参与去重)
  if (customLines.length > 0) {
    const lines: string[] = [];
    for (const line of customLines) {
      if (line.startsWith('#') || !options.dedupe) {
        lines.push(line);
        continue;
      }
      if (seen.has(line)) {
        duplicateCount++;
        continue;
      }
      seen.add(line);
      lines.push(line);
    }
    if (lines.length > 0) {
      sections.push({ id: 'custom', label: '自定义追加', category: 'misc', lines });
    }
  }

  // 组装文本
  const out: string[] = [];
  if (sections.length > 0 && options.header) {
    out.push('# .gitignore — 由 MagicTools「.gitignore 生成」生成');
    out.push('# 校验某文件为何被忽略: git check-ignore -v <路径>');
  }
  for (const s of sections) {
    if (out.length > 0) out.push('');
    if (options.groupComments) out.push(`# ---- ${s.label} ----`);
    out.push(...s.lines);
  }
  const content = out.length > 0 ? out.join('\n') + '\n' : '';

  const ruleCount = out.filter((l) => l !== '' && !l.startsWith('#')).length;
  const commentCount = out.filter((l) => l.startsWith('#')).length;

  if (duplicateCount > 0) warnings.push('gi-dedupe');
  if (ids.length > 0 && !selected.includes('env')) warnings.push('gi-env-tip');

  // 自定义规则顺序: 例外 (!) 出现在任何忽略规则之前时不生效
  const firstPlain = customLines.findIndex((l) => !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('\\'));
  const firstNegate = customLines.findIndex((l) => l.startsWith('!'));
  if (firstNegate !== -1 && (firstPlain === -1 || firstNegate < firstPlain)) {
    warnings.push('gi-negation-first');
  }
  if (customLines.some((l) => l.startsWith('/') && !l.startsWith('//'))) {
    warnings.push('gi-anchored');
  }

  return {
    errors,
    warnings,
    sections,
    content,
    templateCount: sections.length,
    ruleCount,
    commentCount,
    duplicateCount,
    fileName: '.gitignore',
  };
};
