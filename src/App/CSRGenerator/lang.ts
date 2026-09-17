// CSRGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'CSR 申請檔案' },
  en: { appName: 'CSR Generator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const csRows: Record<string, [string, string]> = {
  // 表单字段 (data.ts SUBJECT_FIELDS)
  '通用名称 (CN)': ['通用名稱 (CN)', 'Common Name (CN)'],
  '组织 (O)': ['組織 (O)', 'Organization (O)'],
  '部门 (OU)': ['部門 (OU)', 'Organizational Unit (OU)'],
  '城市 (L)': ['城市 (L)', 'Locality (L)'],
  '省份 (ST)': ['省份 (ST)', 'State (ST)'],
  '国家代码 (C)': ['國家代碼 (C)', 'Country (C)'],
  '邮箱 (Email)': ['電子郵件 (Email)', 'Email'],
  'example.com 或 公司名 (必填)': ['example.com 或 公司名 (必填)', 'example.com or your company name (required)'],
  '如 深圳市某某科技有限公司': ['如 深圳市某某科技有限公司', 'e.g. Acme Technology Ltd.'],
  '如 运维部 / 技术部': ['如 維運部 / 技術部', 'e.g. Operations / IT'],
  '如 深圳市': ['如 深圳市', 'e.g. Shenzhen'],
  '如 广东省': ['如 廣東省', 'e.g. Guangdong'],
  'admin@example.com (选填)': ['admin@example.com (選填)', 'admin@example.com (optional)'],

  // 表单区
  '主体信息 (Subject)': ['主體資訊 (Subject)', 'Subject information'],
  'SAN (备用名称)': ['SAN (備用名稱)', 'SAN (subject alternative names)'],
  '每行一个域名或 IP, 也可用逗号分隔; 留空时自动使用 CN (现代浏览器已忽略 CN, SAN 必须有值)': [
    '每列一個網域或 IP, 也可用逗號分隔; 留空時自動使用 CN (現代瀏覽器已忽略 CN, SAN 必須有值)',
    'One domain or IP per line (commas also work). Leave empty to use the CN — modern browsers ignore the CN, so a SAN is required',
  ],
  '密钥算法': ['金鑰演算法', 'Key algorithm'],
  '私钥格式': ['私鑰格式', 'Private key format'],
  '生成密钥与 CSR': ['產生金鑰與 CSR', 'Generate key & CSR'],
  '重置': ['重設', 'Reset'],
  '生成中, 大位长密钥可能需要几秒...': ['產生中, 大位長金鑰可能需要幾秒...', 'Generating… a larger key may take a few seconds'],
  '私钥与 CSR 全部在本机生成, 不会上传任何服务器; 生成后请立即保存, 拿到证书前请勿丢失私钥。': [
    '私鑰與 CSR 全部在本機產生, 不會上傳任何伺服器; 產生後請立即儲存, 拿到憑證前請勿遺失私鑰。',
    'The private key and CSR are generated locally and never uploaded. Save both right away — never lose the private key before the certificate is issued.',
  ],
  '当前环境不支持 WebCrypto (crypto.subtle), 无法生成密钥': [
    '目前環境不支援 WebCrypto (crypto.subtle), 無法產生金鑰',
    'WebCrypto (crypto.subtle) is unavailable in this environment; cannot generate a key',
  ],
  'PKCS#8 (PRIVATE KEY)': ['PKCS#8 (PRIVATE KEY)', 'PKCS#8 (PRIVATE KEY)'],
  'PKCS#1 (RSA PRIVATE KEY)': ['PKCS#1 (RSA PRIVATE KEY)', 'PKCS#1 (RSA PRIVATE KEY)'],
  'OpenSSL 3.x 默认格式, Nginx / Apache / IIS 均可直接使用': [
    'OpenSSL 3.x 預設格式, Nginx / Apache / IIS 均可直接使用',
    'The OpenSSL 3.x default; works directly with Nginx / Apache / IIS',
  ],
  '旧版软件 (OpenSSL 1.x / 部分面板) 更常见的格式, 两者可互相转换': [
    '舊版軟體 (OpenSSL 1.x / 部分面板) 更常見的格式, 兩者可互相轉換',
    'More common with older software (OpenSSL 1.x / some control panels); both are interconvertible',
  ],

  // 结果区
  '生成结果': ['產生結果', 'Result'],
  'server.key (私钥, 请务必保密)': ['server.key (私鑰, 請務必保密)', 'server.key (private key — keep it secret)'],
  'server.csr (提交给 CA 的证书签名请求)': ['server.csr (提交給 CA 的憑證簽名請求)', 'server.csr (the request to submit to your CA)'],
  '还没生成, 填写上方信息后点「生成密钥与 CSR」': [
    '還沒產生, 填寫上方資訊後點「產生金鑰與 CSR」',
    'Nothing yet — fill in the form above and click "Generate key & CSR"',
  ],
  '复制': ['複製', 'Copy'],
  '保存为 server.key': ['儲存為 server.key', 'Save as server.key'],
  '保存为 server.csr': ['儲存為 server.csr', 'Save as server.csr'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!'],
  '{tip} 已复制到粘贴板': ['{tip} 已複製到剪貼簿', '{tip} copied to clipboard'],
  '私钥': ['私鑰', 'Private key'],
  '已保存 {f}': ['已儲存 {f}', 'Saved {f}'],
  '保存失败: {m}': ['儲存失敗: {m}', 'Save failed: {m}'],
  '私钥文件': ['私鑰檔案', 'Private key file'],
  '证书签名请求': ['憑證簽名請求', 'Certificate signing request'],
  '保存文件': ['儲存檔案', 'Save file'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy'],
  '生成结果摘要': ['產生結果摘要', 'Result summary'],
  '密钥算法 (RSA)': ['金鑰演算法 (RSA)', 'Key algorithm (RSA)'],
  '签名算法': ['簽名演算法', 'Signature algorithm'],
  '主体 (Subject)': ['主體 (Subject)', 'Subject'],
  '备用名称 (SAN)': ['備用名稱 (SAN)', 'Subject alternative names'],
  'CSR 指纹 (SHA-256)': ['CSR 指紋 (SHA-256)', 'CSR fingerprint (SHA-256)'],
  '无': ['無', 'none'],
  '已生成 {bits} 位 RSA 私钥与 CSR': ['已產生 {bits} 位元 RSA 私鑰與 CSR', 'Generated a {bits}-bit RSA key and CSR'],
  '生成失败: {m}': ['產生失敗: {m}', 'Generation failed: {m}'],
  '请先填写通用名称 (CN)': ['請先填寫通用名稱 (CN)', 'Fill in the Common Name (CN) first'],
  '清除': ['清除', 'Clear'],
  '清除结果': ['清除結果', 'Clear result'],

  // 校验
  '通用名称 (CN) 不能为空': ['通用名稱 (CN) 不能為空', 'The Common Name (CN) cannot be empty'],
  '通用名称 (CN) 不能超过 {n} 个字符': ['通用名稱 (CN) 不能超過 {n} 個字元', 'The Common Name (CN) cannot exceed {n} characters'],
  '国家代码 (C) 需为 2 位字母, 如 CN / US': ['國家代碼 (C) 需為 2 位字母, 如 CN / US', 'The country code (C) must be two letters, e.g. CN / US'],
  '邮箱格式不正确': ['電子郵件格式不正確', 'The email address is not valid'],
  'SAN 中的 {v} 不是合法的域名或 IP': ['SAN 中的 {v} 不是合法的網域或 IP', '"{v}" in the SAN list is not a valid domain or IP'],

  // 说明区标题
  ' CSR 申请文件说明 ': [' CSR 申請檔案說明 ', ' About CSR generation '],
};

// 取词: 无命中回退 zh 原文
export const cs = (locale: string, zh: string): string => {
  const e = csRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const csT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = cs(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
