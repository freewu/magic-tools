const intro = `
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
const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
