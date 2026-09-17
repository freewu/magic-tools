//! ICMP 逐跳探测引擎 (供「MTR 查询」使用)
//!
//! 只做一件小事: 向目标发送一个「带指定 TTL 的 ICMP Echo 请求」并返回应答方地址与 RTT。
//! 多轮统计 (丢包率 / 平均 / 最好 / 最差 / 抖动) 由前端编排, 每跳每轮调一次本引擎。
//!
//! 平台实现:
//! - **Windows**: 走系统 IP Helper API (`IcmpCreateFile` / `IcmpSendEcho` +
//!   `IP_OPTION_INFORMATION.Ttl`), 即系统 `ping` / `tracert` 使用的同一接口,
//!   普通用户即可收发 ICMP, **无需管理员权限**, 且能拿到 TTL 超时路由器地址。
//! - **Unix (Linux / macOS)**: 优先使用原始套接字 (需要 root 或 CAP_NET_RAW);
//!   权限不足时回退到无特权 ICMP 数据报套接字 (Linux `net.ipv4.ping_group_range`
//!   允许时可用), 此时通常收不到中间跳的 TTL 超时报文, 但目标主机仍可探测。
//!
//! 报文构造与解析均为纯函数, 便于在任意平台做单元测试。
//!
//! 其中 ICMP 报文构造 / 解析仅在 Unix 通路与单元测试中使用, Windows 上交给系统接口处理。
#![cfg_attr(windows, allow(dead_code))]

use std::fmt;
use std::net::Ipv4Addr;
use std::time::Duration;

/// 一份探测报文的有效载荷 (固定 32 字节, 内容无意义, 仅用于填充)
const PAYLOAD: [u8; 32] = [0x4d; 32];

/// 探测结果类型
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutcomeKind {
    /// 目标主机回应了 Echo Reply (已到达目的地)
    Reply,
    /// 中间路由器回应了 TTL 超时报文
    TtlExpired,
    /// 收到目标不可达 / 管理禁止等 ICMP 差错
    Unreachable,
    /// 超时无响应
    Timeout,
}

impl OutcomeKind {
    /// 前端使用的稳定标识
    pub fn as_str(self) -> &'static str {
        match self {
            OutcomeKind::Reply => "reply",
            OutcomeKind::TtlExpired => "ttlExpired",
            OutcomeKind::Unreachable => "unreachable",
            OutcomeKind::Timeout => "timeout",
        }
    }
}

impl fmt::Display for OutcomeKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

/// 单次探测结果
#[derive(Debug, Clone)]
pub struct Outcome {
    pub kind: OutcomeKind,
    /// 应答方地址 (超时为空)
    pub addr: Option<Ipv4Addr>,
    /// 往返时延 (超时为空)
    pub rtt: Option<Duration>,
    /// 平台状态码 (Windows IP_STATUS / Unix ICMP 类型), 仅用于诊断
    pub status: Option<u32>,
    /// 补充说明 (如 Windows 的错误描述)
    pub detail: Option<String>,
}

impl Outcome {
    fn new(kind: OutcomeKind, addr: Option<Ipv4Addr>, rtt: Option<Duration>) -> Self {
        Self { kind, addr, rtt, status: None, detail: None }
    }

    /// 超时结果
    pub fn timeout() -> Self {
        Self::new(OutcomeKind::Timeout, None, None)
    }

    /// 目标主机应答
    pub fn reply(addr: Ipv4Addr, rtt: Duration) -> Self {
        Self::new(OutcomeKind::Reply, Some(addr), Some(rtt))
    }

    /// 中间跳 TTL 超时
    pub fn ttl_expired(addr: Ipv4Addr, rtt: Duration) -> Self {
        Self::new(OutcomeKind::TtlExpired, Some(addr), Some(rtt))
    }

    /// 不可达等差错
    pub fn unreachable(
        addr: Option<Ipv4Addr>,
        rtt: Option<Duration>,
        detail: impl Into<String>,
    ) -> Self {
        let mut o = Self::new(OutcomeKind::Unreachable, addr, rtt);
        o.detail = Some(detail.into());
        o
    }

    /// 是否已到达目标主机
    pub fn is_reply(&self) -> bool {
        self.kind == OutcomeKind::Reply
    }
}

// ---------------------------------------------------------------------------
// 纯函数: ICMP 报文构造与解析 (可在任意平台上测试)
// ---------------------------------------------------------------------------

/// RFC 1071 反码求和校验
pub fn checksum(data: &[u8]) -> u16 {
    let mut sum: u32 = 0;
    let mut i = 0;
    while i + 1 < data.len() {
        sum += u32::from(u16::from_be_bytes([data[i], data[i + 1]]));
        i += 2;
    }
    if i < data.len() {
        sum += u32::from(data[i]) << 8;
    }
    while sum >> 16 != 0 {
        sum = (sum & 0xffff) + (sum >> 16);
    }
    !(sum as u16)
}

/// 构造 ICMP Echo 请求 (type 8), 校验和按标准计算
pub fn build_echo_request(ident: u16, seq: u16, payload: &[u8]) -> Vec<u8> {
    let mut packet = Vec::with_capacity(8 + payload.len());
    packet.push(8); // type: echo request
    packet.push(0); // code
    packet.extend_from_slice(&[0, 0]); // checksum 占位
    packet.extend_from_slice(&ident.to_be_bytes());
    packet.extend_from_slice(&seq.to_be_bytes());
    packet.extend_from_slice(payload);
    let sum = checksum(&packet);
    packet[2..4].copy_from_slice(&sum.to_be_bytes());
    packet
}

/// ICMP 解析结果 (仅含与探测相关的字段)
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedReply {
    pub kind: OutcomeKind,
    /// 应答方地址 (外层 IP 头源地址; 无 IP 头时为 None)
    pub addr: Option<Ipv4Addr>,
    /// 原始 ICMP 类型 (0 = echo reply, 11 = 超时, 3 = 不可达)
    pub icmp_type: u8,
    /// 原始 ICMP 代码 (差错报文的细分原因)
    pub icmp_code: u8,
}

/// 从 IPv4 头中取源地址
fn src_of_ipv4_header(buf: &[u8]) -> Option<Ipv4Addr> {
    if buf.len() < 20 {
        return None;
    }
    Some(Ipv4Addr::new(buf[12], buf[13], buf[14], buf[15]))
}

/// 解析收到的 ICMP 报文 (兼容带 / 不带外层 IPv4 头两种情况)
///
/// 只认属于本次探测 (ident + seq 匹配) 的报文, 其它返回 None 由调用方继续读取。
pub fn parse_icmp_v4(buf: &[u8], ident: u16, seq: u16) -> Option<ParsedReply> {
    // 原始套接字会带上外层 IPv4 头 (首字节高 4 位 = 4), 数据报套接字可能不带
    let (icmp, outer_addr) = match buf.first() {
        Some(b) if b >> 4 == 4 => {
            let ihl = usize::from(b & 0x0f) * 4;
            if ihl < 20 || buf.len() < ihl + 8 {
                return None;
            }
            (&buf[ihl..], src_of_ipv4_header(buf))
        }
        _ => (buf, None),
    };

    if icmp.len() < 8 {
        return None;
    }
    let icmp_type = icmp[0];
    let icmp_code = icmp[1];
    match icmp_type {
        // Echo Reply: 直接比对 ident / seq
        0 => {
            if read_u16(icmp, 4) == Some(ident) && read_u16(icmp, 6) == Some(seq) {
                Some(ParsedReply {
                    kind: OutcomeKind::Reply,
                    addr: outer_addr,
                    icmp_type,
                    icmp_code,
                })
            } else {
                None
            }
        }
        // Time Exceeded (11) / Dest Unreachable (3): 内嵌原始 IP 头 + 8 字节原始 ICMP 头
        11 | 3 => {
            let inner = icmp.get(8..)?;
            let inner_ihl = match inner.first() {
                Some(b) if b >> 4 == 4 => usize::from(b & 0x0f) * 4,
                _ => 20,
            };
            let inner_icmp = inner.get(inner_ihl..)?;
            if read_u16(inner_icmp, 4) != Some(ident) || read_u16(inner_icmp, 6) != Some(seq) {
                return None;
            }
            let kind = if icmp_type == 11 {
                OutcomeKind::TtlExpired
            } else {
                OutcomeKind::Unreachable
            };
            Some(ParsedReply { kind, addr: outer_addr, icmp_type, icmp_code })
        }
        _ => None,
    }
}

fn read_u16(buf: &[u8], at: usize) -> Option<u16> {
    let hi = *buf.get(at)?;
    let lo = *buf.get(at + 1)?;
    Some(u16::from_be_bytes([hi, lo]))
}

// ---------------------------------------------------------------------------
// Windows: 系统 IP Helper API (无需管理员权限)
// ---------------------------------------------------------------------------

#[cfg(windows)]
mod platform {
    use super::*;
    use std::mem::{size_of, zeroed};
    use std::time::Instant;
    use windows_sys::Win32::Foundation::{GetLastError, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::NetworkManagement::IpHelper::{
        IcmpCloseHandle, IcmpCreateFile, IcmpSendEcho, ICMP_ECHO_REPLY, IP_OPTION_INFORMATION,
        IP_DEST_HOST_UNREACHABLE, IP_DEST_NET_UNREACHABLE, IP_DEST_PORT_UNREACHABLE,
        IP_DEST_PROHIBITED, IP_REQ_TIMED_OUT, IP_SUCCESS, IP_TTL_EXPIRED_TRANSIT,
    };

    /// `Ipv4Addr` 内部即网络字节序, 这里按本机字节序取 u32, 与 IcmpSendEcho 的
    /// network byte order 参数约定一致 (参照 winping crate 的 transmute 做法)
    fn ip_to_u32(ip: Ipv4Addr) -> u32 {
        u32::from_ne_bytes(ip.octets())
    }

    fn u32_to_ip(v: u32) -> Ipv4Addr {
        Ipv4Addr::from(v.to_ne_bytes())
    }

    /// 状态码 -> 说明文案
    fn status_detail(status: u32) -> String {
        match status {
            IP_SUCCESS => "成功".to_string(),
            IP_TTL_EXPIRED_TRANSIT => "TTL 超时".to_string(),
            IP_REQ_TIMED_OUT => "请求超时".to_string(),
            IP_DEST_NET_UNREACHABLE => "目标网络不可达".to_string(),
            IP_DEST_HOST_UNREACHABLE => "目标主机不可达".to_string(),
            IP_DEST_PORT_UNREACHABLE => "目标端口不可达".to_string(),
            IP_DEST_PROHIBITED => "目标被禁止访问".to_string(),
            other => format!("ICMP 状态码 {other}"),
        }
    }

    pub fn probe(dest: Ipv4Addr, ttl: u8, timeout: Duration) -> Result<Outcome, String> {
        let timeout_ms = timeout.as_millis().clamp(1, u128::from(u32::MAX)) as u32;
        let payload = PAYLOAD;
        // 回复缓冲区: ICMP_ECHO_REPLY + ICMP 差错 (8) + IO_STATUS_BLOCK (16) + 载荷
        let reply_size = size_of::<ICMP_ECHO_REPLY>() + 24 + payload.len();
        // Vec<u64> 保证 8 字节对齐 (ICMP_ECHO_REPLY 内部含指针)
        let mut buf = vec![0u64; reply_size.div_ceil(8)];

        unsafe {
            let handle = IcmpCreateFile();
            if handle == INVALID_HANDLE_VALUE {
                return Err(format!(
                    "ICMP 句柄创建失败 (错误码 {}), 请尝试以管理员身份运行",
                    GetLastError()
                ));
            }

            let mut options: IP_OPTION_INFORMATION = zeroed();
            options.Ttl = ttl;

            let started = Instant::now();
            let count = IcmpSendEcho(
                handle,
                ip_to_u32(dest),
                payload.as_ptr().cast(),
                payload.len() as u16,
                &options,
                buf.as_mut_ptr().cast(),
                (buf.len() * 8) as u32,
                timeout_ms,
            );
            let elapsed = started.elapsed();
            let last_error = if count == 0 { Some(GetLastError()) } else { None };
            IcmpCloseHandle(handle);

            if count == 0 {
                let code = last_error.unwrap_or(0);
                return Ok(match code {
                    IP_REQ_TIMED_OUT => Outcome::timeout(),
                    other => {
                        let mut o = Outcome::unreachable(None, Some(elapsed), status_detail(other));
                        o.status = Some(other);
                        o
                    }
                });
            }

            // 缓冲区由 Vec<u64> 支撑, 对齐已知, 这里直接按结构体读取
            let reply: ICMP_ECHO_REPLY = std::ptr::read_unaligned(buf.as_ptr().cast());
            let status = reply.Status;
            // RoundTripTime 由系统提供 (毫秒), 比本机计时更准确
            let rtt = Duration::from_millis(u64::from(reply.RoundTripTime));
            let addr = u32_to_ip(reply.Address);
            let mut outcome = match status {
                IP_SUCCESS => Outcome::reply(addr, rtt),
                IP_TTL_EXPIRED_TRANSIT => Outcome::ttl_expired(addr, rtt),
                IP_REQ_TIMED_OUT => Outcome::timeout(),
                other => Outcome::unreachable(Some(addr), Some(rtt), status_detail(other)),
            };
            outcome.status = Some(status);
            Ok(outcome)
        }
    }
}

// ---------------------------------------------------------------------------
// Unix (Linux / macOS): 原始套接字, 权限不足时回退到数据报套接字
// ---------------------------------------------------------------------------

#[cfg(unix)]
mod platform {
    use super::*;
    use std::io::ErrorKind;
    use std::mem::MaybeUninit;
    use std::net::{IpAddr, SocketAddr};
    use std::sync::atomic::{AtomicU16, Ordering};
    use std::time::Instant;
    use socket2::{Domain, Protocol, SockAddr, Socket, Type};

    /// 探测序号 (用于匹配回包, 避免把上一轮的迟到回包算进来)
    static SEQ: AtomicU16 = AtomicU16::new(0);

    /// 打开套接字: 原始套接字优先 (可收到中间跳差错), 无权限时回退到数据报套接字
    fn open_socket() -> Result<(Socket, bool), String> {
        match Socket::new(Domain::IPV4, Type::RAW, Some(Protocol::ICMPV4)) {
            Ok(s) => Ok((s, true)),
            Err(raw_err) => {
                if raw_err.kind() != ErrorKind::PermissionDenied {
                    return Err(format!("ICMP 套接字创建失败: {raw_err}"));
                }
                let s = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::ICMPV4)).map_err(
                    |dgram_err| {
                        format!(
                            "ICMP 探测需要 root / CAP_NET_RAW 权限 (原始套接字: {raw_err}; \
                             无特权套接字: {dgram_err})"
                        )
                    },
                )?;
                Ok((s, false))
            }
        }
    }

    /// ICMP 类型 -> 说明文案
    fn icmp_detail(icmp_type: u8, code: u8) -> String {
        match icmp_type {
            11 => "TTL 超时".to_string(),
            3 => match code {
                0 => "目标网络不可达".to_string(),
                1 => "目标主机不可达".to_string(),
                2 => "协议不可达".to_string(),
                3 => "目标端口不可达".to_string(),
                9 | 10 | 13 => "目标被管理策略禁止".to_string(),
                other => format!("目标不可达 (code {other})"),
            },
            other => format!("ICMP 类型 {other}"),
        }
    }

    pub fn probe(dest: Ipv4Addr, ttl: u8, timeout: Duration) -> Result<Outcome, String> {
        let (socket, privileged) = open_socket()?;
        socket.set_ttl_v4(u32::from(ttl)).map_err(|e| format!("设置 TTL 失败: {e}"))?;

        let ident = std::process::id() as u16;
        let seq = SEQ.fetch_add(1, Ordering::Relaxed);
        let packet = build_echo_request(ident, seq, &PAYLOAD);
        let target = SockAddr::from(SocketAddr::new(IpAddr::V4(dest), 0));

        let started = Instant::now();
        socket.send_to(&packet, &target).map_err(|e| format!("发送探测报文失败: {e}"))?;

        // 无特权 (数据报) 套接字由内核重写 ICMP 标识为套接字端口, 这里以实际值为准
        let expect_ident = if privileged {
            ident
        } else {
            socket
                .local_addr()
                .ok()
                .and_then(|a| a.as_socket_ipv4().map(|s| s.port()))
                .unwrap_or(ident)
        };

        let mut buf = [MaybeUninit::<u8>::zeroed(); 2048];
        loop {
            let remaining = timeout.saturating_sub(started.elapsed());
            if remaining.is_zero() {
                return Ok(Outcome::timeout());
            }
            socket
                .set_read_timeout(Some(remaining))
                .map_err(|e| format!("设置读取超时失败: {e}"))?;

            let (len, from) = match socket.recv_from(&mut buf) {
                Ok(v) => v,
                Err(e)
                    if matches!(e.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) =>
                {
                    return Ok(Outcome::timeout())
                }
                Err(e) => return Err(format!("读取探测应答失败: {e}")),
            };

            // SAFETY: recv_from 已初始化前 len 个字节
            let data = unsafe { std::slice::from_raw_parts(buf.as_ptr().cast::<u8>(), len) };
            let parsed = match parse_icmp_v4(data, expect_ident, seq) {
                Some(p) => p,
                None => continue,
            };

            let rtt = started.elapsed();
            let from_ip = from.as_socket_ipv4().map(|s| *s.ip()).or(parsed.addr);
            let mut outcome = match parsed.kind {
                OutcomeKind::Reply => match from_ip {
                    Some(addr) => Outcome::reply(addr, rtt),
                    None => Outcome::reply(dest, rtt),
                },
                OutcomeKind::TtlExpired => match from_ip {
                    Some(addr) => Outcome::ttl_expired(addr, rtt),
                    None => Outcome::timeout(),
                },
                OutcomeKind::Unreachable => Outcome::unreachable(
                    from_ip,
                    Some(rtt),
                    icmp_detail(parsed.icmp_type, parsed.icmp_code),
                ),
                OutcomeKind::Timeout => Outcome::timeout(),
            };
            outcome.status = Some(u32::from(parsed.icmp_type));
            return Ok(outcome);
        }
    }
}

/// 单次 ICMP 探测: 向 `dest` 发送 TTL 为 `ttl` 的 Echo 请求, 等待 `timeout`
///
/// 返回 `Err` 表示环境问题 (无权限 / 句柄创建失败等), 返回 `Ok(Outcome::Timeout)`
/// 表示正常发出但没有应答。
pub fn probe_v4(dest: Ipv4Addr, ttl: u8, timeout: Duration) -> Result<Outcome, String> {
    if ttl == 0 {
        return Err("TTL 必须大于 0".to_string());
    }
    platform::probe(dest, ttl, timeout)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn checksum_matches_rfc1071_example() {
        // RFC 1071 中的示例数据
        let data = [0x00u8, 0x01, 0xf2, 0x03, 0xf4, 0xf5, 0xf6, 0xf7];
        assert_eq!(checksum(&data), 0x220d);
    }

    #[test]
    fn checksum_of_zeros_is_all_ones() {
        assert_eq!(checksum(&[0u8; 8]), 0xffff);
    }

    #[test]
    fn checksum_handles_odd_length() {
        // 奇数长度时末尾字节按高 8 位补零
        assert_eq!(checksum(&[0x01]), !0x0100u16);
    }

    #[test]
    fn build_echo_request_layout_and_checksum() {
        let packet = build_echo_request(0x1234, 0x0007, &[0xaa, 0xbb]);
        assert_eq!(packet.len(), 8 + 2);
        assert_eq!(packet[0], 8);
        assert_eq!(packet[1], 0);
        assert_eq!(&packet[4..6], &[0x12, 0x34]);
        assert_eq!(&packet[6..8], &[0x00, 0x07]);
        assert_eq!(&packet[8..], &[0xaa, 0xbb]);
        // 含校验和整包再校验应为 0
        assert_eq!(checksum(&packet), 0);
    }

    /// 构造一个带外层 IPv4 头的 Echo Reply
    fn echo_reply_frame(src: Ipv4Addr, ident: u16, seq: u16) -> Vec<u8> {
        let mut frame = vec![0x45, 0, 0, 0, 0, 0, 0, 0, 64, 1, 0, 0];
        frame.extend_from_slice(&src.octets());
        frame.extend_from_slice(&[10, 0, 0, 1]);
        frame.push(0); // type 0: echo reply
        frame.push(0); // code
        frame.extend_from_slice(&[0, 0]);
        frame.extend_from_slice(&ident.to_be_bytes());
        frame.extend_from_slice(&seq.to_be_bytes());
        frame
    }

    /// 构造一个带外层 IPv4 头 + 内嵌原始报文的差错包
    fn error_frame(src: Ipv4Addr, icmp_type: u8, code: u8, ident: u16, seq: u16) -> Vec<u8> {
        let mut inner = vec![0x45, 0, 0, 60, 0, 0, 0, 0, 63, 1, 0, 0];
        inner.extend_from_slice(&[10, 0, 0, 1]);
        inner.extend_from_slice(&[8, 8, 8, 8]);
        inner.push(8); // 内嵌的 echo request
        inner.push(0);
        inner.extend_from_slice(&[0, 0]);
        inner.extend_from_slice(&ident.to_be_bytes());
        inner.extend_from_slice(&seq.to_be_bytes());

        let mut frame = vec![0x45, 0, 0, 0, 0, 0, 0, 0, 63, 1, 0, 0];
        frame.extend_from_slice(&src.octets());
        frame.extend_from_slice(&[10, 0, 0, 1]);
        frame.push(icmp_type);
        frame.push(code);
        frame.extend_from_slice(&[0, 0]);
        frame.extend_from_slice(&[0, 0, 0, 0]);
        frame.extend_from_slice(&inner);
        frame
    }

    #[test]
    fn parse_echo_reply_with_ip_header() {
        let src = Ipv4Addr::new(93, 184, 216, 34);
        let frame = echo_reply_frame(src, 0xabcd, 0x0003);
        let parsed = parse_icmp_v4(&frame, 0xabcd, 0x0003).expect("应能解析出应答");
        assert_eq!(parsed.kind, OutcomeKind::Reply);
        assert_eq!(parsed.icmp_type, 0);
        assert_eq!(parsed.addr, Some(src));
    }

    #[test]
    fn parse_echo_reply_without_ip_header() {
        let mut frame = vec![0, 0, 0, 0];
        frame.extend_from_slice(&0x0011u16.to_be_bytes());
        frame.extend_from_slice(&0x0022u16.to_be_bytes());
        let parsed = parse_icmp_v4(&frame, 0x0011, 0x0022).expect("应能解析出应答");
        assert_eq!(parsed.kind, OutcomeKind::Reply);
        assert_eq!(parsed.addr, None);
    }

    #[test]
    fn parse_echo_reply_ignores_other_sequence() {
        let frame = echo_reply_frame(Ipv4Addr::LOCALHOST, 0xabcd, 9);
        assert!(parse_icmp_v4(&frame, 0xabcd, 3).is_none());
        assert!(parse_icmp_v4(&frame, 0x0001, 9).is_none());
    }

    #[test]
    fn parse_time_exceeded_returns_router_address() {
        let router = Ipv4Addr::new(192, 168, 1, 1);
        let frame = error_frame(router, 11, 0, 0x00ff, 0x0042);
        let parsed = parse_icmp_v4(&frame, 0x00ff, 0x0042).expect("应能解析出超时报文");
        assert_eq!(parsed.kind, OutcomeKind::TtlExpired);
        assert_eq!(parsed.addr, Some(router));
    }

    #[test]
    fn parse_unreachable_returns_kind() {
        let gw = Ipv4Addr::new(10, 0, 0, 254);
        let frame = error_frame(gw, 3, 1, 0x00ff, 0x0043);
        let parsed = parse_icmp_v4(&frame, 0x00ff, 0x0043).expect("应能解析出不可达报文");
        assert_eq!(parsed.kind, OutcomeKind::Unreachable);
    }

    #[test]
    fn parse_error_ignores_other_probe() {
        let frame = error_frame(Ipv4Addr::new(1, 1, 1, 1), 11, 0, 0x0102, 7);
        assert!(parse_icmp_v4(&frame, 0x0103, 7).is_none());
        assert!(parse_icmp_v4(&frame, 0x0102, 8).is_none());
    }

    #[test]
    fn parse_ignores_truncated_and_unknown_packets() {
        assert!(parse_icmp_v4(&[], 1, 1).is_none());
        assert!(parse_icmp_v4(&[0x45, 0, 0], 1, 1).is_none());
        // 未知 ICMP 类型 (如 echo request) 不匹配
        let frame = [8u8, 0, 0, 0, 0, 1, 0, 1];
        assert!(parse_icmp_v4(&frame, 1, 1).is_none());
    }

    #[test]
    fn probe_rejects_zero_ttl() {
        let err = probe_v4(Ipv4Addr::LOCALHOST, 0, Duration::from_millis(100));
        assert!(err.is_err());
    }

    #[test]
    fn outcome_kind_strings_are_stable() {
        assert_eq!(OutcomeKind::Reply.as_str(), "reply");
        assert_eq!(OutcomeKind::TtlExpired.to_string(), "ttlExpired");
        assert_eq!(OutcomeKind::Unreachable.as_str(), "unreachable");
        assert_eq!(OutcomeKind::Timeout.as_str(), "timeout");
        assert!(Outcome::reply(Ipv4Addr::LOCALHOST, Duration::from_millis(1)).is_reply());
        assert!(!Outcome::timeout().is_reply());
    }

    /// 真实探测本机回环地址: 验证平台实现确实能收发 ICMP
    #[cfg(any(windows, target_os = "linux", target_os = "macos"))]
    #[test]
    fn probe_loopback_reaches_target() {
        let outcome = probe_v4(Ipv4Addr::LOCALHOST, 64, Duration::from_millis(800))
            .expect("本机 ICMP 探测不应因环境问题失败");
        // 回环地址必然可达; 若 CI 环境屏蔽了 ICMP 则跳过断言, 不阻塞构建
        if outcome.kind != OutcomeKind::Timeout {
            assert_eq!(outcome.kind, OutcomeKind::Reply, "回环探测应得到应答: {outcome:?}");
            assert!(outcome.rtt.is_some());
        }
    }
}

