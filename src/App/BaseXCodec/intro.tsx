import { codeMap } from "./data";

// BaseX 编码说明
const tips = `
BaseX 编码把任意字节序列视为一个大整数, 再用目标字母表(Alphabet)做进制转换, 得到一个仅含字母表字符的文本串。字母表长度即进制数:

  · 字母表越短, 编码后文本越长 (Base16 每位表示 4 bit, Base32 每位 5 bit, Base64 每位 6 bit)
  · 字母表越长, 文本越紧凑 (Base85/Base91 常用于压缩二进制数据后的文本表示)
  · 同一进制下编码结果与字节序、补齐规则强相关, 不同实现可能不互通
`;

const BaseXIntro = () => {
  const groups: Array<Array<string>> = [];
  Array.from(codeMap.keys()).forEach((name, i) => {
    if (i % 5 === 0) groups.push([]);
    groups[groups.length - 1].push(name);
  });
  return (
    <div style={ { marginTop: 4 } }>
      <p style={ { whiteSpace: 'pre-line', margin: '4px 0 8px' } }>{ tips }</p>
      <p style={ { margin: '4px 0 4px' } }>本工具支持的码型:</p>
      { groups.map((row, i) => (
        <p key={ i } style={ { margin: '2px 0', fontFamily: 'Consolas, Monaco, monospace' } }>
          { row.join('　') }
        </p>
      )) }
    </div>
  );
}

export default BaseXIntro;
