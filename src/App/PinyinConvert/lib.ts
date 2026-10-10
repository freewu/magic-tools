import { pinyin } from 'pinyin-pro';

// 注音排版的一项: 汉字 + 需要显示在其上方的拼音 (非汉字项是原样展示的文本片段)
export interface RubyItem {
  text: string, // 原文片段 (一个汉字 / 一段连续的非汉字内容)
  pinyin: string, // 带声调拼音 (非汉字为空串)
  isZh: boolean, // 是否汉字
}

/**
 * 把文本转成「汉字 + 拼音」序列, 用于「拼音显示在汉字上方」的注音排版
 *
 * 注意: 这里对整段文本转换, 而不是逐字转换。pinyin-pro 会结合上下文判定多音字
 * (如 第二行 -> háng, 长大 -> zhǎng), 逐字转换只能拿到单字读音, 容易读错。
 * nonZh: 'consecutive' 让连续的非汉字内容 (英文单词/数字/空白) 保持成一段,
 * 不会被拆成单字符, 排版时也不会在英文单词中间断行。
 */
export const toRubyItems = (text: string) :Array<RubyItem> => {
  if(text === "") return [];
  return pinyin(text, { type: 'all', toneType: 'symbol', nonZh: 'consecutive' }).map((item) => {
    return { text: item.origin, pinyin: item.pinyin, isZh: item.isZh };
  });
}

// 注音排版里是否含汉字 (没有汉字时不需要 ruby 排版, 只显示提示)
export const hasChinese = (items :Array<RubyItem>) :boolean => {
  return items.some((item) => item.isZh);
}
