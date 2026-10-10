import { hasChinese, toRubyItems } from './lib';

describe('PinyinConvert lib (注音排版数据)', () => {
  test('toRubyItems: 汉字带拼音, 非汉字原样保留', () => {
    const items = toRubyItems('你好，世界!');
    expect(items.map((i) => i.text)).toEqual(['你', '好', '，', '世', '界', '!']);
    expect(items.filter((i) => i.isZh).map((i) => i.pinyin)).toEqual(['nǐ', 'hǎo', 'shì', 'jiè']);
    // 非汉字项没有拼音
    expect(items.filter((i) => !i.isZh).map((i) => i.text)).toEqual(['，', '!']);
    expect(items.filter((i) => !i.isZh).every((i) => i.pinyin === '')).toBe(true);
  });

  test('toRubyItems: 各项拼接后与原文完全一致 (含换行/空格/英文/数字)', () => {
    for (const text of ['你好\nabc 123 世界!', '  前后空格  ', 'pīn yīn 拼音', '123456', '']) {
      expect(toRubyItems(text).map((i) => i.text).join('')).toBe(text);
    }
  });

  test('toRubyItems: 连续非汉字保持成段, 不会在英文单词中间断开', () => {
    const items = toRubyItems('中文abc测试');
    expect(items.filter((i) => !i.isZh).map((i) => i.text)).toEqual(['abc']);
  });

  test('toRubyItems: 结合上下文判定多音字 (第二行 -> háng)', () => {
    const items = toRubyItems('第二行');
    expect(items.map((i) => i.text)).toEqual(['第', '二', '行']);
    expect(items[2].pinyin).toBe('háng');
  });

  test('hasChinese 判断注音里是否含汉字', () => {
    expect(hasChinese(toRubyItems(''))).toBe(false);
    expect(hasChinese(toRubyItems('hello 123'))).toBe(false);
    expect(hasChinese(toRubyItems('hello 中文'))).toBe(true);
  });
});
