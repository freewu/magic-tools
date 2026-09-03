const introHtml = `
<div>
  <h3>CRC 校验 (循环冗余校验)</h3>
  <p>CRC 通过对数据多项式进行模 2 除法得到校验码, 广泛用于通信帧 / 存储 / 压缩格式的完整性校验。
     本工具参考 <a href="https://www.ip33.com/crc.html" target="_blank">ip33.com/crc.html</a> 的参数化模型,
     内置 30+ 种常用标准算法, 也可对照参数理解每个算法的差异。</p>

  <h4>使用说明</h4>
  <ol>
    <li>选择输入格式: <b>HEX</b> (十六进制字节, 支持 空格/逗号/分号/冒号/竖线/短横线/下划线/换行及 0x 前缀分隔) 或 <b>ASCII / 文本</b> (文本按 UTF-8 编码为字节);</li>
    <li>选择校验算法 (下拉可搜索), 下方会同步显示该算法的参数摘要;</li>
    <li>输入数据后实时计算, 结果以四个输出行给出 HEX / DEC / OCT / BIN 四种进制, 点击任一行即可复制 (参考 Hash 值计算的展示方式)。</li>
  </ol>

  <h4>算法四项参数的含义</h4>
  <ul>
    <li><b>poly</b>: 生成多项式 (十六进制, 通常最高位隐含为 1, 表中省略该位不写);</li>
    <li><b>init</b>: 寄存器初始值 (常用于处理前导零 / 首字节补充);</li>
    <li><b>refin / refout</b>: 输入 / 输出是否按位反转 (LSB 先处理模式, 两项在标准算法中恒成对出现);</li>
    <li><b>xorout</b>: 输出时与寄存器结果异或的值 (常见 0x00 或全 1)。</li>
  </ul>

  <h4>算法自检 check 值</h4>
  <p>每个算法目录都附有标准 <b>check</b> 值: 对 ASCII 字符串 "123456789" 计算的结果。
     你可以在 ASCII 模式输入 <code>123456789</code>, 与参数摘要中展示的 check 比对来确认算法实现正确。</p>

  <h4>常见算法速查</h4>
  <ul>
    <li>Modbus RTU 报文帧尾的 <b>CRC-16/MODBUS</b>: poly 0x8005, init 0xFFFF, refin/refout 是, check = 0x4B37;</li>
    <li>XMODEM / ZMODEM 传输协议: <b>CRC-16/XMODEM</b>: poly 0x1021, init 0x0000, 不反转, check = 0x31C3;</li>
    <li>PPP / V.42 / 蓝牙等: <b>CRC-16/X25</b> (CRC-CCITT 反转版), check = 0x906E;</li>
    <li>ZIP / PNG / GZIP / 以太网 FCS: <b>CRC-32</b>, check = 0xCBF43926;</li>
    <li>xz 压缩格式: <b>CRC-64/XZ</b> (ECMA-182), check = 0x995DC9BBDF1939FA。</li>
  </ul>
</div>`;

const CRCIntro = () => (
  <div
    style={ { height: '100%', overflowY: 'auto', maxHeight: 320 } }
    dangerouslySetInnerHTML={ { __html: introHtml } }
  />
);

export default CRCIntro;
