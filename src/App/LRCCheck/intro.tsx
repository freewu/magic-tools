const intro = 
`
<pre>
## LRC 校验说明
\`\`\`
LRC (Longitudinal Redundancy Check, 纵向冗余校验) 是一种按字节纵向累加的简单
校验方式: 把数据块中每个字节相加 (忽略进位, 即 mod 256), 得到单字节校验值
Modbus RTU 等协议在累加和基础上再求二进制补码作为帧尾校验

两种算法 (本工具可切换):
  SUM 累加和    = (字节1 + 字节2 + ... + 字节N) mod 256
  补码 LRC(Modbus) = (-SUM) mod 256, 即对累加和低 8 位按位取反再加 1
\`\`\`

## 示例
\`\`\`
数据帧:  01 03 04 02 00 01 00
累加和:  0x01+0x03+0x04+0x02+0x00+0x01+0x00 = 0x0B
补码LRC: (-0x0B) mod 256 = 0xF5
完整帧:  01 03 04 02 00 01 00 F5    <- 常见于 Modbus 文档示例

文本 ABC:  字节 41 42 43, 累加和 = 0xC6, 补码 LRC = 0x3A
\`\`\`

## 使用说明
\`\`\`
1 输入方式支持两种
  - HEX 模式: 粘贴十六进制字节 (仅数据区, 不含起始符/帧尾/已有 LRC);
    支持空格、逗号、分号、冒号、竖线、短横线、下划线、换行分隔, 每段可带 0x 前缀,
    单字符按高位补 0 (如 F = 0x0F)
  - ASCII / 文本 模式: 直接输入文本 (如 ABC), 按 UTF-8 编码为字节参与计算
2 校验算法: 默认「补码 LRC (Modbus)」; 若协议只用累加和, 切到「累加和 SUM」
3 结果同时给出 HEX / DEC / OCT / BIN 四种进制, 双击任一值可复制
4 若协议有约定的期望值 (十六进制), 填到「期望 LRC」输入框自动比对
\`\`\`
</pre>
`;
const LRCIntro = () => {

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: intro }}
      style={ { "overflowY": "scroll","height": "260px" }}>
    </div>
  );
}

export default LRCIntro;