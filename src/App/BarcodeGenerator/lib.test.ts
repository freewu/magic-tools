import { validateBarcode } from './lib';

describe('BarcodeGenerator 输入校验', () => {

  // CODE128
  test('CODE128: 可打印 ASCII 通过, 中文报错', () => {
    expect(validateBarcode('CODE128', 'ABC-123 abc')).toBe('');
    expect(validateBarcode('CODE128', '中文')).not.toBe('');
  });

  // CODE128 A/B/C
  test('CODE128 A: 大写/数字/符号通过, 小写报错', () => {
    expect(validateBarcode('CODE128A', 'ABC123-._ ')).toBe('');
    expect(validateBarcode('CODE128A', 'abc')).not.toBe('');
  });

  test('CODE128 B: 含小写通过', () => {
    expect(validateBarcode('CODE128B', 'Abc-123')).toBe('');
    expect(validateBarcode('CODE128B', '中文')).not.toBe('');
  });

  test('CODE128 C: 偶数位数字通过, 奇数位/含字母报错', () => {
    expect(validateBarcode('CODE128C', '123456')).toBe('');
    expect(validateBarcode('CODE128C', '12345')).not.toBe('');
    expect(validateBarcode('CODE128C', '1234A')).not.toBe('');
  });

  // EAN-13 / EAN-8 / UPC-A
  test('EAN-13: 12/13 位通过, 校验位错误报错', () => {
    expect(validateBarcode('EAN13', '690123456789')).toBe('');
    expect(validateBarcode('EAN13', '6901234567892')).toBe('');
    expect(validateBarcode('EAN13', '6901234567891')).not.toBe('');
    expect(validateBarcode('EAN13', '69012345678')).not.toBe('');
  });

  test('EAN-8: 7/8 位通过', () => {
    expect(validateBarcode('EAN8', '9638507')).toBe('');
    expect(validateBarcode('EAN8', '96385074')).toBe('');
    expect(validateBarcode('EAN8', '9638507A')).not.toBe('');
  });

  test('UPC-A: 11/12 位通过, 校验位错误报错', () => {
    expect(validateBarcode('UPC', '03600029145')).toBe('');
    expect(validateBarcode('UPC', '036000291452')).toBe('');
    expect(validateBarcode('UPC', '036000291453')).not.toBe('');
    expect(validateBarcode('UPC', '0360002914')).not.toBe('');
  });

  // CODE39
  test('CODE39: 合法字符通过, 小写/星号报错', () => {
    expect(validateBarcode('CODE39', 'CODE-39 $/+%')).toBe('');
    expect(validateBarcode('CODE39', 'code39')).not.toBe('');
    expect(validateBarcode('CODE39', '*CODE39*')).not.toBe('');
  });

  // ITF-14 / ITF
  test('ITF-14: 13/14 位通过', () => {
    expect(validateBarcode('ITF14', '1540014128876')).toBe('');
    expect(validateBarcode('ITF14', '15400141288763')).toBe('');
    expect(validateBarcode('ITF14', '154001412887')).not.toBe('');
  });

  test('ITF: 偶数位数字通过, 奇数位报错', () => {
    expect(validateBarcode('ITF', '123456')).toBe('');
    expect(validateBarcode('ITF', '12345')).not.toBe('');
  });

  // MSI 系列
  test('MSI 系列: 数字通过, 字母报错', () => {
    ['MSI', 'MSI10', 'MSI11', 'MSI1010', 'MSI1110'].forEach((f) => {
      expect(validateBarcode(f, '1234567')).toBe('');
      expect(validateBarcode(f, '1234A')).not.toBe('');
    });
  });

  // Pharmacode
  test('Pharmacode: 3-131070 通过, 越界报错', () => {
    expect(validateBarcode('pharmacode', '3')).toBe('');
    expect(validateBarcode('pharmacode', '131070')).toBe('');
    expect(validateBarcode('pharmacode', '2')).not.toBe('');
    expect(validateBarcode('pharmacode', '131071')).not.toBe('');
    expect(validateBarcode('pharmacode', 'abc')).not.toBe('');
  });

  test('空内容不报错 (由 UI 控制不渲染)', () => {
    expect(validateBarcode('EAN13', '')).toBe('');
  });
});
