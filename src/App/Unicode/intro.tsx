import { useLocale } from "../../hook/locale-context";

// 文档: zh-CN 为默认; TW / EN 为对应翻译
const introZh = `
<pre>
## Unicode 说明
\`\`\`
Unicode 是国际标准字符集，它将世界各种语言的每个字符定义一个唯一的编码，以满足跨语言、跨平台的文本信息转换

Unicode 字符集的编码范围是 \`0x0000 - 0x10FFFF\`
可以容纳一百多万个字符， 每个字符都有一个独一无二的编码,
也即每个字符都有一个二进制数值和它对应，这里的二进制数值也叫\`码点\`
比如：汉字 "中" 的 码点是 \`0x4E2D\`, 大写字母 A 的码点是 \`0x41\`,具体字符对应的 Unicode 编码可以查询 Unicode字符编码表

Unicode 只是字符集，UTF-8、UTF-16、UTF-32 才是真正的字符编码规则
\`\`\`

## UTF-8 编码
\`\`\`
一种变长字符编码，被定义为将码点编码为 1 至 4 个字节，具体取决于码点数值中有效二进制位的数量

UTF-8 的编码规则:

    1 对于单字节的符号，字节的第一位设为 0，后面 7 位为这个符号的 Unicode 码。
      因此对于英语字母，UTF-8 编码和 ASCII 码是相同的, 所以 UTF-8 能兼容 ASCII 编码，这也是互联网普遍采用 UTF-8 的原因之一
    2 对于 n 字节的符号（ n > 1），第一个字节的前 n 位都设为 1，第 n + 1 位设为 0，后面字节的前两位一律设为 10 。
      剩下的没有提及的二进制位，全部为这个符号的 Unicode 码
    

    \`\`\`

## UTF-16 编码
\`\`\`
一种变长字符编码, 这种编码方式比较特殊, 它将字符编码成 2 字节 或者 4 字节

具体的编码规则如下:

    1 对于 Unicode 码小于 0x10000 的字符， 使用 2 个字节存储，并且是直接存储 Unicode 码，不用进行编码转换
    2 对于 Unicode 码在 0x10000 和 0x10FFFF 之间的字符，使用 4 个字节存储，
      这 4 个字节分成前后两部分，每个部分各两个字节，其中，
      前面两个字节的前 6 位二进制固定为 110110，后面两个字节的前 6 位二进制固定为 110111, 
      前后部分各剩余 10 位二进制表示符号的 Unicode 码 减去 0x10000 的结果
    3 大于 0x10FFFF 的 Unicode 码无法用 UTF-16 编码
    \`\`\`

## UTF-32 编码
\`\`\`
UTF-32 是固定长度的编码，始终占用 4 个字节，足以容纳所有的 Unicode 字符，
直接存储 Unicode 码即可，不需要任何编码转换。虽然浪费了空间，但提高了效率
\`\`\`

## BOM
\`\`\`
BOM 是 byte-order mark 的缩写，是 "字节序标记" 的意思, 它常被用来当做标识文件是以 UTF-8、UTF-16 或 UTF-32 编码的标记
在 Unicode 编码中有一个叫做 "零宽度非换行空格" 的字符 ( ZERO WIDTH NO-BREAK SPACE ), 用字符 FEFF 来表示

对于 UTF-16 ，如果接收到以 \`FEFF\` 开头的字节流， 就表明是大端字节序，如果接收到 \`FFFE\`， 就表明字节流 是小端字节序

UTF-8 没有字节序问题，UTF-8 编码的 BOM 是 \`EF BB BF\`, 所以如果接收到以 \`EF BB BF\` 开头的字节流，就知道这是UTF-8 文件
\`\`\`
</pre>
`;
const introTw = `<pre>
## Unicode 說明
\`\`\`
Unicode 是國際標準字元集, 它為世界各種語言的每個字元定義一個唯一的編碼, 以滿足跨語言、跨平台的文字資訊轉換

Unicode 字元集的編碼範圍是 0x0000 - 0x10FFFF
可以容納一百多萬個字元, 每個字元都有一個獨一無二的編碼,
也即每個字元都有一個二進位數值和它對應, 這裡的二進位數值也叫"碼點"
例如: 漢字 "中" 的碼點是 0x4E2D, 大寫字母 A 的碼點是 0x41, 具體字元對應的 Unicode 編碼可查詢 Unicode 字元編碼表

Unicode 只是字元集, UTF-8、UTF-16、UTF-32 才是真正的字元編碼規則
\`\`\`

## UTF-8 編碼
\`\`\`
一種變長字元編碼, 被定義為將碼點編碼為 1 至 4 個位元組, 具體取決於碼點數值中有效二進位元的數量

UTF-8 的編碼規則:

    1 對於單位元組的字元, 第一位設為 0, 後面 7 位為這個字元的 Unicode 碼。
      因此對於英文字母, UTF-8 編碼和 ASCII 碼是相同的, 所以 UTF-8 能相容 ASCII 編碼, 這也是網際網路普遍採用 UTF-8 的原因之一
    2 對於 n 位元組的字元 (n > 1), 第一個位元組的前 n 位都設為 1, 第 n + 1 位設為 0, 後面位元組的前兩位一律設為 10。
      剩下的沒有提及的二進位元, 全部為這個字元的 Unicode 碼
\`\`\`

## UTF-16 編碼
\`\`\`
一種變長字元編碼, 這種編碼方式比較特殊, 它將字元編碼成 2 位元組 或者 4 位元組

具體的編碼規則如下:

    1 對於 Unicode 碼小於 0x10000 的字元, 使用 2 個位元組儲存, 並且直接儲存 Unicode 碼, 不用進行編碼轉換
    2 對於 Unicode 碼在 0x10000 和 0x10FFFF 之間的字元, 使用 4 個位元組儲存,
      這 4 個位元組分成前後兩部分, 每個部分各兩個位元組, 其中,
      前面兩個位元組的前 6 位二進位固定為 110110, 後面兩個位元組的前 6 位二進位固定為 110111,
      前後部分各剩餘 10 位二進位表示字元的 Unicode 碼減去 0x10000 的結果
    3 大於 0x10FFFF 的 Unicode 碼無法用 UTF-16 編碼
\`\`\`

## UTF-32 編碼
\`\`\`
UTF-32 是固定長度的編碼, 始終占用 4 個位元組, 足以容納所有的 Unicode 字元,
直接儲存 Unicode 碼即可, 不需要任何編碼轉換。雖然浪費了空間, 但提高了效率
\`\`\`

## BOM
\`\`\`
BOM 是 byte-order mark 的縮寫, 意為 "位元組序標記", 常用來標示檔案是以 UTF-8、UTF-16 或 UTF-32 編碼的
在 Unicode 編碼中有一個叫做 "零寬度非換行空格" 的字元 (ZERO WIDTH NO-BREAK SPACE), 用字元 FEFF 來表示

對於 UTF-16, 如果接收到以 FEFF 開頭的位元組流, 就表明是大端位元組序; 如果接收到 FFFE, 就表明位元組流是小端位元組序

UTF-8 沒有位元組序問題, UTF-8 編碼的 BOM 是 EF BB BF, 所以如果接收到以 EF BB BF 開頭的位元組流, 就知道這是 UTF-8 檔案
\`\`\`
</pre>`;
const introEn = `<pre>
## About Unicode
\`\`\`
Unicode is the international standard character set: it gives every character of
every human language a unique code point, so text can be exchanged across
languages and platforms.

Code points range from 0x0000 to 0x10FFFF, more than a million values, and each
character owns a unique code — a specific binary value called its "code point".
For example, the Chinese character "中" is U+4E2D and capital "A" is U+41; you
can look up any character in a Unicode code chart.

Unicode itself is only a character set. UTF-8, UTF-16 and UTF-32 are the actual
encoding rules.
\`\`\`

## UTF-8
\`\`\`
A variable-length encoding that stores each code point in 1 to 4 bytes,
depending on how many significant bits its value needs.

UTF-8 rules:

    1 For a 1-byte character, the leading bit is 0 and the remaining 7 bits hold
      the code point. English letters therefore encode exactly like ASCII, which
      is why UTF-8 is backwards-compatible with ASCII — one reason the Web
      adopted it.
    2 For an n-byte character (n > 1), the first byte starts with n ones
      followed by 0, every continuation byte starts with 10, and the remaining
      bits carry the code point value.
\`\`\`

## UTF-16
\`\`\`
A variable-length encoding, peculiar in that it stores characters in either
2 bytes or 4 bytes.

Rules:

    1 Code points below 0x10000 are stored directly in 2 bytes, no conversion.
    2 Code points between 0x10000 and 0x10FFFF are stored in 4 bytes, split
      into two halves of 2 bytes each. The leading 6 bits of the first half are
      fixed to 110110 and those of the second half to 110111; the remaining
      10+10 bits hold (code point - 0x10000).
    3 Code points above 0x10FFFF cannot be encoded in UTF-16.
\`\`\`

## UTF-32
\`\`\`
A fixed-length encoding that always uses 4 bytes — enough for every Unicode
character. Code points are stored directly with no conversion at all. It wastes
space but is the simplest and fastest.
\`\`\`

## BOM
\`\`\`
BOM stands for byte-order mark, a marker commonly used to flag a file as UTF-8,
UTF-16 or UTF-32. In Unicode it is the "ZERO WIDTH NO-BREAK SPACE" character,
represented by U+FEFF.

For UTF-16, a stream starting with FEFF is big-endian, while one starting with
FFFE is little-endian.

UTF-8 has no byte-order issue; its BOM is EF BB BF, so a stream starting with
EF BB BF tells you the file is UTF-8.
\`\`\`
</pre>`;

const UnicodeIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }}
      style={ { "overflowY": "scroll","height": "300px" }}>
    </div>
  );
}

export default UnicodeIntro;
