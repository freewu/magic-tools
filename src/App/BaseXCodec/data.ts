
// 编码映射的字符串
export const codeMap = new Map<string,string>([
  [ "Base16", "0123456789abcdef"],
  [ "Base32", "ABCDEFGHIJKLMNOPQRSTUVWXYZ2345678" ],
  [ "Base32-hex", "0123456789ABCDEFGHIJKLMNOPQRSTUV" ],
  [ "Base32-z-base-32", "ybndrfg8ejkmcpqxot1uwisza345h769" ],
  [ "Base32-Geohash", "0123456789bcdefghjkmnpqrstuvwxyz" ],
  [ "Base32-WordSafe", "23456789CFGHJMPQRVWXcfghjmpqrvwx" ],
  [ "Base36", "0123456789abcdefghijklmnopqrstuvwxyz" ],
  [ "Base45", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:" ],
  [ "Base58", "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" ],
  [ "Base62", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" ],
  [ "Base64", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" ],
  [ "Base64-URLSafe", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" ],
  [ "Base85-Ascii85", "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstu" ],
  [ "Base85-ZeroMQ", "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#" ],
  [ "Base85-IPv6", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~" ],
  [ "Base91", 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"' ],
]);

// 编码列表
export const codeList =  Array.from(codeMap.keys());

// 各码型详细说明 (随切换显示)
export const codeNotes = new Map<string,string>([
  [ "Base16", "十六进制表示, 每位对应 4 bit。最直观的字节形态, 常用于哈希摘要、颜色值、协议调试; 输出约为原始字节长度的 2 倍。" ],
  [ "Base32", "最常用的 Base32 风格字母表 (A-Z 与数字 2-8), 去除易混淆字符, 比 Base16 紧凑约 40%; 常用于校验和、令牌等文本环境。" ],
  [ "Base32-hex", "扩展十六进制风格字母表 (0-9A-V), 与十六进制保持字典序一致, 用于 DNSSEC 等需要排序稳定的场景。" ],
  [ "Base32-z-base-32", "Zooko 设计的易读字母表, 刻意剔除易混淆字符并避免拼出完整英文单词, 用于 Zeronet 等场景。" ],
  [ "Base32-Geohash", "地理哈希字母表 (0-9 与去除 i/l/o 的小写字母), 把经纬度折叠为短字符串, 用于地理编码与邻近检索。" ],
  [ "Base32-WordSafe", "WordSafe 字母表 (Go 生态常用), 混合大小写与数字但避免组成可读单词, 适合标识符与文件名。" ],
  [ "Base36", "数字 + 26 个小写字母共 36 字符, 短 ID、邀请码、兑换码常见; 结果可用 parseInt 等直接还原为整数。" ],
  [ "Base45", "RFC 9285 标准, 每 2 字节编码为 3 个字符, 字符集避开 XML/URL 保留字符; 用于欧洲电子健康证明等二维码场景。" ],
  [ "Base58", "比特币等加密货币地址的编码, 移除 0/O/I/l 易混淆字符且不含 +/; 输出紧凑, 适合人工抄写。" ],
  [ "Base62", "数字 + 大小写字母共 62 字符, URL 短链与短 ID 的最常用选择, 文本紧凑且 URL 安全。" ],
  [ "Base64", "RFC 4648 标准 (含 +/), 每 3 字节编码为 4 字符; 文本协议 / JSON / DataURL 传输二进制的通用方案。" ],
  [ "Base64-URLSafe", "Base64 的 URL 变体 (-_ 替代 +/), JWT 与 URL 参数中无需再转义。" ],
  [ "Base85-Ascii85", "Adobe PostScript / PDF 官方编码, 4 字节编码为 5 字符, 比 Base64 省约 25%; <~ ~> 包裹与 'z' 压缩属上层协议, 本工具为纯字母表映射。" ],
  [ "Base85-ZeroMQ", "ZeroMQ 的 Z85 编码, 字符集覆盖常用可打印 ASCII, 用于二进制密钥的文本传输。" ],
  [ "Base85-IPv6", "RFC 1924 提出的 IPv6 地址紧凑文本表示方案 (实验性质)。" ],
  [ "Base91", "每 13 bit 编码为 2 字符, 比 Base64 / Base85 更紧凑, 常用于压缩数据的文本化; 无统一补齐规则, 不同实现需使用相同字母表。" ],
]);
