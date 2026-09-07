import { summarizeKey, keyLabel, locationNameOf, modsText, formatDuration, clockText } from './lib';
import type { KeyEventLike } from './lib';

const ev = (p :Partial<KeyEventLike>) :KeyEventLike => ({
  key: 'a', code: 'KeyA', keyCode: 65, location: 0,
  ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, repeat: false,
  ...p,
});

describe('locationNameOf 物理位置', () => {
  it('DOM location 枚举', () => {
    expect(locationNameOf(0)).toBe('标准');
    expect(locationNameOf(1)).toBe('左');
    expect(locationNameOf(2)).toBe('右');
    expect(locationNameOf(3)).toBe('小键盘');
    expect(locationNameOf(99)).toBe('标准');
  });
});

describe('keyLabel 展示名', () => {
  it('空格与无字符键美化', () => {
    expect(keyLabel(' ')).toBe('Space (空格)');
    expect(keyLabel('')).toBe('(无字符)');
    expect(keyLabel('Enter')).toBe('Enter');
    expect(keyLabel('a')).toBe('a');
  });
});

describe('modsText 修饰键组合', () => {
  it('多修饰排序组合', () => {
    expect(modsText({ ctrl: true, shift: true, alt: true, meta: true })).toBe('Ctrl+Shift+Alt+Meta');
    expect(modsText({ ctrl: true, shift: false, alt: false, meta: false })).toBe('Ctrl');
    expect(modsText({ ctrl: false, shift: false, alt: false, meta: false })).toBe('-');
  });
});

describe('formatDuration 时长', () => {
  it('ms/s 分界', () => {
    expect(formatDuration(0)).toBe('0 ms');
    expect(formatDuration(999)).toBe('999 ms');
    expect(formatDuration(1000)).toBe('1.00 s');
    expect(formatDuration(1530)).toBe('1.53 s');
    expect(formatDuration(-1)).toBe('');
  });
});

describe('clockText 时间', () => {
  it('补零格式化', () => {
    expect(clockText(new Date(2026, 0, 1, 9, 5, 3).getTime())).toBe('09:05:03');
    expect(clockText(new Date(2026, 0, 1, 23, 59, 59).getTime())).toBe('23:59:59');
  });
});

describe('summarizeKey 事件摘要', () => {
  it('普通按键', () => {
    const s = summarizeKey(ev({}));
    expect(s).toEqual({
      key: 'a', keyLabelText: 'a', code: 'KeyA', keyCode: 65,
      locationName: '标准', mods: '-', repeat: 0,
    });
  });

  it('左 Shift + 数字键 (小键盘)', () => {
    const s = summarizeKey(ev({
      key: '5', code: 'Numpad5', keyCode: 101, location: 3,
      shiftKey: true, repeat: true,
    }));
    expect(s.locationName).toBe('小键盘');
    expect(s.mods).toBe('Shift');
    expect(s.repeat).toBe(1);
  });

  it('空格键 code 缺失兜底', () => {
    const s = summarizeKey(ev({ key: ' ', code: '' }));
    expect(s.keyLabelText).toBe('Space (空格)');
    expect(s.code).toBe('(无 code)');
  });
});
