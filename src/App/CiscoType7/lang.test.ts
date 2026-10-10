import { AppName } from './define';
import lang, { cr, crT } from './lang';

describe('CiscoType7 语言包', () => {
  test('应用名称为「Cisco Type 7 加解密」(zh-CN 取自 define.tsx, zh-TW 回退 zh-CN)', () => {
    expect(lang.default).toBe('zh-CN');
    expect(AppName).toBe('Cisco Type 7 加解密');
    // 未单独提供 zh-TW 名称: 由 appNameOf 回退到 define.tsx 的 AppName
    expect('zh-TW' in lang).toBe(false);
    expect(lang.en.appName).toBe('Cisco Type 7 Encrypt / Decrypt');
  });

  test('cr: 按钮文案三语, 未收录的原文原样返回', () => {
    expect(cr('zh-CN', '加密')).toBe('加密');
    expect(cr('zh-TW', '加密')).toBe('加密');
    expect(cr('en', '加密')).toBe('Encrypt');
    expect(cr('en', '解密')).toBe('Decrypt');
    expect(cr('en', '清除')).toBe('Clear');
    expect(cr('en', '没收录的文案')).toBe('没收录的文案');
  });

  test('crT: 替换 {pos} 占位符', () => {
    expect(crT('en', 'Type 7 第 {pos} 位起含非十六进制字符', { pos: 3 })).toBe('Non-hex character starting at position 3 of the Type 7 string');
    expect(crT('zh-CN', 'Type 7 第 {pos} 位起含非十六进制字符')).toContain('{pos}');
  });
});
