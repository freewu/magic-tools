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
