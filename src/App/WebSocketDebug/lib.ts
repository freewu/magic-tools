// WebSocket 调试: 纯函数工具 (地址校验 / 日志统计 / 文本格式化), 便于单测
export type LogDir = 'send' | 'recv' | 'sys' | 'error';

export interface LogEntry {
  id: number;
  dir: LogDir;
  text: string;
  time: number;
  bytes: number;
}

/** 心跳间隔范围 (秒), 0 = 关闭心跳 */
export const HEARTBEAT_MIN = 0;
export const HEARTBEAT_MAX = 600;

/** 心跳间隔钳制到 [0, 600] 的整数 (非法值回退 0 = 关闭) */
export function clampHeartbeat(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(HEARTBEAT_MAX, Math.max(HEARTBEAT_MIN, Math.round(v)));
}

export type UrlReason = 'empty' | 'scheme' | 'invalid';
export type UrlResult = { ok: true; url: string } | { ok: false; reason: UrlReason };

/**
 * 校验并规整 WebSocket 地址
 * - http:// / https:// 自动转换为 ws:// / wss://
 * - 其它协议 (ftp: 等) 视为不支持, 空地址 / 非法地址分别返回原因
 */
export function validateWsUrl(input: string): UrlResult {
  let s = (input ?? '').trim();
  if (s === '') return { ok: false, reason: 'empty' };
  if (/^https?:\/\//i.test(s)) s = s.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  if (!/^wss?:\/\//i.test(s)) return { ok: false, reason: 'scheme' };
  try {
    const u = new URL(s);
    if (u.hostname === '') return { ok: false, reason: 'invalid' };
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** UTF-8 字节数 (按码点计算, 不依赖 TextEncoder) */
export function byteLength(text: string): number {
  let n = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) as number;
    n += c <= 0x7f ? 1 : c <= 0x7ff ? 2 : c <= 0xffff ? 3 : 4;
  }
  return n;
}

/** JSON 美化: 合法 JSON 才缩进, 否则原样返回 */
export function formatPayload(text: string, pretty: boolean): string {
  if (!pretty) return text;
  const s = text.trim();
  if (s === '' || (s[0] !== '{' && s[0] !== '[')) return text;
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return text;
  }
}

export interface LogStat { sent: number; recv: number; bytes: number }

/** 日志统计: 发送 / 接收条数与总字节数 */
export function countEntries(entries: LogEntry[]): LogStat {
  const stat: LogStat = { sent: 0, recv: 0, bytes: 0 };
  for (const e of entries) {
    if (e.dir === 'send') stat.sent++;
    else if (e.dir === 'recv') stat.recv++;
    stat.bytes += e.bytes;
  }
  return stat;
}

const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
/** 时间戳 -> HH:mm:ss.SSS */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}
const DIR_MARK: Record<LogDir, string> = { send: '↑', recv: '↓', sys: '·', error: '!' };

/** 日志导出为文本 (每行: 时间 方向 内容) */
export function entriesToText(entries: LogEntry[], withTime = true): string {
  return entries
    .map((e) => `${withTime ? '[' + formatTime(e.time) + '] ' : ''}${DIR_MARK[e.dir]} ${e.text}`)
    .join('\n');
}
