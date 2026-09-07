import { parseVersion, compareVersions, fetchLatestRelease, LATEST_API_URL } from './update';

describe('版本比较 parseVersion / compareVersions', () => {

  it('parseVersion: 去掉前导 v 并逐段转数字', () => {
    expect(parseVersion('v2.5.0')).toEqual([2, 5, 0]);
    expect(parseVersion('2.5.0')).toEqual([2, 5, 0]);
    expect(parseVersion(' v2.10.1 ')).toEqual([2, 10, 1]);
    // 非数字段按 0
    expect(parseVersion('2.5.beta')).toEqual([2, 5, 0]);
  });

  it('compareVersions: 基础大小与相等', () => {
    expect(compareVersions('v2.5.0', 'v2.4.1')).toBeGreaterThan(0);
    expect(compareVersions('v2.4.1', 'v2.5.0')).toBeLessThan(0);
    expect(compareVersions('v2.5.0', '2.5.0')).toBe(0);
  });

  it('compareVersions: 段数不同按缺省 0 处理', () => {
    expect(compareVersions('2.5', '2.5.0')).toBe(0);
    expect(compareVersions('2.5.1', '2.5')).toBeGreaterThan(0);
    expect(compareVersions('2.5', '2.5.1')).toBeLessThan(0);
  });

  it('compareVersions: 10 > 9 按数字比较而非字典序', () => {
    expect(compareVersions('2.10.0', '2.9.9')).toBeGreaterThan(0);
  });
});

describe('fetchLatestRelease (GitHub Releases API)', () => {

  it('200 + 正常 payload -> 返回 tag/version/url', async () => {
    const fake = (() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            tag_name: 'v2.6.0',
            html_url: 'https://github.com/freewu/magic-tools/releases/tag/v2.6.0',
          }),
      })) as unknown as typeof fetch;
    const info = await fetchLatestRelease(fake);
    expect(info).not.toBeNull();
    expect(info?.tag).toBe('v2.6.0');
    expect(info?.version).toBe('2.6.0');
    expect(info?.url).toContain('/releases/tag/v2.6.0');
  });

  it('非 2xx (限流/404) -> null 静默', async () => {
    const fake = (() => Promise.resolve({ ok: false })) as unknown as typeof fetch;
    expect(await fetchLatestRelease(fake)).toBeNull();
  });

  it('网络异常 reject -> null 静默', async () => {
    const fake = (() => Promise.reject(new Error('network down'))) as unknown as typeof fetch;
    expect(await fetchLatestRelease(fake)).toBeNull();
  });

  it('payload 缺 tag_name -> null', async () => {
    const fake = (() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ foo: 1 }) })) as unknown as typeof fetch;
    expect(await fetchLatestRelease(fake)).toBeNull();
  });

  it('实际请求打的是 LATEST_API_URL', () => {
    expect(LATEST_API_URL).toBe(
      'https://api.github.com/repos/freewu/magic-tools/releases/latest',
    );
  });
});
