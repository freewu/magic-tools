
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
