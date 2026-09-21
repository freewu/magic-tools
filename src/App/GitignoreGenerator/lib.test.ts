// .gitignore 生成 - 单元测试
import {
  GITIGNORE_CATEGORIES,
  GITIGNORE_PRESETS,
  GITIGNORE_TEMPLATES,
  MAX_INLINE_OPTIONS,
  allTemplateIds,
  applyPresetSelection,
  buildGitignore,
  countHiddenSelected,
  emptyGitignoreOptions,
  mergeGroupSelection,
  normalizeLines,
  parseCustom,
  searchTemplates,
  toggleTemplate,
} from './lib';

const HEADER = '# .gitignore — 由 MagicTools「.gitignore 生成」生成\n# 校验某文件为何被忽略: git check-ignore -v <路径>\n';
const opts = (patch: Partial<ReturnType<typeof emptyGitignoreOptions>> = {}) => ({ ...emptyGitignoreOptions(), ...patch });

describe('模板库完整性', () => {
  it('模板 id 唯一', () => {
    const ids = allTemplateIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('模板数量 = 各分类数量之和', () => {
    const byCategory = GITIGNORE_CATEGORIES.reduce((sum, c) => sum + GITIGNORE_TEMPLATES.filter((t) => t.category === c.key).length, 0);
    expect(byCategory).toBe(GITIGNORE_TEMPLATES.length);
    expect(GITIGNORE_TEMPLATES.length).toBeGreaterThanOrEqual(60);
  });
  it('每个模板的分类都在分类表中', () => {
    const keys = GITIGNORE_CATEGORIES.map((c) => c.key);
    for (const t of GITIGNORE_TEMPLATES) expect(keys).toContain(t.category);
  });
  it('每个模板都有名称 / 关键词 / 规则行', () => {
    for (const t of GITIGNORE_TEMPLATES) {
      expect(t.label).not.toBe('');
      expect(t.tags.length).toBeGreaterThan(0);
      expect(t.lines.length).toBeGreaterThan(0);
    }
  });
  it('模板行去掉首尾空白后无空行', () => {
    for (const t of GITIGNORE_TEMPLATES) {
      for (const line of t.lines) {
        expect(line).toBe(line.trim());
        expect(line).not.toBe('');
      }
    }
  });
  it('模板内规则不重复', () => {
    for (const t of GITIGNORE_TEMPLATES) {
      const rules = t.lines.filter((l) => !l.startsWith('#'));
      expect(new Set(rules).size).toBe(rules.length);
    }
  });
  it('组合预设引用的模板 id 都存在', () => {
    const ids = new Set(allTemplateIds());
    for (const p of GITIGNORE_PRESETS) {
      expect(p.ids.length).toBeGreaterThan(0);
      for (const id of p.ids) expect(ids.has(id)).toBe(true);
    }
  });
  it('包含常用生态模板', () => {
    const ids = allTemplateIds();
    for (const id of [ 'node', 'python', 'java', 'go', 'rust', 'vite', 'jetbrains', 'macos', 'windows', 'env' ]) {
      expect(ids).toContain(id);
    }
  });
});

describe('normalizeLines', () => {
  it('去掉 CR / 首尾空白 / 空行', () => {
    expect(normalizeLines('  a  \r\n\r\n\tb\t\n\n')).toEqual([ 'a', 'b' ]);
  });
  it('保留注释行', () => {
    expect(normalizeLines('# 注释\n*.log')).toEqual([ '# 注释', '*.log' ]);
  });
});

describe('parseCustom', () => {
  it('逐行解析并去掉行内重复', () => {
    expect(parseCustom('*.log\n*.log\n# x\n*.log')).toEqual([ '*.log', '# x' ]);
  });
  it('空文本返回空数组', () => {
    expect(parseCustom('  \n\n')).toEqual([]);
  });
});

describe('searchTemplates', () => {
  it('空关键词返回全部模板', () => {
    expect(searchTemplates('').length).toBe(GITIGNORE_TEMPLATES.length);
  });
  it('按 id 命中 (大小写不敏感)', () => {
    expect(searchTemplates('GO').map((t) => t.id)).toEqual(searchTemplates('go').map((t) => t.id));
    expect(searchTemplates('typescript').map((t) => t.id)).toEqual([ 'typescript' ]);
  });
  it('按名称命中', () => {
    expect(searchTemplates('Laravel').map((t) => t.id)).toEqual([ 'laravel' ]);
  });
  it('按关键词命中多个模板', () => {
    const ids = searchTemplates('python').map((t) => t.id);
    expect(ids).toContain('python');
    expect(ids).toContain('django');
    expect(ids).toContain('virtualenv');
  });
  it('无命中返回空数组', () => {
    expect(searchTemplates('不存在的模板')).toEqual([]);
  });
});

describe('勾选辅助', () => {
  it('toggleTemplate 追加 / 移除并保持顺序', () => {
    expect(toggleTemplate([], 'node')).toEqual([ 'node' ]);
    expect(toggleTemplate([ 'node' ], 'go')).toEqual([ 'node', 'go' ]);
    expect(toggleTemplate([ 'node', 'go' ], 'node')).toEqual([ 'go' ]);
  });
  it('applyPresetSelection 过滤未知 id', () => {
    expect(applyPresetSelection({ id: 'x', name: 'x', ids: [ 'node', 'not-exist' ] })).toEqual([ 'node' ]);
  });
  it('countHiddenSelected 统计被搜索隐藏的已选模板', () => {
    expect(countHiddenSelected([ 'node', 'go' ], searchTemplates('node'))).toBe(1);
    expect(countHiddenSelected([ 'node' ], searchTemplates(''))).toBe(0);
  });
  it('mergeGroupSelection 只替换该分类的勾选, 其它分类与顺序不变', () => {
    const langIds = GITIGNORE_TEMPLATES.filter((t) => t.category === 'lang').map((t) => t.id);
    // 替换语言分类: 保留 misc 的 cache, 新选项追加到末尾
    expect(mergeGroupSelection([ 'cache', 'node' ], langIds, [ 'go', 'rust' ])).toEqual([ 'cache', 'go', 'rust' ]);
    // 分组内全部取消
    expect(mergeGroupSelection([ 'cache', 'node' ], langIds, [])).toEqual([ 'cache' ]);
    // 替换语言分类不影响其它分类的已选项
    expect(mergeGroupSelection([ 'cache', 'go', 'logs' ], langIds, [ 'rust' ])).toEqual([ 'cache', 'logs', 'rust' ]);
  });
  it('分类选项数超过阈值时改用下拉多选 (语言/框架/编辑器/其它为多选, 操作系统为复选框)', () => {
    const sizes = GITIGNORE_CATEGORIES.map((c) => ({
      key: c.key,
      size: GITIGNORE_TEMPLATES.filter((t) => t.category === c.key).length,
    }));
    const many = sizes.filter((s) => s.size > MAX_INLINE_OPTIONS).map((s) => s.key);
    const few = sizes.filter((s) => s.size <= MAX_INLINE_OPTIONS).map((s) => s.key);
    expect(MAX_INLINE_OPTIONS).toBe(5);
    expect(many).toEqual([ 'lang', 'framework', 'editor', 'misc' ]);
    expect(few).toEqual([ 'os' ]);
  });
});

describe('buildGitignore 基本组装', () => {
  it('未选模板且无自定义内容: 报错且内容为空', () => {
    const plan = buildGitignore([], '', emptyGitignoreOptions());
    expect(plan.errors).toEqual([ 'gi-empty' ]);
    expect(plan.content).toBe('');
    expect(plan.templateCount).toBe(0);
    expect(plan.commentCount).toBe(0);
    expect(plan.ruleCount).toBe(0);
    expect(plan.fileName).toBe('.gitignore');
  });
  it('单个模板: 顶部注释 + 分组注释 + 规则', () => {
    const plan = buildGitignore([ 'typescript' ], '', emptyGitignoreOptions());
    expect(plan.content).toBe(`${HEADER}\n# ---- TypeScript ----\n*.tsbuildinfo\n.tsbuildinfo\n`);
    expect(plan.errors).toEqual([]);
    expect(plan.ruleCount).toBe(2);
    expect(plan.commentCount).toBe(3);
    expect(plan.templateCount).toBe(1);
  });
  it('内容以换行结尾', () => {
    expect(buildGitignore([ 'node' ], '', emptyGitignoreOptions()).content.endsWith('\n')).toBe(true);
  });
  it('关闭顶部注释后不输出头部说明', () => {
    const plan = buildGitignore([ 'typescript' ], '', opts({ header: false }));
    expect(plan.content.startsWith('# ---- TypeScript ----')).toBe(true);
    expect(plan.content.includes('MagicTools')).toBe(false);
  });
  it('关闭分组注释后不输出分组标记', () => {
    const plan = buildGitignore([ 'typescript' ], '', opts({ header: false, groupComments: false }));
    expect(plan.content).toBe('*.tsbuildinfo\n.tsbuildinfo\n');
  });
  it('只选自定义规则也能生成', () => {
    const plan = buildGitignore([], '*.log\n/dist/', emptyGitignoreOptions());
    expect(plan.errors).toEqual([]);
    expect(plan.content).toBe(`${HEADER}\n# ---- 自定义追加 ----\n*.log\n/dist/\n`);
    expect(plan.warnings).toContain('gi-anchored');
  });
  it('自定义内容为空行时视为未填写', () => {
    expect(buildGitignore([], '\n  \n', emptyGitignoreOptions()).errors).toEqual([ 'gi-empty' ]);
  });
});

describe('buildGitignore 去重与排序', () => {
  it('跨模板去重 (默认开启)', () => {
    const plan = buildGitignore([ 'node', 'cache' ], '', emptyGitignoreOptions());
    const distCount = plan.content.split('\n').filter((l) => l === 'dist/').length;
    expect(distCount).toBe(1);
    expect(plan.duplicateCount).toBeGreaterThan(0);
    expect(plan.warnings).toContain('gi-dedupe');
  });
  it('关闭去重后保留重复行', () => {
    const plan = buildGitignore([ 'node', 'cache' ], '', opts({ dedupe: false }));
    const distCount = plan.content.split('\n').filter((l) => l === 'dist/').length;
    expect(distCount).toBe(2);
    expect(plan.duplicateCount).toBe(0);
    expect(plan.warnings).not.toContain('gi-dedupe');
  });
  it('注释行不参与去重 (不同模板的同名注释都保留)', () => {
    const plan = buildGitignore([ 'go', 'rust' ], '', emptyGitignoreOptions());
    expect(plan.content.split('\n').filter((l) => l === '# 编译产物').length).toBe(2);
    expect(plan.sections.map((s) => s.id)).toEqual([ 'go', 'rust' ]);
  });
  it('自定义规则与模板重复时被去重', () => {
    const plan = buildGitignore([ 'typescript' ], '*.tsbuildinfo', emptyGitignoreOptions());
    expect(plan.content.split('\n').filter((l) => l === '*.tsbuildinfo').length).toBe(1);
    expect(plan.duplicateCount).toBe(1);
  });
  it('默认按模板库顺序输出', () => {
    const plan = buildGitignore([ 'vite', 'node' ], '', emptyGitignoreOptions());
    expect(plan.content.indexOf('# ---- Node.js ----')).toBeLessThan(plan.content.indexOf('# ---- Vite / React / Vue ----'));
  });
  it('关闭库顺序后按勾选顺序输出', () => {
    const plan = buildGitignore([ 'vite', 'node' ], '', opts({ sortLibraryOrder: false }));
    expect(plan.content.indexOf('# ---- Vite / React / Vue ----')).toBeLessThan(plan.content.indexOf('# ---- Node.js ----'));
  });
});

describe('buildGitignore 警告', () => {
  it('未选「环境变量 / 密钥」时提示', () => {
    expect(buildGitignore([ 'node' ], '', emptyGitignoreOptions()).warnings).toContain('gi-env-tip');
  });
  it('选了「环境变量 / 密钥」后不再提示', () => {
    expect(buildGitignore([ 'node', 'env' ], '', emptyGitignoreOptions()).warnings).not.toContain('gi-env-tip');
  });
  it('例外规则出现在忽略规则前时提示', () => {
    expect(buildGitignore([], '!keep.txt', emptyGitignoreOptions()).warnings).toContain('gi-negation-first');
  });
  it('例外规则紧跟忽略规则时不提示', () => {
    expect(buildGitignore([], 'keep/*\n!keep/README.md', emptyGitignoreOptions()).warnings).not.toContain('gi-negation-first');
  });
  it('自定义规则以 / 开头时提示', () => {
    expect(buildGitignore([], '/build/', emptyGitignoreOptions()).warnings).toContain('gi-anchored');
    expect(buildGitignore([], 'build/', emptyGitignoreOptions()).warnings).not.toContain('gi-anchored');
  });
  it('无问题时没有问题码', () => {
    const plan = buildGitignore([ 'typescript', 'env' ], '', emptyGitignoreOptions());
    expect(plan.warnings).toEqual([]);
  });
});

describe('buildGitignore 统计', () => {
  it('规则数与注释数分别统计 (空行不计入规则)', () => {
    const plan = buildGitignore([ 'typescript', 'macos' ], '', emptyGitignoreOptions());
    const rules = (id: string) => (GITIGNORE_TEMPLATES.find((t) => t.id === id)?.lines ?? []).filter((l) => !l.startsWith('#')).length;
    expect(plan.templateCount).toBe(2);
    expect(plan.ruleCount).toBe(rules('typescript') + rules('macos'));
    expect(plan.commentCount).toBe(2 + 2); // 顶部说明 2 行 + 2 个分组注释
  });
  it('自定义追加算作一个分组', () => {
    const plan = buildGitignore([ 'typescript' ], '*.log', emptyGitignoreOptions());
    expect(plan.templateCount).toBe(2);
    expect(plan.sections.map((s) => s.id)).toEqual([ 'typescript', 'custom' ]);
  });
  it('sections 保留分类信息', () => {
    const plan = buildGitignore([ 'node', 'vscode' ], '', emptyGitignoreOptions());
    expect(plan.sections.map((s) => s.category)).toEqual([ 'lang', 'editor' ]);
  });
});
