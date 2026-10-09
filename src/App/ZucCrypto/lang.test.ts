import lang, { cr, crErr, crT } from './lang';

describe('ZucCrypto 语言包', () => {
  test('应用名称三语齐全 (zh-CN 取自 define.tsx 的 AppName)', () => {
    expect(lang.default).toBe('zh-CN');
    expect(lang['zh-TW'].appName).toBe('祖沖之序列密碼');
    expect(lang.en.appName).toBe('ZUC Encrypt / Decrypt');
  });

  test('cr: 命中词条返回对应语言, 未命中回退原文', () => {
    expect(cr('zh-CN', '加密')).toBe('加密');
    expect(cr('zh-TW', '加密')).toBe('加密');
    expect(cr('en', '加密')).toBe('Encrypt');
    expect(cr('en', '解密')).toBe('Decrypt');
    expect(cr('en', '引擎就绪')).toBe('Engine ready');
    // 未收录的原文原样返回 (不会变成 undefined)
    expect(cr('en', '没收录的文案')).toBe('没收录的文案');
  });

  test('crT: 替换 {bits} / {need} / {got} 占位符', () => {
    expect(crT('zh-CN', '密钥需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节', { bits: 32, need: 16, got: 15 }))
      .toBe('密钥需为 32 位 HEX (16 字节), 当前 15 字节');
    expect(crT('en', '密钥需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节', { bits: 32, need: 16, got: 15 }))
      .toBe('The key must be 32 HEX digits (16 bytes); got 15 bytes');
    // 不传变量时保留占位符
    expect(crT('zh-CN', '密钥需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节')).toContain('{bits}');
  });

  test('crErr: 页面自校验的定长报错按模板翻译', () => {
    expect(crErr('en', '密钥需为 256 位 HEX (32 字节), 当前 16 字节'))
      .toBe('The key must be 256 HEX digits (32 bytes); got 16 bytes');
    expect(crErr('zh-TW', '偏移量 IV 需为 184 位 HEX (23 字节), 当前 0 字节'))
      .toBe('偏移量 IV 需為 184 位 HEX (23 位元組), 目前 0 位元組');
    expect(crErr('zh-CN', '密钥需为 32 位 HEX (16 字节), 当前 15 字节'))
      .toBe('密钥需为 32 位 HEX (16 字节), 当前 15 字节');
  });

  test('crErr: wasm 引擎的长度报错与编码报错也能翻译', () => {
    expect(crErr('en', '密钥长度必须为 16 字节')).toBe('The key must be exactly 16 bytes');
    expect(crErr('en', 'IV 长度必须为 23 字节')).toBe('The IV must be exactly 23 bytes');
    expect(crErr('en', 'hex 内容不合法')).toBe('Invalid HEX content');
    expect(crErr('en', 'base64 内容不合法')).toBe('Invalid Base64 content');
    // 未知错误原样透出
    expect(crErr('en', 'wasm 内存分配失败, 数据可能过大')).toBe('wasm 内存分配失败, 数据可能过大');
  });
});
