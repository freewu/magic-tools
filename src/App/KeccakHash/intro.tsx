// Keccak Hash 值计算 说明
const intro = `
<div style="line-height: 1.8; color: #333;">
  <p><b>Keccak</b> 是 SHA-3 在 NIST 标准化之前的原始提交版本, 底层同为 Keccak-f[1600] 海绵结构, 但填充采用域字节
  <i>0x01</i>, 与 NIST 定稿的 SHA-3 (域字节 0x06) 计算出的结果并不相同。</p>
  <ul>
    <li><b>Keccak-224 / Keccak-256 / Keccak-384 / Keccak-512</b>: 固定长度摘要, 分别输出 28 / 32 / 48 / 64 字节;</li>
    <li>Keccak-256 常用于以太坊: 地址即公钥经 Keccak-256 后取后 20 字节, 空串的 Keccak-256 为
      <code>c5d2 4601 ... 85a4 70</code>。</li>
  </ul>
  <p>输入内容按 UTF-8 编码参与计算 (中文 / emoji 亦支持), 结果可直接点击复制。</p>
</div>`;

const Intro = () => <div dangerouslySetInnerHTML={{ __html: intro }}/>;

export default Intro;
