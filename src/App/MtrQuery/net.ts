// MTR 查询网络层: 浏览器版无法发送 ICMP, 只走桌面版 (Tauri)

import { isTauri } from '../../lib/tauri';
import type { MtrProbeReply, MtrResolvedTarget } from './lib';

/** 浏览器环境下调用网络命令的统一错误 */
export const DESKTOP_ONLY_ERROR = '该功能仅在桌面应用中可用';

/** 解析目标主机 (域名 -> 首选 IPv4) */
export async function mtrResolve(host: string): Promise<MtrResolvedTarget> {
  if (!isTauri()) throw new Error(DESKTOP_ONLY_ERROR);
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<MtrResolvedTarget>('mtr_resolve', { host });
}

/**
 * 对目标 IP 做一次指定 TTL 的 ICMP 探测
 * @param host 目标 IPv4 地址
 * @param ttl 生存时间 (= 第几跳)
 * @param timeoutMs 超时毫秒 (后端限制 100-10000)
 */
export async function mtrProbe(host: string, ttl: number, timeoutMs: number): Promise<MtrProbeReply> {
  if (!isTauri()) throw new Error(DESKTOP_ONLY_ERROR);
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<MtrProbeReply>('mtr_probe', { host, ttl, timeoutMs });
}

/** 反向解析 IP (失败返回 null) */
export async function reverseDns(ip: string): Promise<string> {
  if (!isTauri()) throw new Error(DESKTOP_ONLY_ERROR);
  const { invoke } = await import('@tauri-apps/api/core');
  return (await invoke<string | null>('reverse_dns', { ip })) ?? '';
}
