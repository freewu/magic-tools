import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, getDefaultJPType, setDefaultJPType, toSquareMeter, fromSquareMeter } from './lib';
import { typeList } from './data';
import { BigNumber } from '../../lib/bignumber';

describe('AreaConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤, 未知制式返回空', () => {
    const ms = getTypeList('ms');
    expect(ms.length).toBeGreaterThan(0);
    expect(ms.every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('iu').every((v) => v.type === 'iu')).toBe(true);
    expect(getTypeList('xx')).toEqual([]);
  });

  test('getTypePlaceholder 命中返回提示文字, 未命中返回 undefined', () => {
    expect(getTypePlaceholder('m2')).toBe(typeList.find((v) => v.value === 'm2')?.placeholder);
    expect(getTypePlaceholder('km2')).toBeDefined();
    expect(getTypePlaceholder('not-exist')).toBeUndefined();
  });

  test('getDefaultType 按制式返回对应默认单位, 未知制式回退公制', () => {
    expect(getDefaultType('ms')).toBe(getDefaultMSType());
    expect(getDefaultType('iu')).toBe(getDefaultIUType());
    expect(getDefaultType('cn')).toBe(getDefaultCNType());
    expect(getDefaultType('jp')).toBe(getDefaultJPType());
    expect(getDefaultType('xx')).toBe(getDefaultMSType());
  });

  test('默认制式与各制式默认单位可持久化, 无存储时回退内置默认', () => {
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('iu');
    expect(getDefaultUnitType()).toBe('iu');

    expect(getDefaultMSType()).toBe('m2');
    expect(getDefaultIUType()).not.toBe('');
    expect(getDefaultCNType()).toBeDefined();
    expect(getDefaultJPType()).toBeDefined();

    setDefaultMSType('km2');
    expect(getDefaultMSType()).toBe('km2');
  });

  test('toSquareMeter / fromSquareMeter 使用 BigNumber 精确换算', () => {
    expect(toSquareMeter(new BigNumber(1), 'km2').toFixed()).toBe('1000000');
    expect(toSquareMeter(new BigNumber(1), 'gq').toFixed()).toBe('10000');
    expect(toSquareMeter(new BigNumber(1), 'cm2').toFixed()).toBe('0.0001');
    expect(toSquareMeter(new BigNumber(1), 'ym').toFixed()).toBe('4046.85642');
    expect(toSquareMeter(new BigNumber(1), 'foot2').toFixed()).toBe('0.09290304');
    expect(toSquareMeter(new BigNumber(1), 'jp-ping').toFixed()).toBe('3.30578622');
    expect(toSquareMeter(new BigNumber(1), 'mu').toFixed()).toBe('666.66');
    expect(toSquareMeter(new BigNumber(1), 'cun2').toFixed()).toBe('0.001111');
    expect(fromSquareMeter(new BigNumber('4046.85642'), 'ym').toFixed()).toBe('1');
  });

  test('toSquareMeter 与 fromSquareMeter 互逆 (含小数)', () => {
    const m2 = toSquareMeter(new BigNumber('120.5'), 'mu');
    expect(fromSquareMeter(m2, 'mu').toFixed()).toBe('120.5');
    const ping = toSquareMeter(new BigNumber('30'), 'jp-ping');
    expect(fromSquareMeter(ping, 'jp-ping').toFixed()).toBe('30');
  });

  test('日式默认单位独立持久化 (曾误用市制 key)', () => {
    expect(getDefaultJPType()).toBe('jp-ping');
    setDefaultJPType('jp-die');
    expect(getDefaultJPType()).toBe('jp-die');
    // 不应影响市制默认单位
    expect(getDefaultCNType()).toBe('mu');
  });
});
