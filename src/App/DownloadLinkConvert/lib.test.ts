import { batchConvert, convertDownloadLink } from './lib';

const b64 = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

describe('下载链接转换', () => {
  it('真实地址 -> 四种格式 (golden)', () => {
    const url = 'http://example.com/file.zip';
    const r = convertDownloadLink(url);
    expect(r.real).toBe(url);
    expect(r.thunder).toBe('thunder://' + b64('AA' + url + 'ZZ'));
    expect(r.qqdl).toBe('qqdl://' + b64(url));
    expect(r.qdl).toBe('qdl://' + b64(url));
  });

  it('迅雷地址自动识别还原', () => {
    const url = 'http://example.com/setup.exe';
    const input = 'thunder://' + b64('AA' + url + 'ZZ');
    const r = convertDownloadLink(input);
    expect(r.real).toBe(url);
    expect(r.thunder).toBe(input);
  });

  it('快车地址 (qqdl) 自动识别还原', () => {
    const url = 'ftp://ftp.example.com/tool.iso';
    const input = 'qqdl://' + b64(url);
    const r = convertDownloadLink(input);
    expect(r.real).toBe(url);
    expect(r.qqdl).toBe(input);
  });

  it('旋风地址 (qdl) 自动识别还原', () => {
    const url = 'https://example.com/app.dmg';
    const input = 'qdl://' + b64(url);
    const r = convertDownloadLink(input);
    expect(r.real).toBe(url);
    expect(r.qdl).toBe(input);
  });

  it('任意一种输入都能产出全部四种格式且一致', () => {
    const url = 'http://example.com/a/b.zip?x=1&y=2';
    const fromPlain = convertDownloadLink(url);
    const fromThunder = convertDownloadLink('thunder://' + b64('AA' + url + 'ZZ'));
    const fromQqdl = convertDownloadLink('qqdl://' + b64(url));
    const fromQdl = convertDownloadLink('qdl://' + b64(url));
    expect(fromThunder).toEqual(fromPlain);
    expect(fromQqdl).toEqual(fromPlain);
    expect(fromQdl).toEqual(fromPlain);
  });

  it('大写前缀与含空白的输入宽容处理', () => {
    const url = 'http://example.com/f.zip';
    expect(convertDownloadLink('  THUNDER://' + b64('AA' + url + 'ZZ') + ' ').real).toBe(url);
    expect(convertDownloadLink('Qqdl://' + b64(url)).real).toBe(url);
  });

  it('含中文文件名的地址 UTF-8 往返一致', () => {
    const url = 'http://example.com/软件安装包(2026).zip';
    const r = convertDownloadLink(url);
    expect(convertDownloadLink(r.thunder).real).toBe(url);
    expect(convertDownloadLink(r.qqdl).real).toBe(url);
    expect(convertDownloadLink(r.qdl).real).toBe(url);
  });

  it('ftp / https 等真实地址原样返回', () => {
    expect(convertDownloadLink('ftp://x.com/a.txt').real).toBe('ftp://x.com/a.txt');
    expect(convertDownloadLink('https://x.com/a.bin?k=v#f').real).toBe('https://x.com/a.bin?k=v#f');
  });

  it('批量转换: 混合格式输入统一转目标格式, 空行忽略', () => {
    const urlA = 'http://example.com/a.zip';
    const urlB = 'http://example.com/b.zip';
    const urlC = 'http://example.com/c.zip';
    const input = [
      urlA,
      'thunder://' + b64('AA' + urlB + 'ZZ'),
      '',
      'qqdl://' + b64(urlC),
    ].join('\n');
    const out = batchConvert(input, 'thunder');
    const lines = out.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('thunder://' + b64('AA' + urlA + 'ZZ'));
    expect(lines[1]).toBe('thunder://' + b64('AA' + urlB + 'ZZ'));
    expect(lines[2]).toBe('thunder://' + b64('AA' + urlC + 'ZZ'));
  });

  it('批量转换: 目标选真实地址可从专用链还原', () => {
    const url = 'https://example.com/x.zip';
    const input = 'thunder://' + b64('AA' + url + 'ZZ') + '\n' + 'qdl://' + b64(url);
    const out = batchConvert(input, 'real');
    expect(out.split('\n')).toEqual([url, url]);
  });

  it('批量转换: 任一无效行抛错且带行号', () => {
    const good = 'http://example.com/ok.zip';
    expect(() => batchConvert(good + '\n坏掉的一行', 'qqdl')).toThrow(/第 2 行/);
    expect(() => batchConvert(good + '\n' + good + '\n', 'real')).not.toThrow();
    expect(batchConvert('', 'real')).toBe('');
  });

  it('批量转换: 中文地址行 UTF-8 往返', () => {
    const out = batchConvert('http://example.com/资料.zip', 'qdl');
    expect(batchConvert(out, 'real')).toBe('http://example.com/资料.zip');
  });

  it('非法输入抛错', () => {
    expect(() => convertDownloadLink('')).toThrow(/输入/);
    expect(() => convertDownloadLink('   ')).toThrow(/输入/);
    expect(() => convertDownloadLink('随便一段文字')).toThrow(/无法识别/);
    expect(() => convertDownloadLink('file.zip')).toThrow(/无法识别/);
    expect(() => convertDownloadLink('thunder://!!!not-base64!!!')).toThrow(/解码失败|无效/);
    // base64 内容合法但没有 AA/ZZ 标记
    expect(() => convertDownloadLink('thunder://' + b64('http://x.com/a.zip'))).toThrow(/AA\/ZZ/);
  });
});
