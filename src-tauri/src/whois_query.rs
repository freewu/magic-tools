//! Whois 查询 (桌面端能力)
//!
//! 浏览器无法直接使用 Whois 协议 (TCP 43), 因此在 Rust 侧实现:
//! 1. 归一化输入 (域名 / IPv4 / IPv6), 去掉协议头、路径与端口;
//! 2. 选择起始服务器 (内置常用 TLD 表, 其余交给 whois.iana.org);
//! 3. 按 `refer:` / `ReferralServer:` / `Registrar WHOIS Server:` 逐级追查,
//!    最多 3 跳, 每跳结果都返回给前端展示。

use std::collections::HashSet;
use std::net::IpAddr;
use std::str::FromStr;
use std::time::Duration;

use serde::Serialize;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::time::timeout;

/// Whois 协议端口
const WHOIS_PORT: u16 = 43;
/// 建立连接超时
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
/// 单次读取超时 (超时视为输出结束, 部分服务器不主动断开)
const READ_TIMEOUT: Duration = Duration::from_secs(15);
/// 写入超时
const WRITE_TIMEOUT: Duration = Duration::from_secs(10);
/// 单次响应最大字节数 (防止超大 TOS 文本)
const MAX_BYTES: usize = 512 * 1024;
/// 最多追查跳数
const MAX_HOPS: usize = 3;
/// 缺省起始服务器 (权威的 TLD / ASN 分配信息)
const IANA_SERVER: &str = "whois.iana.org";

/// 一跳 Whois 响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WhoisSection {
    /// 本次查询的 Whois 服务器
    pub server: String,
    /// 原始响应文本
    pub text: String,
    /// 补充说明 (如该跳查询失败)
    pub note: Option<String>,
}

/// Whois 查询结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WhoisResult {
    /// 归一化后的查询对象
    pub query: String,
    /// domain / ipv4 / ipv6
    pub kind: String,
    /// 逐跳结果 (第 1 跳为权威注册局 / IANA)
    pub sections: Vec<WhoisSection>,
}

/// 常用 TLD / 二级后缀 -> Whois 服务器 (命中可省去一次 IANA 跳转)
const TLD_SERVERS: &[(&str, &str)] = &[
    ("com", "whois.verisign-grs.com"),
    ("net", "whois.verisign-grs.com"),
    ("org", "whois.pir.org"),
    ("info", "whois.afilias.net"),
    ("biz", "whois.biz"),
    ("mobi", "whois.mobi"),
    ("name", "whois.nic.name"),
    ("io", "whois.nic.io"),
    ("ai", "whois.nic.ai"),
    ("co", "whois.nic.co"),
    ("me", "whois.nic.me"),
    ("tv", "whois.nic.tv"),
    ("cc", "ccwhois.verisign-grs.com"),
    ("dev", "whois.nic.google"),
    ("app", "whois.nic.google"),
    ("page", "whois.nic.google"),
    ("xyz", "whois.nic.xyz"),
    ("top", "whois.nic.top"),
    ("site", "whois.nic.site"),
    ("online", "whois.nic.online"),
    ("store", "whois.nic.store"),
    ("tech", "whois.nic.tech"),
    ("cloud", "whois.nic.cloud"),
    ("shop", "whois.nic.shop"),
    ("vip", "whois.nic.vip"),
    ("club", "whois.nic.club"),
    ("pro", "whois.nic.pro"),
    ("red", "whois.nic.red"),
    ("link", "whois.nic.link"),
    ("art", "whois.nic.art"),
    ("fun", "whois.nic.fun"),
    ("live", "whois.nic.live"),
    ("space", "whois.nic.space"),
    ("website", "whois.nic.website"),
    ("cn", "whois.cnnic.cn"),
    ("com.cn", "whois.cnnic.cn"),
    ("net.cn", "whois.cnnic.cn"),
    ("org.cn", "whois.cnnic.cn"),
    ("gov.cn", "whois.cnnic.cn"),
    ("tw", "whois.twnic.net.tw"),
    ("hk", "whois.hkirc.hk"),
    ("jp", "whois.jprs.jp"),
    ("kr", "whois.kr"),
    ("sg", "whois.sgnic.sg"),
    ("in", "whois.registry.in"),
    ("uk", "whois.nic.uk"),
    ("co.uk", "whois.nic.uk"),
    ("org.uk", "whois.nic.uk"),
    ("de", "whois.denic.de"),
    ("fr", "whois.nic.fr"),
    ("nl", "whois.domain-registry.nl"),
    ("be", "whois.dns.be"),
    ("it", "whois.nic.it"),
    ("es", "whois.nic.es"),
    ("ch", "whois.nic.ch"),
    ("at", "whois.nic.at"),
    ("se", "whois.iis.se"),
    ("no", "whois.norid.no"),
    ("fi", "whois.fi"),
    ("dk", "whois.dk-hostmaster.dk"),
    ("pl", "whois.dns.pl"),
    ("cz", "whois.nic.cz"),
    ("ru", "whois.tcinet.ru"),
    ("ua", "whois.ua"),
    ("us", "whois.nic.us"),
    ("ca", "whois.cira.ca"),
    ("au", "whois.auda.org.au"),
    ("nz", "whois.srs.net.nz"),
    ("br", "whois.registro.br"),
    ("mx", "whois.mx"),
    ("ar", "whois.nic.ar"),
    ("za", "whois.registry.net.za"),
    ("ae", "whois.aeda.net.ae"),
    ("il", "whois.isoc.org.il"),
    ("tr", "whois.trabis.gov.tr"),
];

/// 归一化查询对象: 去掉协议头 / 路径 / 端口, 校验格式
fn normalize_query(input: &str) -> Result<String, String> {
    let mut text = input.trim().to_string();
    if text.is_empty() {
        return Err("请输入域名或 IP 地址".to_string());
    }

    // 已经是 IP 地址时直接返回
    if let Ok(ip) = IpAddr::from_str(&text) {
        return Ok(ip.to_string());
    }

    // 去掉协议头
    for scheme in ["whois://", "http://", "https://"] {
        if let Some(rest) = text.strip_prefix(scheme) {
            text = rest.to_string();
            break;
        }
    }
    // 去掉路径 / 查询串
    if let Some(idx) = text.find(['/', '?', '#']) {
        text.truncate(idx);
    }
    // 去掉端口
    if let Some(idx) = text.rfind(':') {
        text.truncate(idx);
    }

    let name = text.trim().trim_end_matches('.').to_ascii_lowercase();
    if name.is_empty() {
        return Err("请输入域名或 IP 地址".to_string());
    }
    if !name.is_ascii() {
        return Err("暂不支持中文域名, 请使用 Punycode 形式 (如 xn--fiq228c.com)".to_string());
    }
    if name.len() > 253 {
        return Err("域名长度超出限制 (最长 253 个字符)".to_string());
    }
    let labels: Vec<&str> = name.split('.').collect();
    if !name.contains('.') || labels.iter().any(|l| l.is_empty()) {
        return Err(format!("域名格式不正确: {name}"));
    }
    let valid = labels.iter().all(|l| {
        l.len() <= 63
            && !l.starts_with('-')
            && !l.ends_with('-')
            && l.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    });
    if !valid {
        return Err(format!("域名格式不正确: {name}"));
    }
    Ok(name)
}

/// 判断查询对象类型
fn kind_of(query: &str) -> &'static str {
    match IpAddr::from_str(query) {
        Ok(IpAddr::V4(_)) => "ipv4",
        Ok(IpAddr::V6(_)) => "ipv6",
        Err(_) => "domain",
    }
}

/// 内置 TLD 表查询 (先试二级后缀, 再试顶级后缀)
fn tld_server(query: &str) -> Option<&'static str> {
    let labels: Vec<&str> = query.split('.').collect();
    if labels.len() >= 3 {
        let two = format!("{}.{}", labels[labels.len() - 2], labels[labels.len() - 1]);
        if let Some((_, server)) = TLD_SERVERS.iter().find(|(suffix, _)| *suffix == two) {
            return Some(server);
        }
    }
    let tld = labels.last()?;
    TLD_SERVERS.iter().find(|(suffix, _)| suffix == tld).map(|(_, server)| *server)
}

/// 起始服务器: IP 交给 IANA (由它转介到对应 RIR), 域名优先用内置表
fn default_server(query: &str) -> &'static str {
    if kind_of(query) == "domain" {
        tld_server(query).unwrap_or(IANA_SERVER)
    } else {
        IANA_SERVER
    }
}

/// 部分服务器需要特定查询语法 (ARIN 建议用 `n +` 查网络、`r +` 查域名)
fn request_for(server: &str, query: &str) -> String {
    match server {
        "whois.arin.net" => match kind_of(query) {
            "domain" => format!("r + {query}"),
            _ => format!("n + {query}"),
        },
        _ => query.to_string(),
    }
}

/// 从响应文本中提取下一跳服务器
fn referral_of(text: &str) -> Option<String> {
    const PREFIXES: &[&str] = &[
        "refer:",
        "referralserver:",
        "registrar whois server:",
        "whois server:",
        "whois:",
    ];
    for raw in text.lines() {
        let line = raw.trim();
        let lower = line.to_ascii_lowercase();
        for prefix in PREFIXES {
            if let Some(_) = lower.strip_prefix(prefix) {
                if let Some(host) = host_of(&line[prefix.len()..]) {
                    return Some(host);
                }
            }
        }
    }
    None
}

/// 把 `whois://host:port/path` 之类的值规整为纯主机名
fn host_of(value: &str) -> Option<String> {
    let cleaned = value.trim().to_ascii_lowercase();
    let without_scheme = cleaned.strip_prefix("whois://").unwrap_or(&cleaned);
    let host = without_scheme
        .split(['/', '?', '#', ' '])
        .next()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("")
        .trim()
        .trim_end_matches('.')
        .to_string();
    if host.is_empty() || !host.contains('.') {
        return None;
    }
    if !host.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '.') {
        return None;
    }
    Some(host)
}

/// 查询单个 Whois 服务器
async fn query_server(server: &str, request: &str) -> Result<String, String> {
    let stream = timeout(CONNECT_TIMEOUT, TcpStream::connect((server, WHOIS_PORT)))
        .await
        .map_err(|_| format!("连接 {server}:{WHOIS_PORT} 超时"))?
        .map_err(|e| format!("连接 {server}:{WHOIS_PORT} 失败: {e}"))?;

    let (mut reader, mut writer) = stream.into_split();
    let payload = format!("{request}\r\n");
    timeout(WRITE_TIMEOUT, writer.write_all(payload.as_bytes()))
        .await
        .map_err(|_| format!("向 {server} 发送查询超时"))?
        .map_err(|e| format!("向 {server} 发送查询失败: {e}"))?;
    let _ = writer.shutdown().await;

    let mut chunks: Vec<u8> = Vec::new();
    let mut buf = [0u8; 8192];
    loop {
        match timeout(READ_TIMEOUT, reader.read(&mut buf)).await {
            // 读超时视为输出结束
            Err(_) => break,
            Ok(Ok(0)) => break,
            Ok(Ok(len)) => {
                chunks.extend_from_slice(&buf[..len]);
                if chunks.len() >= MAX_BYTES {
                    break;
                }
            }
            Ok(Err(e)) => {
                if chunks.is_empty() {
                    return Err(format!("读取 {server} 响应失败: {e}"));
                }
                break;
            }
        }
    }

    if chunks.is_empty() {
        return Err(format!("{server} 未返回任何内容"));
    }
    // 部分服务器以 NUL 结尾
    while chunks.last() == Some(&0) {
        chunks.pop();
    }
    Ok(String::from_utf8_lossy(&chunks).into_owned())
}

/// Whois 查询: 自动逐级追查注册局 / 注册商信息
#[tauri::command]
pub async fn whois_query(query: String) -> Result<WhoisResult, String> {
    let target = normalize_query(&query)?;
    let kind = kind_of(&target);
    let mut server = default_server(&target).to_string();
    let mut seen: HashSet<String> = HashSet::new();
    let mut sections: Vec<WhoisSection> = Vec::new();

    loop {
        seen.insert(server.clone());
        let request = request_for(&server, &target);
        match query_server(&server, &request).await {
            Ok(text) => {
                let next = referral_of(&text).filter(|host| !seen.contains(host));
                sections.push(WhoisSection { server: server.clone(), text, note: None });
                match next {
                    Some(host) if sections.len() < MAX_HOPS => server = host,
                    _ => break,
                }
            }
            Err(err) => {
                if sections.is_empty() {
                    // 第一跳失败: 直接返回错误
                    return Err(err);
                }
                sections.push(WhoisSection { server, text: String::new(), note: Some(err) });
                break;
            }
        }
    }

    Ok(WhoisResult { query: target, kind: kind.to_string(), sections })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_domain_inputs() {
        assert_eq!(normalize_query("Example.COM").unwrap(), "example.com");
        assert_eq!(normalize_query(" example.com. ").unwrap(), "example.com");
        assert_eq!(normalize_query("https://example.com/whois").unwrap(), "example.com");
        assert_eq!(normalize_query("whois://example.com:43").unwrap(), "example.com");
        assert_eq!(normalize_query("example.com?x=1").unwrap(), "example.com");
    }

    #[test]
    fn normalizes_ip_inputs() {
        assert_eq!(normalize_query("8.8.8.8").unwrap(), "8.8.8.8");
        assert_eq!(normalize_query(" 2001:4860:4860::8888 ").unwrap(), "2001:4860:4860::8888");
        assert_eq!(kind_of("8.8.8.8"), "ipv4");
        assert_eq!(kind_of("2001:db8::1"), "ipv6");
        assert_eq!(kind_of("example.com"), "domain");
    }

    #[test]
    fn rejects_invalid_inputs() {
        assert!(normalize_query("   ").unwrap_err().contains("请输入域名或 IP"));
        assert!(normalize_query("localhost").unwrap_err().contains("域名格式不正确"));
        assert!(normalize_query("-bad.com").unwrap_err().contains("域名格式不正确"));
        assert!(normalize_query("bad-.com").unwrap_err().contains("域名格式不正确"));
        assert!(normalize_query("www.例子.中国").unwrap_err().contains("Punycode"));
    }

    #[test]
    fn picks_builtin_tld_servers() {
        assert_eq!(tld_server("example.com"), Some("whois.verisign-grs.com"));
        assert_eq!(tld_server("example.org"), Some("whois.pir.org"));
        assert_eq!(tld_server("example.com.cn"), Some("whois.cnnic.cn"));
        assert_eq!(tld_server("example.unknown-tld"), None);
        assert_eq!(default_server("example.com"), "whois.verisign-grs.com");
        assert_eq!(default_server("example.unknown-tld"), IANA_SERVER);
        assert_eq!(default_server("8.8.8.8"), IANA_SERVER);
    }

    #[test]
    fn extracts_referrals() {
        let iana = "domain: EXAMPLE.COM\nrefer:        whois.verisign-grs.com\n";
        assert_eq!(referral_of(iana).as_deref(), Some("whois.verisign-grs.com"));

        let arin = "NetRange: 8.8.8.0 - 8.8.8.255\nReferralServer: whois://whois.ripe.net\n";
        assert_eq!(referral_of(arin).as_deref(), Some("whois.ripe.net"));

        let verisign = "   Registrar WHOIS Server: whois.markmonitor.com\n";
        assert_eq!(referral_of(verisign).as_deref(), Some("whois.markmonitor.com"));

        let generic = "Whois Server: whois.gandi.net\n";
        assert_eq!(referral_of(generic).as_deref(), Some("whois.gandi.net"));

        assert_eq!(referral_of("no referral here"), None);
        assert_eq!(referral_of("refer: not-a-host"), None);
    }

    #[test]
    fn host_of_strips_scheme_port_and_path() {
        assert_eq!(host_of("whois://whois.arin.net:43").as_deref(), Some("whois.arin.net"));
        assert_eq!(host_of(" whois.nic.ad.jp. ").as_deref(), Some("whois.nic.ad.jp"));
        assert_eq!(host_of("https://whois.example.com/path"), None);
        assert_eq!(host_of("").as_deref(), None);
    }

    #[test]
    fn builds_arin_specific_requests() {
        assert_eq!(request_for("whois.arin.net", "8.8.8.8"), "n + 8.8.8.8");
        assert_eq!(request_for("whois.arin.net", "example.com"), "r + example.com");
        assert_eq!(request_for("whois.verisign-grs.com", "example.com"), "example.com");
    }
}
