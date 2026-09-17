//! MTR 查询 (桌面端能力) 的命令层
//!
//! 前端负责编排 (轮次 / 间隔 / 逐跳统计), 这里只提供两件原子操作:
//! - `mtr_resolve`: 域名 -> 首选 IPv4 地址 (MTR 引擎基于 ICMPv4);
//! - `mtr_probe`: 对某个 IP 做一次指定 TTL 的 ICMP 探测。
//!
//! 逐跳名称解析复用 `reverse_dns` 命令 (见 `dns_query`)。

use std::net::{IpAddr, Ipv4Addr};
use std::str::FromStr;
use std::time::{Duration, Instant};

use serde::Serialize;
use tokio::net::lookup_host;

use crate::mtr_engine::{probe_v4, Outcome};

/// 探测超时下限 / 上限 (毫秒)
const MIN_TIMEOUT_MS: u32 = 100;
const MAX_TIMEOUT_MS: u32 = 10_000;

/// 域名解析结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MtrResolvedTarget {
    /// 用户原始输入
    pub input: String,
    /// 解析到的地址
    pub address: String,
    /// ipv4 / ipv6 / literal
    pub kind: String,
    /// 是否存在 IPv4 地址 (MTR 探测要求)
    pub has_ipv4: bool,
    /// 是否用户直接输入了 IP
    pub is_literal: bool,
}

/// 单次探测结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MtrProbeReply {
    /// 本次探测使用的 TTL (= 第几跳)
    pub ttl: u8,
    /// reply / ttlExpired / unreachable / timeout
    pub status: String,
    /// 是否收到应答
    pub ok: bool,
    /// 往返时延 (毫秒, 保留 1 位小数)
    pub rtt_ms: Option<f64>,
    /// 应答方地址
    pub addr: Option<String>,
    /// 差错说明
    pub detail: Option<String>,
    /// 是否已到达目标主机
    pub reached: bool,
    /// 本机视角的耗时 (毫秒), 与 rtt_ms 对比可判断系统计时差异
    pub elapsed_ms: u64,
}

/// 解析目标主机的 IPv4 地址
#[tauri::command]
pub async fn mtr_resolve(host: String) -> Result<MtrResolvedTarget, String> {
    let input = host.trim().to_string();
    if input.is_empty() {
        return Err("请输入域名或 IP 地址".to_string());
    }

    // 直接输入 IP 的情况
    if let Ok(ip) = IpAddr::from_str(&input) {
        return Ok(MtrResolvedTarget {
            input: input.clone(),
            address: ip.to_string(),
            kind: if ip.is_ipv4() { "ipv4" } else { "ipv6" }.to_string(),
            has_ipv4: ip.is_ipv4(),
            is_literal: true,
        });
    }

    let query = format!("{input}:0");
    let addrs = lookup_host(query)
        .await
        .map_err(|e| format!("域名解析失败: {e}"))?
        .map(|sa| sa.ip())
        .collect::<Vec<IpAddr>>();

    if addrs.is_empty() {
        return Err(format!("域名 {input} 没有解析到任何地址"));
    }
    let ipv4 = addrs.iter().find(|ip| ip.is_ipv4()).copied();
    let chosen = ipv4.unwrap_or(addrs[0]);

    Ok(MtrResolvedTarget {
        input: input.clone(),
        address: chosen.to_string(),
        kind: if chosen.is_ipv4() { "ipv4" } else { "ipv6" }.to_string(),
        has_ipv4: ipv4.is_some(),
        is_literal: false,
    })
}

/// 对目标 IP 做一次指定 TTL 的探测
#[tauri::command]
pub async fn mtr_probe(
    host: String,
    ttl: u8,
    timeout_ms: Option<u32>,
) -> Result<MtrProbeReply, String> {
    let text = host.trim().to_string();
    let dest = Ipv4Addr::from_str(&text)
        .map_err(|_| format!("MTR 探测暂只支持 IPv4 目标, 无法解析: {text}"))?;
    let timeout = Duration::from_millis(
        u64::from(timeout_ms.unwrap_or(1000).clamp(MIN_TIMEOUT_MS, MAX_TIMEOUT_MS)),
    );

    let started = Instant::now();
    let outcome = tauri::async_runtime::spawn_blocking(move || probe_v4(dest, ttl, timeout))
        .await
        .map_err(|e| format!("探测任务异常退出: {e}"))??;
    Ok(reply_of(ttl, outcome, started.elapsed()))
}

/// 探测结果 -> 前端结构
fn reply_of(ttl: u8, outcome: Outcome, elapsed: Duration) -> MtrProbeReply {
    let rtt_ms = outcome.rtt.map(|rtt| {
        let ms = rtt.as_secs_f64() * 1000.0;
        (ms * 10.0).round() / 10.0
    });
    let reached = outcome.is_reply();
    MtrProbeReply {
        ttl,
        status: outcome.kind.as_str().to_string(),
        ok: outcome.kind != crate::mtr_engine::OutcomeKind::Timeout,
        rtt_ms,
        addr: outcome.addr.map(|a| a.to_string()),
        detail: outcome.detail,
        reached,
        elapsed_ms: elapsed.as_millis() as u64,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mtr_engine::OutcomeKind;

    #[test]
    fn formats_timeout_reply() {
        let reply = reply_of(3, Outcome::timeout(), Duration::from_millis(1002));
        assert_eq!(reply.ttl, 3);
        assert_eq!(reply.status, "timeout");
        assert!(!reply.ok);
        assert!(!reply.reached);
        assert_eq!(reply.rtt_ms, None);
        assert_eq!(reply.addr, None);
        assert_eq!(reply.elapsed_ms, 1002);
    }

    #[test]
    fn formats_reply_with_rtt() {
        let outcome = Outcome::reply(Ipv4Addr::new(1, 1, 1, 1), Duration::from_micros(12_345));
        let reply = reply_of(9, outcome, Duration::from_millis(20));
        assert_eq!(reply.status, OutcomeKind::Reply.as_str());
        assert!(reply.ok && reply.reached);
        assert_eq!(reply.rtt_ms, Some(12.3));
        assert_eq!(reply.addr.as_deref(), Some("1.1.1.1"));
    }

    #[test]
    fn formats_ttl_expired_reply() {
        let outcome =
            Outcome::ttl_expired(Ipv4Addr::new(192, 168, 0, 1), Duration::from_micros(2_050));
        let reply = reply_of(2, outcome, Duration::from_millis(3));
        assert_eq!(reply.status, "ttlExpired");
        assert!(reply.ok);
        assert!(!reply.reached);
        assert_eq!(reply.rtt_ms, Some(2.1));
    }

    #[test]
    fn formats_unreachable_reply() {
        let outcome =
            Outcome::unreachable(None, Some(Duration::from_millis(5)), "目标主机不可达");
        let reply = reply_of(11, outcome, Duration::from_millis(6));
        assert_eq!(reply.status, "unreachable");
        assert!(reply.ok);
        assert_eq!(reply.detail.as_deref(), Some("目标主机不可达"));
    }

    #[tokio::test]
    async fn resolves_literal_ipv4() {
        let target = mtr_resolve("8.8.8.8".to_string()).await.unwrap();
        assert_eq!(target.address, "8.8.8.8");
        assert_eq!(target.kind, "ipv4");
        assert!(target.is_literal && target.has_ipv4);
    }

    #[tokio::test]
    async fn resolves_literal_ipv6_without_ipv4() {
        let target = mtr_resolve("2001:db8::1".to_string()).await.unwrap();
        assert_eq!(target.kind, "ipv6");
        assert!(!target.has_ipv4);
        assert!(target.is_literal);
    }

    #[tokio::test]
    async fn rejects_empty_host() {
        assert!(mtr_resolve("  ".to_string()).await.is_err());
    }

    #[tokio::test]
    async fn probe_requires_ipv4_literal() {
        let err = mtr_probe("::1".to_string(), 1, None).await.unwrap_err();
        assert!(err.contains("IPv4"));
    }
}
