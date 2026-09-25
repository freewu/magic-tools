import { matchQuery, normalizeQuery } from './lib';

describe('AppStore 搜索匹配', () => {
  test('关键词标准化: 去首尾空白 + 转小写', () => {
    expect(normalizeQuery('  SM4  ')).toBe('sm4');
    expect(normalizeQuery('')).toBe('');
  });

  test('空关键词命中全部', () => {
    expect(matchQuery('', [])).toBe(true);
    expect(matchQuery('   ', [ 'AES 加解密' ])).toBe(true);
  });

  test('大小写与首尾空白不敏感', () => {
    expect(matchQuery(' sm4crypto ', [ 'SM4Crypto' ])).toBe(true);
    expect(matchQuery('AES', [ 'aes 加解密' ])).toBe(true);
  });

  test('中文名与分类名均可命中', () => {
    expect(matchQuery('加解密', [ 'SM4 加解密', 'SM4Crypto', '加解密' ])).toBe(true);
    expect(matchQuery('图片', [ '二维码生成', 'QRCodeGenerator', '图片' ])).toBe(true);
  });

  test('子串命中: 部分名称 / 目录名前缀', () => {
    expect(matchQuery('经纬', [ '经纬度格式转换' ])).toBe(true);
    expect(matchQuery('latlng', [ 'LatLngConvert' ])).toBe(true);
  });

  test('未命中返回 false; 空文本数组不命中', () => {
    expect(matchQuery('不存在的应用', [ 'DNS 查询', 'DnsQuery' ])).toBe(false);
    expect(matchQuery('aes', [])).toBe(false);
    expect(matchQuery('aes', [ null, undefined, '' ])).toBe(false);
  });

  test('多个空格分隔关键词为「与」关系 (可跨字段)', () => {
    // 'sm4' 命中名称, '加解密' 命中分类名
    expect(matchQuery('sm4 加解密', [ 'SM4 加解密', 'SM4Crypto', '加解密' ])).toBe(true);
    // 两个关键词需分别命中, 'aes' 与 'dns' 无任何文本同时包含
    expect(matchQuery('aes dns', [ 'AES 加解密', 'AESCrypto' ])).toBe(false);
  });
});
