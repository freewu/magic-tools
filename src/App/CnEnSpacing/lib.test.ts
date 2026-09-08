import { spaceCnEn } from './lib';

describe('中英文自动排版', () => {
  test('中文与英文之间插入空格', () => {
    expect(spaceCnEn('使用HTML')).toBe('使用 HTML');
    expect(spaceCnEn('hello世界')).toBe('hello 世界');
  });
  test('中文与数字之间插入空格', () => {
    expect(spaceCnEn('共100个')).toBe('共 100 个');
    expect(spaceCnEn('版本2.0发布')).toBe('版本 2.0 发布');
  });
  test('双向插入', () => {
    expect(spaceCnEn('Python3.12与Node.js')).toBe('Python3.12 与 Node.js');
    expect(spaceCnEn('中a中')).toBe('中 a 中');
  });
  test('已存在的空格不重复添加', () => {
    expect(spaceCnEn('使用 HTML5')).toBe('使用 HTML5');
    expect(spaceCnEn('使用  HTML5')).toBe('使用  HTML5'); // 多空格原样保留
  });
  test('标点、换行、段落不被修改', () => {
    expect(spaceCnEn('你好，world。')).toBe('你好，world。');
    expect(spaceCnEn('第一行中文abc\n第二行123中文')).toBe('第一行中文 abc\n第二行 123 中文');
  });
  test('纯中文/纯英文/空输入不变', () => {
    expect(spaceCnEn('纯中文文本')).toBe('纯中文文本');
    expect(spaceCnEn('pure english 123')).toBe('pure english 123');
    expect(spaceCnEn('')).toBe('');
  });
  test('中文标点不算英文侧边界', () => {
    expect(spaceCnEn('（abc）中文')).toBe('（abc）中文');
  });
  test('全角字母数字也参与排版', () => {
    expect(spaceCnEn('中文ＡＢＣ')).toBe('中文 ＡＢＣ');
    expect(spaceCnEn('１２３中文')).toBe('１２３ 中文');
  });
});
