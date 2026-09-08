import { hashString, FINGERPRINT_CODE, FP_KIND_LABEL } from './lib';
import type { FpKind } from './lib';

describe('浏览器指纹 - FNV-1a 哈希', () => {
  test('已知参考值', () => {
    expect(hashString('')).toBe('811c9dc5');
    expect(hashString('hello')).toBe('4f9f2cab');
    expect(hashString('abc')).toBe('1a47e90b');
  });
  test('不同输入不同 / 相同输入稳定', () => {
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(hashString('fingerprint')).toBe(hashString('fingerprint'));
  });
});

describe('浏览器指纹 - 参考 JS 代码', () => {
  test('三类代码均含哈希函数与核心实现', () => {
    const keys = Object.keys(FINGERPRINT_CODE) as FpKind[];
    expect(keys.sort()).toEqual(['audio', 'canvas', 'webgl']);
    for (const key of keys) {
      expect(FINGERPRINT_CODE[key]).toContain('function fnv1a');
      expect(FINGERPRINT_CODE[key]).toContain('0x01000193');
    }
    expect(FINGERPRINT_CODE.canvas).toContain('getContext(\'2d\')');
    expect(FINGERPRINT_CODE.canvas).toContain('toDataURL');
    expect(FINGERPRINT_CODE.webgl).toContain('WEBGL_debug_renderer_info');
    expect(FINGERPRINT_CODE.audio).toContain('OfflineAudioContext');
    expect(FINGERPRINT_CODE.audio).toContain('startRendering');
  });
  test('类别中文名', () => {
    expect(FP_KIND_LABEL.canvas).toBe('Canvas 指纹');
    expect(FP_KIND_LABEL.webgl).toBe('WebGL 指纹');
    expect(FP_KIND_LABEL.audio).toBe('音频指纹');
  });
});
