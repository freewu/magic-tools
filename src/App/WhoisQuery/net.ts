// Whois 查询网络层: 浏览器版无法建立 TCP 43 连接, 只走桌面版 (Tauri)

import { isTauri } from '../../lib/tauri';
import type { WhoisResult } from './lib';

/** 浏览器环境下调用网络命令的统一错误 */
export const DESKTOP_ONLY_ERROR = '该功能仅在桌面应用中可用';

/**
 * 查询域名 / IP 的 Whois 信息 (跟随注册局转介, 最多 3 跳)
 * @param query 已归一化的域名或 IP
 */
export async function whoisQuery(query: string): Promise<WhoisResult> {
  if (!isTauri()) throw new Error(DESKTOP_ONLY_ERROR);
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<WhoisResult>('whois_query', { query });
}
