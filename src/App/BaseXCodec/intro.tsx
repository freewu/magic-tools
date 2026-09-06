import { codeMap, codeNotes, codeList } from "./data";

// BaseX 编码说明: 顶部为当前码型的详细说明 (随切换联动), 下方为通用简介与支持列表
const BaseXIntro = ({ code }: { code?: string }) => {
  const alphabet = code ? codeMap.get(code) : undefined;
  const note = code ? codeNotes.get(code) : undefined;

  return (
    <div style={ { marginTop: 4 } }>
      { code && alphabet && (
        <div style={ {
          background: '#f6f8fa',
          border: '1px solid #e6e6e6',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        } }>
          <div style={ { fontWeight: 600, fontSize: 15 } }>
            { code } 编码说明
            <span style={ { color: '#999', fontWeight: 400, marginLeft: 10, fontSize: 12 } }>
              字母表长度 { alphabet.length } (即 { alphabet.length } 进制)
            </span>
          </div>
          { note && (
            <div style={ { marginTop: 6, color: '#555', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' } }>
              { note }
            </div>
          ) }
          <div style={ {
            marginTop: 8,
            fontSize: 12,
            fontFamily: 'Consolas, Monaco, monospace',
            color: '#888',
            lineHeight: 1.8,
            wordBreak: 'break-all',
          } }>
            字母表: { alphabet }
          </div>
        </div>
      ) }

      <p style={ { whiteSpace: 'pre-line', margin: '4px 0 8px' } }>
        { `BaseX 编码把任意字节序列视为一个大整数, 再用目标字母表(Alphabet)做进制转换, 得到一个仅含字母表字符的文本串。字母表长度即进制数:

  · 字母表越短, 编码后文本越长 (Base16 每位表示 4 bit, Base32 每位 5 bit, Base64 每位 6 bit)
  · 字母表越长, 文本越紧凑 (Base85/Base91 常用于压缩二进制数据后的文本表示)
  · 同一进制下编码结果与字节序、补齐规则强相关, 不同实现可能不互通` }
      </p>
      <p style={ { margin: '4px 0 4px' } }>本工具支持的码型 (蓝色为当前):</p>
      { Array.from(codeList).reduce<Array<Array<string>>>((groups, name, i) => {
        if (i % 5 === 0) groups.push([]);
        groups[groups.length - 1].push(name);
        return groups;
      }, []).map((row, i) => (
        <p key={ i } style={ { margin: '2px 0', fontFamily: 'Consolas, Monaco, monospace' } }>
          { row.map((name, j) => (
            <span key={ name }>
              <span style={ name === code ? { color: '#1677ff', fontWeight: 600 } : undefined }>{ name }</span>
              { j < row.length - 1 ? '　' : '' }
            </span>
          )) }
        </p>
      )) }
    </div>
  );
}

export default BaseXIntro;
