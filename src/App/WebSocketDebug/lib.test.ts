import {
  clampHeartbeat, byteLength, formatPayload, countEntries, entriesToText, formatTime, validateWsUrl,
  type LogEntry,
} from './lib';

const entry = (dir: LogEntry['dir'], text: string, time = 0): LogEntry => ({ id: 1, dir, text, time, bytes: byteLength(text) });

describe('WebSocket 调试 / 心跳间隔', () => {
  it('钳制到 0 - 600 的整数', () => {
    expect(clampHeartbeat(-5)).toBe(0);
    expect(clampHeartbeat(0)).toBe(0);
    expect(clampHeartbeat(5.6)).toBe(6);
    expect(clampHeartbeat(999)).toBe(600);
    expect(clampHeartbeat(NaN)).toBe(0);
  });
});

describe('WebSocket 调试 / 地址校验', () => {
  it('合法 ws / wss 地址', () => {
    expect(validateWsUrl('ws://localhost:8080')).toMatchObject({ ok: true, url: 'ws://localhost:8080/' });
    expect(validateWsUrl('  wss://example.com/socket?x=1 ')).toMatchObject({ ok: true, url: 'wss://example.com/socket?x=1' });
  });

  it('http / https 自动转换为 ws / wss', () => {
    expect(validateWsUrl('http://127.0.0.1:9000/ws')).toMatchObject({ ok: true, url: 'ws://127.0.0.1:9000/ws' });
    expect(validateWsUrl('https://example.com/ws')).toMatchObject({ ok: true, url: 'wss://example.com/ws' });
  });

  it('空地址 / 不支持协议 / 非法地址', () => {
    expect(validateWsUrl('')).toEqual({ ok: false, reason: 'empty' });
    expect(validateWsUrl('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(validateWsUrl('ftp://example.com')).toEqual({ ok: false, reason: 'scheme' });
    expect(validateWsUrl('localhost:8080')).toEqual({ ok: false, reason: 'scheme' });
    expect(validateWsUrl('ws://')).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('WebSocket 调试 / 文本处理', () => {
  it('UTF-8 字节数', () => {
    expect(byteLength('')).toBe(0);
    expect(byteLength('abc')).toBe(3);
    expect(byteLength('中文')).toBe(6);
    expect(byteLength('😀')).toBe(4);
  });

  it('JSON 美化', () => {
    expect(formatPayload('{"a":1}', true)).toBe('{\n  "a": 1\n}');
    expect(formatPayload('[1,2]', true)).toBe('[\n  1,\n  2\n]');
    expect(formatPayload('{"a":1}', false)).toBe('{"a":1}');
    expect(formatPayload('not json', true)).toBe('not json');
    expect(formatPayload('', true)).toBe('');
  });

  it('时间格式与日志导出', () => {
    const ts = new Date(2024, 0, 2, 3, 4, 5, 6).getTime();
    expect(formatTime(ts)).toBe('03:04:05.006');
    const entries = [ entry('send', 'hi', ts), entry('recv', '{"a":1}', ts), entry('sys', 'open', ts), entry('error', 'boom', ts) ];
    expect(entriesToText(entries).split('\n')).toEqual([
      '[03:04:05.006] ↑ hi',
      '[03:04:05.006] ↓ {"a":1}',
      '[03:04:05.006] · open',
      '[03:04:05.006] ! boom',
    ]);
    expect(entriesToText([ entry('send', 'hi', ts) ], false)).toBe('↑ hi');
  });

  it('日志统计', () => {
    const stat = countEntries([ entry('send', 'abc'), entry('send', '中文'), entry('recv', 'ok'), entry('sys', 'x') ]);
    expect(stat.sent).toBe(2);
    expect(stat.recv).toBe(1);
    expect(stat.bytes).toBe(3 + 6 + 2 + 1);
  });
});
