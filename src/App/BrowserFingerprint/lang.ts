// BrowserFingerprint 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "瀏覽器指紋" },
  en: { appName: "Browser Fingerprint" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed — please select and copy manually'],
  '计算失败: {msg}': ['計算失敗: {msg}', 'Computation failed: {msg}'],
  '浏览器指纹': ['瀏覽器指紋', 'Browser Fingerprint'],
  '在本页分别计算 ': ['在本頁分別計算 ', 'On this page we compute '],
  'Canvas / WebGL / 音频': ['Canvas / WebGL / 音訊', 'Canvas / WebGL / Audio'],
  ' 三类指纹并给出对应的可直接复制的 JS 实现。': [' 三類指紋並提供對應可直接複製的 JS 實作。', ' fingerprints and show copy-ready JS implementations for each.'],
  '指纹常用于无感设备识别：同机不同浏览器、同浏览器不同版本、隐身模式等都可能产生不同哈希。': ['指紋常用於無感設備識別：同機不同瀏覽器、同瀏覽器不同版本、無痕模式等都可能產生不同雜湊。', 'Fingerprints are often used for silent device recognition: the same machine on another browser, another browser version, or in private mode may produce different hashes.'],
  '隐私提示:': ['隱私提示:', 'Privacy note:'],
  '请勿在未告知用户的站点中擅自采集并跨站关联指纹，合规用途请先取得用户同意。': ['請勿在未告知使用者的網站中擅自蒐集並跨站關聯指紋，合規用途請先取得使用者同意。', 'Do not collect or cross-site correlate fingerprints without telling the user; obtain consent before any compliant use.'],
  '运行结果': ['運行結果', 'Results'],
  '重新计算全部': ['重新計算全部', 'Re-run all'],
  '复制': ['複製', 'Copy'],
  '不可用': ['不可用', 'Unavailable'],
  '已生成': ['已生成', 'Generated'],
  '计算中…': ['計算中…', 'Computing…'],
  '查看 JS 实现': ['查看 JS 實作', 'View JS implementation'],
  '复制完整代码': ['複製完整程式碼', 'Copy full code'],
  '指纹稳定性说明': ['指紋穩定性說明', 'About fingerprint stability'],
  '三类指纹相加（含 UA、语言、时区、屏幕分辨率等）即构成强标识；WebGL 渲染器与音频指纹在部分系统升级/驱动更新后会变化，Canvas 指纹则相对稳定。本页计算的哈希仅作特征演示，不采集、不存储、不上传任何数据。': ['三類指紋相加（含 UA、語言、時區、螢幕解析度等）即構成強識別；WebGL 渲染器與音訊指紋在部分系統升級/驅動更新後會變化，Canvas 指紋則相對穩定。本頁計算的雜湊僅作特徵展示，不蒐集、不儲存、不上傳任何資料。', 'All three fingerprints combined (plus UA, language, timezone, screen resolution, …) form a strong identifier; the WebGL renderer and audio fingerprints may change after OS upgrades / driver updates, while Canvas tends to stay stable. The hashes computed here are only demos — nothing is collected, stored or uploaded.'],
  '浏览器将文字/图形光栅化后各平台抗锯齿与字体渲染存在细微差异，同一脚本在不同设备输出的像素不同——这是区分度最高的指纹之一。': ['瀏覽器將文字/圖形光柵化後，各平台抗鋸齒與字型渲染存在細微差異，同一腳本在不同裝置輸出的像素不同——這是區分度最高的指紋之一。', 'After the browser rasterizes text/graphics, anti-aliasing and font rendering differ subtly across platforms, so the same script yields different pixels on different devices — one of the most distinctive fingerprints.'],
  '通过 GPU 渲染上下文读取显卡厂商与渲染器标识（可被隐私模式伪装），并结合支持的扩展数量与渲染参数生成指纹。': ['透過 GPU 渲染上下文讀取顯示卡廠商與渲染器識別（可被無痕模式偽裝），並結合支援的擴充數量與渲染參數產生指紋。', 'Reads GPU vendor and renderer identifiers from a WebGL context (spoofable in private mode) and fingerprints the device by them plus the number of supported extensions and rendering parameters.'],
  '利用 OfflineAudioContext 离线合成音频信号，各浏览器的音频处理管线（重采样、压缩器实现）会让输出样本产生微小但稳定的差异。': ['利用 OfflineAudioContext 離線合成音訊訊號，各瀏覽器的音訊處理管線（重取樣、壓縮器實作）會讓輸出樣本產生微小但穩定的差異。', 'Uses OfflineAudioContext to synthesize audio offline; each browser’s audio pipeline (resampling, compressor implementation) produces small yet stable differences in the output samples.'],
  'Canvas 指纹': ['Canvas 指紋', 'Canvas fingerprint'],
  'WebGL 指纹': ['WebGL 指紋', 'WebGL fingerprint'],
  '音频指纹': ['音訊指紋', 'Audio fingerprint'],
  '秒': ['秒', 'seconds'],
  '输入': ['輸入', 'Input'],
  '值': ['值', 'Value'],
  '来源': ['來源', 'Source'],
  '是': ['是', 'Yes'],
  '生成': ['產生', 'Generate'],
  '平台': ['平台', 'Platform'],
  '浏览器': ['瀏覽器', 'Browser'],
};

// 取词: 无命中回退 zh 原文 (与共享 webmaster-lang 行为一致)
export const wm = (locale: string, zh: string): string => {
  const e = webmasterlangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const wmT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = wm(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};

