// 正则表达式工具: 常用正则预设 (可在 设置-其它 中增删改) 与按行匹配辅助
export interface RegexPreset {
  id: number;
  name: string;    // 名称
  pattern: string; // 正则表达式
  flags: string;   // 标志位, 如 gim
}

const STORAGE_KEY = 'regex-presets';

// 内置默认常用正则 (id 从 1 开始; 用户新增使用时间戳)
export const DEFAULT_REGEX_PRESETS :RegexPreset[] = [
  { id: 1, name: '邮箱',           pattern: '^[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$', flags: '' },
  { id: 2, name: 'URL',            pattern: '^(https?://)?([\\w-]+\\.)+[\\w-]+(/[\\w\\-./?%&=]*)?$', flags: '' },
  { id: 3, name: 'IPv4',           pattern: '^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$', flags: '' },
  { id: 4, name: '手机号',         pattern: '^1[3-9]\\d{9}$', flags: '' },
  { id: 5, name: '身份证号',       pattern: '^\\d{17}[\\dXx]$', flags: '' },
  { id: 6, name: '日期 yyyy-mm-dd', pattern: '^\\d{4}-\\d{2}-\\d{2}$', flags: '' },
  { id: 7, name: '时间 HH:mm',     pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', flags: '' },
  { id: 8, name: '中文',           pattern: '^[\\u4e00-\\u9fa5]+$', flags: '' },
  { id: 9, name: '英文字母',       pattern: '^[A-Za-z]+$', flags: '' },
  { id: 10, name: '数字',          pattern: '^\\d+$', flags: '' },
  { id: 11, name: '金额(≤2位小数)', pattern: '^\\d+(\\.\\d{1,2})?$', flags: '' },
  { id: 12, name: '空白行',        pattern: '^\\s*$', flags: '' },
];

const cloneDefaults = () :RegexPreset[] => DEFAULT_REGEX_PRESETS.map((p) => ({ ...p }));

// 读取预设列表 (损坏/不存在时回退默认)
export const listRegexPresets = () :RegexPreset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return cloneDefaults();
    const valid = arr.filter((p) =>
      p && typeof p === 'object' && typeof p.id === 'number' && typeof p.name === 'string' && typeof p.pattern === 'string' && typeof p.flags === 'string'
    );
    return valid.length > 0 ? valid : cloneDefaults();
  } catch (e) {
    console.error('read regex presets failed:', e);
    return cloneDefaults();
  }
};

// 保存预设列表
export const saveRegexPresets = (list :RegexPreset[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

// 恢复默认预设
export const resetRegexPresets = () :RegexPreset[] => {
  saveRegexPresets(cloneDefaults());
  return cloneDefaults();
};

export const newPresetId = () :number => Date.now();

// 尝试编译正则, 失败返回 null
export const compileRegex = (pattern :string, flags :string) :RegExp | null => {
  if (!pattern) return null;
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    return null;
  }
};

/**
 * 单行匹配判定
 * @returns true=匹配 / false=不匹配 / null=正则无效或为空
 */
export const lineMatches = (re :RegExp | null, line :string) :boolean | null => {
  if (!re) return null;
  re.lastIndex = 0;
  return re.test(line);
};

/**
 * 全文匹配次数统计 (自动追加 g 标志)
 */
export const matchAllCount = (re :RegExp | null, text :string) :number => {
  if (!re || text === '') return 0;
  const gRe = re.flags.includes('g') ? re : new RegExp(re.source, re.flags + 'g');
  gRe.lastIndex = 0;
  let count = 0;
  while (gRe.exec(text) !== null) {
    count++;
    if (count > 100000) break; // 防呆
  }
  return count;
};
