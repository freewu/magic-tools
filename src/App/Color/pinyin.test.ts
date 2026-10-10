import { containsChinese, getCharPinyin, loadPinyin } from './pinyin';

describe('Color 拼音注音', () => {
  test('containsChinese: 判断名称是否包含汉字', () => {
    expect(containsChinese('粉红')).toBe(true);
    expect(containsChinese('海棠红')).toBe(true);
    // 拼豆色号 + 中文名
    expect(containsChinese('MB12 深森林绿')).toBe(true);
    // 纯英文/色号/空 不需要注音
    expect(containsChinese('P01 White')).toBe(false);
    expect(containsChinese('#FF0000')).toBe(false);
    expect(containsChinese('')).toBe(false);
  });

  test('未加载 pinyin-pro 时不注音 (懒加载前不报错)', () => {
    expect(getCharPinyin('粉')).toBe('');
    expect(getCharPinyin('A')).toBe('');
  });

  test('loadPinyin: 加载后可取单字带声调拼音, 非汉字不注音', async () => {
    expect(await loadPinyin()).toBe(true);

    expect(getCharPinyin('粉')).toBe('fěn');
    expect(getCharPinyin('红')).toBe('hóng');
    expect(getCharPinyin('深')).toBe('shēn');
    expect(getCharPinyin('绿')).toBe('lǜ');

    // 非汉字 (英文色号 / 数字 / 空格) 不注音
    expect(getCharPinyin('A')).toBe('');
    expect(getCharPinyin('1')).toBe('');
    expect(getCharPinyin(' ')).toBe('');
    // 日文假名 (日式配色 名称) 不注音
    expect(getCharPinyin('と')).toBe('');

    // 重复取字命中缓存, 结果一致
    expect(getCharPinyin('粉')).toBe('fěn');
  });

  test('loadPinyin: 重复调用幂等', async () => {
    expect(await loadPinyin()).toBe(true);
    expect(getCharPinyin('色')).toBe('sè');
  });
});
