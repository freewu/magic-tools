import {
  encodeMorse,
  decodeMorse,
  MORSE_CODE_TABLE,
} from './lib';

describe('摩斯码编解码', () => {
  it('SOS 编码', () => {
    expect(encodeMorse('SOS')).toBe('... --- ...');
  });

  it('SOS 解码', () => {
    expect(decodeMorse('... --- ...')).toBe('SOS');
  });

  it('hello world 编码: 单词用 / 分隔', () => {
    expect(encodeMorse('hello world')).toBe('.... . .-.. .-.. --- / .-- --- .-. .-.. -..');
  });

  it('hello world 解码', () => {
    expect(decodeMorse('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')).toBe('HELLO WORLD');
  });

  it('大小写不敏感 / 多余空格容错', () => {
    expect(decodeMorse('  ...   ---   ...  ')).toBe('SOS');
    expect(encodeMorse(' sos ')).toBe('... --- ...');
  });

  it('数字与常用标点往返', () => {
    const text = '1234567890 .,?!';
    expect(decodeMorse(encodeMorse(text))).toBe(text.toUpperCase());
  });

  it('全部字母往返', () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    expect(decodeMorse(encodeMorse(letters))).toBe(letters);
  });

  it('连续多个空格视为一个单词分隔', () => {
    expect(encodeMorse('a  b')).toBe('.- / -...');
    // 无 / 时多余空格仅作字母分隔符; / 才是单词分隔
    expect(decodeMorse('.-   -...')).toBe('AB');
    expect(decodeMorse('.- / -...')).toBe('A B');
  });

  it('含空内容与纯分隔符', () => {
    expect(encodeMorse('   ')).toBe('');
    expect(decodeMorse('')).toBe('');
  });

  it('不支持的中文字符抛出带字符的错误', () => {
    expect(() => encodeMorse('你好')).toThrow('你');
  });

  it('非法摩斯符号抛出错误', () => {
    expect(() => decodeMorse('..-..--?')).toThrow('..-..--?');
    expect(() => decodeMorse('ABC')).toThrow('ABC');
  });

  it('表中无重复码 (反向表与正表一一对应)', () => {
    const codes = Object.values(MORSE_CODE_TABLE);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

import { isMorseText, buildMorsePlaySchedule } from './lib';

describe('摩斯码播放调度 (buildMorsePlaySchedule)', () => {
  const sumEvents = (ms :number, evs :Array<{ on: boolean; ms: number }>) =>
    evs.reduce((a, e) => a + e.ms, 0);

  it('isMorseText 判定可播放文本', () => {
    expect(isMorseText('... --- ...')).toBe(true);
    expect(isMorseText('... / ---')).toBe(true);
    expect(isMorseText('abc')).toBe(false);
    expect(isMorseText('...---')).toBe(true); // 连续无空格也可播放 (视为超长码值)
    expect(isMorseText('/')).toBe(false);
    expect(isMorseText('')).toBe(false);
  });

  it('SOS: 码值起始时间与总时长符合 1/3/3/3 节奏', () => {
    const s = buildMorsePlaySchedule('... --- ...', 120);
    expect(s.tokens.map((t) => t.text)).toEqual(['...', '---', '...']);
    expect(s.tokens.every((t) => !t.word && t.sym >= 0)).toBe(true);
    // 第一段 600ms, 字母间隔 360ms → 第二段起始 960ms; 第三段起始 2640ms
    expect(s.startMs).toEqual([0, 960, 2640]);
    // '...'=600 + '---'=1320 + '...'=600, 字母间隔 360+360
    expect(s.totalMs).toBe(3240);
    expect(sumEvents(s.totalMs, s.events)).toBe(3240);
  });

  it('单词分隔 / 拉长间隔为 7 个单位', () => {
    const s = buildMorsePlaySchedule('... / ---', 120);
    expect(s.tokens.map((t) => t.text)).toEqual(['...', '/', '---']);
    expect(s.tokens[1].word).toBe(true);
    expect(s.tokens[1].sym).toBe(-1);
    // '...' 600ms + 单词间隔 840ms → '---' 起始 1440ms
    expect(s.startMs).toEqual([0, 1440]);
  });

  it('单个码值时长: 点 1 单位 / 划 3 单位 / 符号内间隔 1 单位', () => {
    const s = buildMorsePlaySchedule('-.', 100);
    expect(s.tokens.map((t) => t.text)).toEqual(['-.']);
    expect(s.events).toEqual([
      { on: true, ms: 300 },
      { on: false, ms: 100 },
      { on: true, ms: 100 },
    ]);
    expect(s.totalMs).toBe(500);
  });

  it('音高与总时长随 dotMs 线性变化', () => {
    expect(buildMorsePlaySchedule('... --- ...', 300).totalMs).toBe(8100);
    expect(buildMorsePlaySchedule('... --- ...', 80).totalMs).toBe(2160);
  });

  it('空内容无事件无码值', () => {
    const s = buildMorsePlaySchedule('   ', 120);
    expect(s.tokens).toEqual([]);
    expect(s.events).toEqual([]);
    expect(s.totalMs).toBe(0);
    expect(s.startMs).toEqual([]);
  });
});
