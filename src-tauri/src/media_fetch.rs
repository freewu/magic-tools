//! 视频提取 (仅 Tauri 桌面端生效)
//!
//! 供「视频提取」使用, 思路与 qiaomu-download 一致: 拿到分享链接后先解析出媒体信息,
//! 再把直链保存到本地。浏览器侧受 CORS 限制无法请求各平台页面与 CDN, 因此:
//!
//! - `media_fetch`: 抓取分享页 / 平台接口 (可带 Referer), 返回 Base64 响应体, 交由前端解析
//! - `media_download`: 把解析出的直链流式写入本地文件 (带进度回调, 可取消)
//!
//! 只处理公开可访问的内容, 不带 Cookie, 不绕过登录 / 付费 / DRM 限制。

use base64::Engine as _;
use serde::Serialize;
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::ipc::Channel;

/// 单次抓取的内容大小上限 (分享页 HTML 一般 300KB 以内, 留足余量)
const MAX_BODY: u64 = 8 * 1024 * 1024;

/// 伪装桌面浏览器 UA: 部分平台对无 UA 请求返回精简页 / 直接拦截
const USER_AGENT: &str = concat!(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ",
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MagicTools"
);

/// 下载取消标记 (同一时刻只允许一个下载任务)
static CANCEL: AtomicBool = AtomicBool::new(false);

/// 抓取结果
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaResponse {
    /// HTTP 状态码
    pub status: u16,
    /// Content-Type 响应头 (前端据此判断 HTML / JSON)
    pub content_type: Option<String>,
    /// 跟随重定向后的最终地址 (短链解析结果)
    pub final_url: String,
    /// 原始响应体 (Base64)
    pub base64: String,
}

/// 下载进度 (每 256KB 推送一次)
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    /// 已写入字节数
    pub written: u64,
    /// 总字节数 (服务器未返回 Content-Length 时为 0)
    pub total: u64,
}

/// 抓取用客户端: 20 秒总超时
fn build_fetch_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("HTTP 客户端初始化失败: {e}"))
}

/// 下载用客户端: 只限制连接超时, 不限制总时长 (大文件可能下载很久)
fn build_download_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(20))
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("HTTP 客户端初始化失败: {e}"))
}

/// 把 reqwest 错误转成可读中文
fn describe_err(e: &reqwest::Error) -> String {
    if e.is_timeout() {
        "请求超时".to_string()
    } else if e.is_connect() {
        format!("无法连接服务器: {e}")
    } else {
        format!("请求失败: {e}")
    }
}

/// 校验并附加 Referer (部分 CDN 校验来源页)
fn with_referer(mut req: reqwest::RequestBuilder, referer: Option<String>) -> reqwest::RequestBuilder {
    if let Some(r) = referer {
        let r = r.trim().to_string();
        if !r.is_empty() {
            req = req.header(reqwest::header::REFERER, r);
        }
    }
    req
}

/// 抓取页面 / 接口原始内容 (仅 http/https, 自动跟随重定向)
#[tauri::command]
pub async fn media_fetch(url: String, referer: Option<String>) -> Result<MediaResponse, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("链接必须以 http:// 或 https:// 开头".to_string());
    }

    let client = build_fetch_client()?;
    let req = client
        .get(&url)
        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
        .header("Accept", "text/html,application/json,application/xhtml+xml,*/*");
    let resp = with_referer(req, referer)
        .send()
        .await
        .map_err(|e| describe_err(&e))?;

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

    // 有 Content-Length 时先按大小拦截, 避免大文件占用内存
    if let Some(len) = resp.content_length() {
        if len > MAX_BODY {
            return Err(format!("内容过大 (约 {} KB), 已超过 8MB 上限", len / 1024));
        }
    }

    let bytes = resp.bytes().await.map_err(|e| describe_err(&e))?;
    if bytes.len() as u64 > MAX_BODY {
        return Err("内容超过 8MB 上限".to_string());
    }

    Ok(MediaResponse {
        status,
        content_type,
        final_url,
        base64: base64::engine::general_purpose::STANDARD.encode(bytes),
    })
}

/// 流式下载直链到 dest (每 256KB 通过 channel 推送已写字节数)
#[tauri::command]
pub async fn media_download(
    url: String,
    referer: Option<String>,
    dest: String,
    on_progress: Channel<DownloadProgress>,
) -> Result<u64, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("下载地址必须以 http:// 或 https:// 开头".to_string());
    }
    if dest.trim().is_empty() {
        return Err("保存路径不能为空".to_string());
    }

    // 新任务开始: 复位取消标记
    CANCEL.store(false, Ordering::SeqCst);

    let client = build_download_client()?;
    let req = client.get(&url);
    let mut resp = with_referer(req, referer)
        .send()
        .await
        .map_err(|e| describe_err(&e))?;

    let status = resp.status().as_u16();
    if !(200..300).contains(&status) {
        return Err(format!("服务器返回 HTTP {status}"));
    }
    let total = resp.content_length().unwrap_or(0);

    let mut file = std::fs::File::create(&dest).map_err(|e| format!("无法创建文件 {dest}: {e}"))?;
    let mut written: u64 = 0;
    let mut reported: u64 = 0;

    loop {
        if CANCEL.load(Ordering::SeqCst) {
            drop(file);
            let _ = std::fs::remove_file(&dest);
            return Err("已取消下载".to_string());
        }

        let chunk = match resp.chunk().await {
            Ok(Some(c)) => c,
            Ok(None) => break,
            Err(e) => {
                drop(file);
                // 中断时清理半成品, 不留下坏文件
                let _ = std::fs::remove_file(&dest);
                return Err(format!("下载中断: {e}"));
            }
        };

        file.write_all(&chunk)
            .map_err(|e| format!("写入文件失败: {e}"))?;
        written += chunk.len() as u64;

        if written - reported >= 256 * 1024 {
            reported = written;
            let _ = on_progress.send(DownloadProgress { written, total });
        }
    }

    let _ = file.flush();
    drop(file);

    if written == 0 {
        let _ = std::fs::remove_file(&dest);
        return Err("下载内容为空".to_string());
    }

    let _ = on_progress.send(DownloadProgress { written, total });
    Ok(written)
}

/// 取消当前下载 (前端「取消」按钮)
#[tauri::command]
pub fn media_download_cancel() {
    CANCEL.store(true, Ordering::SeqCst);
}

