import { useLocale } from '../../hook/locale-context';

const introZh = `
<h2>SM4 国密分组密码</h2>
<blockquote><p>SM4 是国家密码管理局发布的<strong>分组对称加密</strong>算法 (GB/T 32907-2016), 分组长度与密钥长度均为 <b>128 位</b> (16 字节)。与 SM2/SM3 合称「国密算法」, 广泛用于商用密码应用 (TLCP 等)。</p>
</blockquote>
<h2>密钥与参数</h2>
<ul>
<li><p><b>密钥</b>: 固定 128 位 — 可直接输入 <b>16 个字符</b> (UTF-8), 也可输入 <b>32 位 HEX</b> (如 0123456789abcdeffedcba9876543210)</p></li>
<li><p><b>模式</b>: ECB (电子密码本, 无需 IV) / CBC (密码块链接, 需要 16 字节偏移量 IV)</p></li>
<li><p><b>填充</b>: Pkcs7 (标准, 推荐) / ZeroPadding (补零)</p></li>
<li><p><b>编码</b>: 密文按 HEX 或 Base64 显示, 与 sm-crypto (npm)、各类国密在线工具互通</p></li>
</ul>
<h2>使用说明</h2>
<ul>
<li><p>加密: 上方输入明文 → 点「加密」, 密文输出到下方; 解密反之 (下方密文 → 点「解密」)</p></li>
<li><p>加解密双方必须使用<strong>相同</strong>的密钥、模式、填充与 IV (CBC); 密钥错误将报「填充无效」提示</p></li>
<li><p>明文按 UTF-8 处理, 支持中文与任意文本; 文本框支持双击复制、拖拽文件载入</p></li>
</ul>
<h2>安全提醒</h2>
<blockquote><p>ECB 模式下相同明文块产生相同密文块, 安全性弱于 CBC; 实际生产建议使用 CBC + 随机 IV。所有计算均在本地完成。</p>
</blockquote>
`;

const introTw = `
<h2>SM4 國密區塊密碼</h2>
<blockquote><p>SM4 是中國國家密碼管理局發布的<strong>區塊對稱加密</strong>演算法 (GB/T 32907-2016), 區塊長度與金鑰長度均為 <b>128 位</b> (16 位元組)。與 SM2/SM3 合稱「國密演算法」, 廣泛用於商用密碼應用 (TLCP 等)。</p>
</blockquote>
<h2>金鑰與參數</h2>
<ul>
<li><p><b>金鑰</b>: 固定 128 位 — 可直接輸入 <b>16 個字元</b> (UTF-8), 也可輸入 <b>32 位 HEX</b> (如 0123456789abcdeffedcba9876543210)</p></li>
<li><p><b>模式</b>: ECB (電子密碼本, 無需 IV) / CBC (密碼區塊鏈結, 需要 16 位元組偏移量 IV)</p></li>
<li><p><b>填充</b>: Pkcs7 (標準, 建議) / ZeroPadding (補零)</p></li>
<li><p><b>編碼</b>: 密文以 HEX 或 Base64 顯示, 與 sm-crypto (npm)、各類國密線上工具互通</p></li>
</ul>
<h2>使用說明</h2>
<ul>
<li><p>加密: 上方輸入明文 → 點「加密」, 密文輸出到下方; 解密反之 (下方密文 → 點「解密」)</p></li>
<li><p>加解密雙方必須使用<strong>相同</strong>的金鑰、模式、填充與 IV (CBC); 金鑰錯誤將顯示「填充無效」提示</p></li>
<li><p>明文以 UTF-8 處理, 支援中文與任意文字; 文字框支援雙擊複製、拖曳檔案載入</p></li>
</ul>
<h2>安全提醒</h2>
<blockquote><p>ECB 模式下相同明文區塊產生相同密文區塊, 安全性弱於 CBC; 實際生產建議使用 CBC + 隨機 IV。所有計算均在本機完成。</p>
</blockquote>
`;

const introEn = `
<h2>SM4 (Chinese national-standard block cipher)</h2>
<blockquote><p>SM4 is the <strong>symmetric block cipher</strong> published by the Chinese National Cryptography Administration (GB/T 32907-2016). Both the block size and key size are <b>128 bits</b> (16 bytes). Alongside SM2/SM3 it is one of the "national-standard ciphers" and is widely used in commercial cryptography applications (e.g. TLCP).</p>
</blockquote>
<h2>Key and parameters</h2>
<ul>
<li><p><b>Key</b>: fixed 128 bits — type <b>16 characters</b> (UTF-8) or <b>32 HEX digits</b> (e.g. 0123456789abcdeffedcba9876543210)</p></li>
<li><p><b>Mode</b>: ECB (electronic codebook, no IV needed) / CBC (cipher block chaining, needs a 16-byte IV)</p></li>
<li><p><b>Padding</b>: Pkcs7 (standard, recommended) / ZeroPadding</p></li>
<li><p><b>Encoding</b>: ciphertext is shown as HEX or Base64, interoperable with sm-crypto (npm) and other national-standard online tools</p></li>
</ul>
<h2>Usage</h2>
<ul>
<li><p>Encryption: type plaintext above → click Encrypt, the ciphertext appears below; decryption is the reverse (ciphertext below → click Decrypt)</p></li>
<li><p>Both sides must use the <strong>same</strong> key, mode, padding and IV (CBC); a wrong key shows an "Invalid padding" message</p></li>
<li><p>Plaintext is treated as UTF-8, so Chinese and arbitrary text are supported; the text boxes support double-click to copy and drop a file to load</p></li>
</ul>
<h2>Security note</h2>
<blockquote><p>In ECB mode identical plaintext blocks produce identical ciphertext blocks, which is weaker than CBC; in production prefer CBC with a random IV. All computation happens locally.</p>
</blockquote>
`;

const Intro = () => {
  const { locale } = useLocale();
  return <div dangerouslySetInnerHTML={ { __html: locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh } } />;
}
export default Intro;
