//! DNS 查询 (桌面端能力)
//!
//! 浏览器端无法直接发起 DNS 查询 (除非走 DoH), 因此在 Rust 侧用纯 Rust 解析器
//! (trust-dns-resolver) 查询 A / AAAA / CNAME / MX / TXT / SRV / NS 记录,
//! 并支持指定 DNS 服务器。
//!
//! 注: `trust-dns-resolver` 0.23 之后已更名为 `hickory-resolver` 并停止功能更新,
//! 这里沿用用户指定的 crate 名; 由于 API 一致, 后续迁移只需替换依赖名与 use 路径。

use std::net::IpAddr;
use std::str::FromStr;
use std::time::{Duration, Instant};

use serde::Serialize;
use trust_dns_resolver::config::{NameServerConfigGroup, ResolverConfig, ResolverOpts};
use trust_dns_resolver::error::{ResolveError, ResolveErrorKind};
use trust_dns_resolver::proto::rr::RecordType;
use trust_dns_resolver::system_conf::read_system_conf;
use trust_dns_resolver::Resolver;

/// 一条 DNS 记录
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DnsRecord {
    /// 记录所属域名
    pub name: String,
    /// 记录类型 (A / AAAA / MX ...)
    pub record_type: String,
    /// 生存时间 (秒)
    pub ttl: u32,
    /// 记录内容
    pub value: String,
}

/// DNS 查询结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DnsQueryResult {
    /// ok / nxdomain / nodata
    pub status: String,
    /// 记录列表 (SOA 记录会一并返回, 便于查看否定应答的权威信息)
    pub records: Vec<DnsRecord>,
    /// 耗时 (毫秒)
    pub elapsed_ms: u64,
    /// 实际使用的 DNS 服务器
    pub server: String,
    /// 提示信息 (如域名不存在)
    pub message: Option<String>,
}

/// 支持的记录类型 (与前端下拉框一致)
fn parse_record_type(text: &str) -> Result<RecordType, String> {
    match text.trim().to_ascii_uppercase().as_str() {
        "A" => Ok(RecordType::A),
        "AAAA" => Ok(RecordType::AAAA),
        "CNAME" => Ok(RecordType::CNAME),
        "MX" => Ok(RecordType::MX),
        "TXT" => Ok(RecordType::TXT),
        "SRV" => Ok(RecordType::SRV),
        "NS" => Ok(RecordType::NS),
        "SOA" => Ok(RecordType::SOA),
        "PTR" => Ok(RecordType::PTR),
        "CAA" => Ok(RecordType::CAA),
        other => Err(format!("不支持的记录类型: {other}")),
    }
}

/// 域名归一化为绝对名称 (以 `.` 结尾), 避免系统搜索域干扰查询结果
fn to_fqdn(name: &str) -> String {
    format!("{}.", name.trim().trim_end_matches('.'))
}

/// 系统 DNS 配置可能残留大量重复 / 已废弃的地址 (如 IPv6 站点本地地址 fec0::/10),
/// 这里去重、剔除废弃地址并把 IPv4 排前, 避免首次查询等待多个无效服务器超时。
fn prune_servers(config: &ResolverConfig) -> Vec<IpAddr> {
    let mut list: Vec<IpAddr> = Vec::new();
    for ns in config.name_servers() {
        let ip = ns.socket_addr.ip();
        if let IpAddr::V6(v6) = ip {
            // RFC 3879: fec0::/10 已废弃
            if v6.segments()[0] & 0xffc0 == 0xfec0 {
                continue;
            }
        }
        if !list.contains(&ip) {
            list.push(ip);
        }
    }
    // IPv4 优先, 最多保留 4 个
    list.sort_by_key(|ip| !ip.is_ipv4());
    list.truncate(4);
    list
}

/// DNS 服务器列表转成展示文案
fn config_label(servers: &[IpAddr]) -> String {
    if servers.is_empty() {
        "系统默认".to_string()
    } else {
        servers.iter().map(|ip| ip.to_string()).collect::<Vec<_>>().join(", ")
    }
}

/// 构造解析器: 未指定服务器时读取系统配置, 指定时使用该服务器 (53 端口 UDP/TCP)
fn build_resolver(server: Option<&str>) -> Result<(Resolver, String), String> {
    let custom = server.map(str::trim).filter(|s| !s.is_empty() && *s != "system");

    let (config, opts, label) = match custom {
        None => {
            let (config, opts) =
                read_system_conf().map_err(|e| format!("读取系统 DNS 配置失败: {e}"))?;
            let servers = prune_servers(&config);
            let label = config_label(&servers);
            let group = NameServerConfigGroup::from_ips_clear(&servers, 53, true);
            let config =
                ResolverConfig::from_parts(config.domain().cloned(), config.search().to_vec(), group);
            (config, opts, label)
        }
        Some(text) => {
            let ip = IpAddr::from_str(text).map_err(|_| format!("DNS 服务器地址无效: {text}"))?;
            let group = NameServerConfigGroup::from_ips_clear(&[ip], 53, true);
            let config = ResolverConfig::from_parts(None, vec![], group);
            let mut opts = ResolverOpts::default();
            opts.timeout = Duration::from_secs(5);
            opts.attempts = 2;
            opts.validate = false;
            (config, opts, ip.to_string())
        }
    };

    let resolver =
        Resolver::new(config, opts).map_err(|e| format!("DNS 客户端初始化失败: {e}"))?;
    Ok((resolver, label))
}

/// 把解析结果转成记录列表
fn collect_records(lookup: &trust_dns_resolver::lookup::Lookup) -> Vec<DnsRecord> {
    lookup
        .record_iter()
        .map(|rec| DnsRecord {
            name: rec.name().to_utf8(),
            record_type: format!("{:?}", rec.record_type()),
            ttl: rec.ttl(),
            value: rec.data().map(|d| d.to_string()).unwrap_or_default(),
        })
        .collect()
}

/// 查询指定域名的 DNS 记录
///
/// * `name` - 域名 (可带结尾点)
/// * `record_type` - A / AAAA / CNAME / MX / TXT / SRV / NS ...
/// * `server` - 可选: DNS 服务器 IP; 留空表示使用系统配置
#[tauri::command]
pub async fn dns_query(
    name: String,
    record_type: String,
    server: Option<String>,
) -> Result<DnsQueryResult, String> {
    let raw = name.trim().to_string();
    if raw.is_empty() {
        return Err("请输入要查询的域名".to_string());
    }
    let rtype = parse_record_type(&record_type)?;
    let rtype_label = record_type.trim().to_ascii_uppercase();
    let query_name = to_fqdn(&raw);
    let server_arg = server.clone();

    let started = Instant::now();
    let joined = tauri::async_runtime::spawn_blocking(move || {
        let (resolver, label) = build_resolver(server_arg.as_deref())?;
        let looked: Result<_, ResolveError> = resolver.lookup(query_name.as_str(), rtype);
        Ok::<_, String>((label, looked))
    })
    .await
    .map_err(|e| format!("查询任务异常退出: {e}"))?;

    let (server_label, looked) = joined?;
    let elapsed_ms = started.elapsed().as_millis() as u64;

    match looked {
        Ok(lookup) => Ok(DnsQueryResult {
            status: "ok".to_string(),
            records: collect_records(&lookup),
            elapsed_ms,
            server: server_label,
            message: None,
        }),
        Err(err) => match err.kind() {
            ResolveErrorKind::NoRecordsFound { soa, negative_ttl, response_code, .. } => {
                let nx = format!("{response_code}").to_ascii_uppercase().contains("NXDOMAIN");
                let mut records = Vec::new();
                if let Some(soa) = soa {
                    records.push(DnsRecord {
                        name: soa.name().to_utf8(),
                        record_type: "SOA".to_string(),
                        ttl: negative_ttl.unwrap_or_else(|| soa.ttl()),
                        value: soa.data().map(|d| d.to_string()).unwrap_or_default(),
                    });
                }
                Ok(DnsQueryResult {
                    status: if nx { "nxdomain" } else { "nodata" }.to_string(),
                    records,
                    elapsed_ms,
                    server: server_label,
                    message: Some(if nx {
                        "域名不存在 (NXDOMAIN)".to_string()
                    } else {
                        format!("该域名没有 {rtype_label} 记录")
                    }),
                })
            }
            ResolveErrorKind::Timeout => {
                Err(format!("查询超时, 请检查网络或更换 DNS 服务器 ({server_label})"))
            }
            other => Err(format!("查询失败: {other}")),
        },
    }
}

/// 反向解析 (PTR): IP -> 主机名, 供 MTR 显示每一跳的名称
#[tauri::command]
pub async fn reverse_dns(ip: String) -> Result<Option<String>, String> {
    let text = ip.trim().to_string();
    let addr = IpAddr::from_str(&text).map_err(|_| format!("IP 地址无效: {text}"))?;

    let joined = tauri::async_runtime::spawn_blocking(move || {
        let (resolver, _) = build_resolver(None)?;
        Ok::<_, String>(resolver.reverse_lookup(addr))
    })
    .await
    .map_err(|e| format!("反向解析任务异常退出: {e}"))?;

    match joined? {
        Ok(lookup) => {
            let name = lookup
                .iter()
                .map(|n| n.to_utf8())
                .find(|n| !n.is_empty() && n != ".");
            Ok(name.map(|n| n.trim_end_matches('.').to_string()))
        }
        // 反向解析失败很常见 (家用网络 / 路由器), 视为「无名称」而不是错误
        Err(_) => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_supported_record_types() {
        assert_eq!(parse_record_type("a").unwrap(), RecordType::A);
        assert_eq!(parse_record_type(" AAAA ").unwrap(), RecordType::AAAA);
        assert_eq!(parse_record_type("mx").unwrap(), RecordType::MX);
        assert_eq!(parse_record_type("Txt").unwrap(), RecordType::TXT);
        assert_eq!(parse_record_type("srv").unwrap(), RecordType::SRV);
        assert_eq!(parse_record_type("ns").unwrap(), RecordType::NS);
        assert_eq!(parse_record_type("cname").unwrap(), RecordType::CNAME);
    }

    #[test]
    fn prunes_system_servers() {
        // fec0::/10 属于已废弃的站点本地地址, 应被剔除; 重复项应去重; IPv4 应排前
        let ips: Vec<IpAddr> = [
            "fec0:0:0:ffff::1",
            "fe80::1",
            "192.168.1.1",
            "192.168.1.1",
            "8.8.8.8",
            "1.1.1.1",
            "9.9.9.9",
            "2606:4700:4700::1111",
        ]
        .iter()
        .map(|s| s.parse().unwrap())
        .collect();
        let config = ResolverConfig::from_parts(
            None,
            vec![],
            NameServerConfigGroup::from_ips_clear(&ips, 53, true),
        );
        let servers = prune_servers(&config);
        assert_eq!(servers.len(), 4);
        assert!(servers.iter().all(|ip| ip.is_ipv4()));
        assert_eq!(servers[0].to_string(), "192.168.1.1");
    }

    #[test]
    fn labels_system_servers() {
        assert_eq!(config_label(&[]), "系统默认");
        assert_eq!(config_label(&["1.1.1.1".parse().unwrap()]), "1.1.1.1");
    }

    #[test]
    fn rejects_unknown_record_type() {
        let err = parse_record_type("BOGUS").unwrap_err();
        assert!(err.contains("BOGUS"));
    }

    #[test]
    fn normalizes_to_absolute_name() {
        assert_eq!(to_fqdn("example.com"), "example.com.");
        assert_eq!(to_fqdn(" example.com. "), "example.com.");
        assert_eq!(to_fqdn("_sip._tcp.example.com"), "_sip._tcp.example.com.");
    }

    #[test]
    fn rejects_invalid_custom_server() {
        let err = build_resolver(Some("not-an-ip")).map(|_| ()).unwrap_err();
        assert!(err.contains("DNS 服务器地址无效"));
    }

    #[test]
    fn builds_resolver_for_custom_server() {
        let (_resolver, label) = build_resolver(Some("1.2.3.4")).unwrap();
        assert_eq!(label, "1.2.3.4");
    }

    #[test]
    fn blank_server_means_system_config() {
        let (_resolver, label) = build_resolver(Some("   ")).unwrap();
        assert!(!label.is_empty());
    }

    #[tokio::test]
    async fn queries_loopback_reverse_lookup() {
        // 本机回环地址必然可反向解析为 localhost (依赖系统 hosts/解析器, 可能为空但不应报错)
        let result = reverse_dns("127.0.0.1".to_string()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn reverse_dns_rejects_invalid_ip() {
        let err = reverse_dns("300.1.1.1".to_string()).await.unwrap_err();
        assert!(err.contains("IP 地址无效"));
    }

    #[tokio::test]
    async fn dns_query_rejects_empty_name() {
        let err = dns_query("  ".to_string(), "A".to_string(), None).await.unwrap_err();
        assert!(err.contains("请输入要查询的域名"));
    }

    #[tokio::test]
    async fn dns_query_rejects_unknown_type() {
        let err = dns_query("example.com".to_string(), "XX".to_string(), None)
            .await
            .unwrap_err();
        assert!(err.contains("不支持的记录类型"));
    }
}

