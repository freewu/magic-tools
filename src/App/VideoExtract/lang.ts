// VideoExtract 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '影片提取' },
  en: { appName: 'Video Extractor' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const videoExtractRows: Record<string, [string, string]> = {
  // 页面 / 按钮
  '提取': ['提取', 'Extract'],
  '下载': ['下載', 'Download'],
  '取消': ['取消', 'Cancel'],
  '复制直链': ['複製直鏈', 'Copy link'],
  '复制页面链接': ['複製頁面連結', 'Copy page link'],
  '打开': ['開啟', 'Open'],
  '打开原页面': ['開啟原頁面', 'Open source page'],
  '识别平台: {name}': ['識別平台: {name}', 'Platform: {name}'],
  '作者: {v}': ['作者: {v}', 'Author: {v}'],
  '时长: {v}': ['時長: {v}', 'Duration: {v}'],
  '直链数: {v}': ['直鏈數: {v}', 'Direct links: {v}'],
  '该平台暂不支持自动解析': ['該平台暫不支援自動解析', 'Automatic parsing is not supported for this platform yet'],
  '作者': ['作者', 'Author'],
  '时长': ['時長', 'Duration'],
  '直链数': ['直鏈數', 'Direct links'],
  '类型': ['類型', 'Type'],
  '清晰度': ['清晰度', 'Quality'],
  '编码': ['編碼', 'Codec'],
  '体积': ['大小', 'Size'],
  '格式': ['格式', 'Format'],
  '说明': ['說明', 'Note'],
  '操作': ['操作', 'Actions'],
  '视频': ['影片', 'Video'],
  '音频': ['音訊', 'Audio'],
  '音视频': ['影音', 'Muxed'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],

  // 输入 / 提示
  '粘贴视频分享链接 (或整段分享文案), 自动解析出无水印直链并下载': ['貼上影片分享連結 (或整段分享文案), 自動解析出無水印直鏈並下載', 'Paste a video share link (or the whole share text) to parse watermark-free direct links and download'],
  '支持 B 站 / 抖音 / TikTok / 小红书 / 微博 / X (Twitter) / Vimeo / YouTube / 通用网页; 仅处理公开内容, 不绕过登录、付费与 DRM': ['支援 B 站 / 抖音 / TikTok / 小紅書 / 微博 / X (Twitter) / Vimeo / YouTube / 一般網頁; 僅處理公開內容, 不繞過登入、付費與 DRM', 'Supports Bilibili / Douyin / TikTok / Xiaohongshu / Weibo / X (Twitter) / Vimeo / YouTube / generic pages; public content only, login, paywalls and DRM are never bypassed'],
  '粘贴分享链接或分享文案, 如 https://v.douyin.com/xxxxxx/': ['貼上分享連結或分享文案, 如 https://v.douyin.com/xxxxxx/', 'Paste a share link or share text, e.g. https://v.douyin.com/xxxxxx/'],
  '粘贴链接后点击「提取」: 先识别平台, 再从分享页里解析出标题、封面与可直接保存的媒体直链': ['貼上連結後點擊「提取」: 先識別平台, 再從分享頁裡解析出標題、封面與可直接儲存的媒體直鏈', 'Paste a link and click "Extract": the platform is detected first, then the title, cover and directly saveable media links are parsed from the share page'],
  '暂不支持: 快手 / 微信视频号 (接口不公开); 这类链接可改用 yt-dlp (qiaomu-download) 下载': ['暫不支援: 快手 / 微信影音號 (介面不公開); 這類連結可改用 yt-dlp (qiaomu-download) 下載', 'Not supported: Kuaishou / WeChat Channels (their APIs are not public); use yt-dlp (qiaomu-download) for those links'],
  '请先粘贴视频分享链接或分享文案': ['請先貼上影片分享連結或分享文案', 'Paste a video share link or the share text first'],
  '链接必须以 http:// 或 https:// 开头': ['連結必須以 http:// 或 https:// 開頭', 'The link must start with http:// or https://'],
  '暂不支持 {name} 的自动解析 (平台接口不公开), 可改用 yt-dlp 下载': ['暫不支援 {name} 的自動解析 (平台介面不公開), 可改用 yt-dlp 下載', 'Automatic parsing is not available for {name} (its API is not public); use yt-dlp instead'],
  '解析失败': ['解析失敗', 'Parsing failed'],
  '解析失败: {msg}': ['解析失敗: {msg}', 'Parsing failed: {msg}'],
  '没有解析到直链, 详见下方提示': ['沒有解析到直鏈, 詳見下方提示', 'No direct link was found — see the notes below'],
  '解析成功: 共 {n} 条直链': ['解析成功: 共 {n} 條直鏈', 'Parsed: {n} direct links'],
  '请等待当前下载完成, 或先点「取消」': ['請等待目前下載完成, 或先點「取消」', 'Wait for the current download to finish, or click "Cancel" first'],
  '已保存: {size}': ['已儲存: {size}', 'Saved: {size}'],
  '下载失败: {msg}': ['下載失敗: {msg}', 'Download failed: {msg}'],
  '已取消下载': ['已取消下載', 'Download cancelled'],
  '已下载 {a} / {b}': ['已下載 {a} / {b}', 'Downloaded {a} / {b}'],
  '已下载 {a}': ['已下載 {a}', 'Downloaded {a}'],

  // 桌面版提示
  '该功能仅在桌面应用中可用': ['該功能僅在桌面應用程式可用', 'This feature is only available in the desktop app'],
  '下载桌面版': ['下載桌面版', 'Download desktop app'],
  '浏览器演示版受 CORS 限制, 无法请求各平台页面与 CDN; 桌面版 (Tauri) 无此限制, 还支持带进度的本地下载': ['瀏覽器示範版受 CORS 限制, 無法請求各平台頁面與 CDN; 桌面版 (Tauri) 無此限制, 還支援帶進度的本地下載', 'The browser demo is blocked by CORS from requesting platform pages and CDNs; the desktop (Tauri) build has no such limit and supports local downloads with progress'],

  // 流说明 / 告警 (由解析层给出)
  'DASH 视频轨': ['DASH 視訊軌', 'DASH video track'],
  'DASH 音轨': ['DASH 音訊軌', 'DASH audio track'],
  '音视频合流': ['影音合流', 'Muxed audio + video'],
  '原始画质': ['原始畫質', 'Original quality'],
  '仅视频轨 (无声音)': ['僅視訊軌 (無聲音)', 'Video track only (no audio)'],
  '页面通用识别': ['頁面通用識別', 'Detected from page markup'],
  'HLS 分片列表, 需播放器或 ffmpeg 处理': ['HLS 分片清單, 需播放器或 ffmpeg 處理', 'HLS playlist — needs a player or ffmpeg'],
  'B 站高清画质使用 DASH 音视频分离, 单独下载后需用 ffmpeg 合并成完整视频': ['B 站高畫質使用 DASH 影音分離, 單獨下載後需用 ffmpeg 合併成完整影片', 'Bilibili delivers HD as separate DASH video/audio tracks; merge them with ffmpeg after downloading'],
  '页面里没有播放地址: 番剧 / 付费 / 需要登录的视频无法直接提取, 可改用 yt-dlp 配合浏览器 Cookie': ['頁面裡沒有播放位址: 番劇 / 付費 / 需要登入的影片無法直接提取, 可改用 yt-dlp 配合瀏覽器 Cookie', 'No playable address in the page: bangumi, paid or login-only videos cannot be extracted directly — use yt-dlp with browser cookies'],
  '该推文里没有视频 (只有图片 / 纯文字), 或已被删除 / 需要登录': ['該推文裡沒有影片 (只有圖片 / 純文字), 或已被刪除 / 需要登入', 'This post has no video (images or text only), or it was deleted / requires login'],
  '没解析出播放地址: 平台可能已改版, 或该内容需要登录 / 验证码; 可用 yt-dlp 配合浏览器 Cookie 尝试': ['沒解析出播放位址: 平台可能已改版, 或該內容需要登入 / 驗證碼; 可用 yt-dlp 配合瀏覽器 Cookie 嘗試', 'No playable address found: the platform may have changed, or the content needs login / captcha — try yt-dlp with browser cookies'],
  'YouTube 播放地址需要签名解密, 内置解析拿不到直链; 建议用 yt-dlp (qiaomu-download) 下载': ['YouTube 播放位址需要簽章解密, 內建解析拿不到直鏈; 建議用 yt-dlp (qiaomu-download) 下載', 'YouTube addresses need signature deciphering, which the built-in parser cannot do; use yt-dlp (qiaomu-download) instead'],
  '未找到直链: 付费 / 隐私视频需要登录, 无法直接提取': ['未找到直鏈: 付費 / 隱私影片需要登入, 無法直接提取', 'No direct link: paid or private videos require login and cannot be extracted'],
  '没在页面里找到 mp4 直链: 可能需要登录或视频已失效': ['沒在頁面裡找到 mp4 直鏈: 可能需要登入或影片已失效', 'No mp4 link was found in the page: login may be required, or the video is gone'],
  '页面里没有找到视频直链; 内嵌播放器 / 加密流需要 yt-dlp 等专门工具处理': ['頁面裡沒有找到影片直鏈; 內嵌播放器 / 加密流需要 yt-dlp 等專門工具處理', 'No video link was found in the page; embedded players or encrypted streams need a dedicated tool such as yt-dlp'],

  // 帮助区标题
  '视频提取说明': ['影片提取說明', 'About video extraction'],
};

// 取词: 无命中回退 zh 原文
export const vx = (locale: string, zh: string): string => {
  const e = videoExtractRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};

// 取词 + 变量替换 ({name} 形式)
export const vxT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = vx(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
