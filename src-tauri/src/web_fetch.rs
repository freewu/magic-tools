//! 网页抓取 (仅 Tauri 桌面端生效)
//!
//! 供「网页 TDK 信息检测」使用: 网页侧直接 fetch 外部站点会受到浏览器 CORS
//! 限制, 这里在 Rust 侧发起 HTTP 请求, 绕过跨域问题。
//!
//! 返回原始响应体的 Base64 (字符集可能为 GBK/GB2312 等, 交由前端探测解码),
//! 内容上限 3MB。

use base64::Engine as _;
use serde::Serialize;

/// 内容大小上限
const MAX_BODY: u64 = 3 * 1024 * 1024;

/// 伪装浏览器 UA, 避免部分站点拦截无 UA / 默认 UA 的请求
const USER_AGENT: &str = concat!(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ",
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MagicTools"
);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchedPage {
    /// HTTP 状态码
    pub status: u16,
    /// Content-Type 响应头 (可用于字符集探测)
    pub content_type: Option<String>,
    /// 重定向后的最终地址
    pub final_url: String,
    /// 原始响应体 (Base64)
    pub base64: String,
}

/// 抓取网页源码 (仅 http/https, 自动跟随重定向, 20 秒超时)
#[tauri::command]
pub async fn fetch_url_body(url: String) -> Result<FetchedPage, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("网址必须以 http:// 或 https:// 开头".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("HTTP 客户端初始化失败: {e}"))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "请求超时 (20 秒)".to_string()
            } else if e.is_connect() {
                format!("无法连接服务器: {e}")
            } else {
                format!("请求失败: {e}")
            }
        })?;

    let status = resp.status().as_u16();
    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let final_url = resp.url().to_string();

    if !(200..300).contains(&status) {
        return Err(format!("服务器返回 HTTP {status}"));
    }

    // 有 Content-Length 时先按大小拦截, 避免大页面占用过多内存
    if let Some(len) = resp.content_length() {
        if len > MAX_BODY {
            return Err(format!("页面过大 (约 {} KB), 已超过 3MB 上限", len / 1024));
        }
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("读取页面内容失败: {e}"))?;

    if bytes.len() as u64 > MAX_BODY {
        return Err("页面内容超过 3MB 上限".to_string());
    }

    Ok(FetchedPage {
        status,
        content_type,
        final_url,
        base64: base64::engine::general_purpose::STANDARD.encode(bytes),
    })
}
