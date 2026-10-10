import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, toMeter, fromMeter } from './lib';
import { BigNumber } from '../../lib/bignumber';

describe('DistanceConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤', () => {
    expect(getTypeList('ms').every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('iu').length).toBeGreaterThan(0);
    expect(getTypeList('nope')).toEqual([]);
  });

  test('getTypePlaceholder 命中/未命中', () => {
    expect(getTypePlaceholder('m')).toBeDefined();
    expect(getTypePlaceholder('km')).toBeDefined();
    expect(getTypePlaceholder('__')).toBeUndefined();
  });

  test('getDefaultType 制式分支 + 默认制式持久化', () => {
    expect(getDefaultType('xx')).toBe(getDefaultMSType());
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('cn');
    expect(getDefaultUnitType()).toBe('cn');
    setDefaultMSType('km');
    expect(getDefaultMSType()).toBe('km');
    setDefaultIUType('foot');
    expect(getDefaultIUType()).toBe('foot');
    setDefaultCNType('l'); // 常用单位存在即可
  });

  test('toMeter / fromMeter 使用 BigNumber 精确换算', () => {
    expect(toMeter(new BigNumber(1), 'km').toFixed()).toBe('1000');
    expect(toMeter(new BigNumber(1), 'cm').toFixed()).toBe('0.01');
    expect(toMeter(new BigNumber(1), 'inch').toFixed()).toBe('0.0254');
    expect(toMeter(new BigNumber(1), 'foot').toFixed()).toBe('0.3048');
    expect(toMeter(new BigNumber(1), 'nmile').toFixed()).toBe('1852');
    expect(toMeter(new BigNumber(1), 'li').toFixed()).toBe('500');
    // 市制: 1 尺 = 5/15 m, 除不尽但不报错
    expect(toMeter(new BigNumber(3), 'chi').toFixed()).toBe('1');
    expect(fromMeter(new BigNumber(1), 'chi').toFixed()).toBe('3');
  });

  test('英里系数修正为 1609.344 米且换算可逆', () => {
    // 旧实现 toBase 用 1.6093/1000, 与展示用的 /1609.3 不一致
    expect(toMeter(new BigNumber(1), 'mile').toFixed()).toBe('1609.344');
    expect(fromMeter(new BigNumber(1609.344), 'mile').toFixed()).toBe('1');
    const m = toMeter(new BigNumber('26.2'), 'mile');
    expect(fromMeter(m, 'mile').toFixed()).toBe('26.2');
  });

  test('toMeter / fromMeter 对小数无浮点误差', () => {
    // 0.1 + 0.2 类误差不应出现: 3 个 0.1 km 刚好 300 m
    const total = toMeter(new BigNumber('0.1'), 'km').plus(toMeter(new BigNumber('0.2'), 'km'));
    expect(total.toFixed()).toBe('300');
  });
});
