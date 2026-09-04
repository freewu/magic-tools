// SHA3 Hash 值计算 说明
const intro = `
<div style="line-height: 1.8; color: #333;">
  <p><b>SHA-3</b> (Secure Hash Algorithm 3) 由 NIST 于 2015 年发布 (FIPS 202), 底层采用 Keccak 海绵结构。其内部置换
  Keccak-f[1600] 与原 Keccak 提交版本相同, 但 NIST 在填充规则中引入了不同的域字节 (0x06), 因此计算结果与
  <i>Keccak-224/256/384/512</i> (域字节 0x01, 如以太坊地址所用) <b>并不相同</b>。</p>
  <ul>
    <li><b>SHA3-224 / SHA3-256 / SHA3-384 / SHA3-512</b>: 固定长度摘要, 分别输出 28 / 32 / 48 / 64 字节 (56 / 64 / 96 / 128 个十六进制字符);</li>
    <li><b>SHAKE128 / SHAKE256</b>: 可扩展输出函数 (XOF), 输出长度任意 (须为 8 的整数倍 bit), 可在页面中调整输出长度。</li>
  </ul>
  <p>输入内容按 UTF-8 编码参与计算 (中文 / emoji 亦支持), 结果可直接点击复制。</p>
</div>`;

const Intro = () => <div dangerouslySetInnerHTML={{ __html: intro }}/>;

export default Intro;
