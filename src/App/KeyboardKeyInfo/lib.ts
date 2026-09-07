// 键盘按键信息的纯函数部分 (可单测; DOM 事件在组件中处理)

// 按键物理位置 -> 中文名 (KeyboardEvent.location)
export const LOCATION_NAMES = ['标准', '左', '右', '小键盘', '移动端', '游戏手柄'] as const;
export const locationNameOf = (location :number) :string => LOCATION_NAMES[location] ?? '标准';

// 按键展示名: 空格等特殊键美化, 其余原样
export const keyLabel = (key :string) :string => {
  if(key === ' ') return 'Space (空格)';
  if(key === '') return '(无字符)';
  return key;
};

export type KeyMods = { ctrl :boolean; shift :boolean; alt :boolean; meta :boolean };

// 修饰键组合文本, 如 "Ctrl+Shift"; 无修饰返回 "-"
export const modsText = (m :KeyMods) :string => {
  const list :string[] = [];
  if(m.ctrl) list.push('Ctrl');
  if(m.shift) list.push('Shift');
  if(m.alt) list.push('Alt');
  if(m.meta) list.push('Meta');
  return list.length > 0 ? list.join('+') : '-';
};

const pad2 = (n :number) :string => (n < 10 ? '0' : '') + String(n);

// 毫秒时长 -> 可读文本 (1000ms 内用 ms, 否则 s 保留 2 位)
export const formatDuration = (ms :number) :string => {
  if(ms < 0) return '';
  if(ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

// 时间戳 -> HH:MM:SS (本地时区)
export const clockText = (ts :number) :string => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

// 键盘事件的数据提取 (独立于真实 DOM, 便于测试)
export type KeyEventLike = {
  key :string;
  code :string;
  keyCode :number;
  location :number;
  ctrlKey :boolean;
  shiftKey :boolean;
  altKey :boolean;
  metaKey :boolean;
  repeat :boolean;
};

export type KeySummary = {
  key :string;
  keyLabelText :string;
  code :string;
  keyCode :number;
  locationName :string;
  mods :string;
  repeat :number;
};

export const summarizeKey = (e :KeyEventLike) :KeySummary => ({
  key: e.key,
  keyLabelText: keyLabel(e.key),
  code: e.code || '(无 code)',
  keyCode: e.keyCode,
  locationName: locationNameOf(e.location),
  mods: modsText({ ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey }),
  repeat: e.repeat ? 1 : 0,
});
