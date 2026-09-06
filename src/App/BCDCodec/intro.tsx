import { ENCODE_TABLES, codeList, type BCDType } from "./data";

// BCD (Binary-Coded Decimal, 二-十进制码) 用 4 位二进制表示一个十进制数字 0-9。
// 不同码型权重/构成规则不同, 其中 2421 码 / 余3码 / 余3循环码 具有自补特性
// (任意数字码按位取反后等于其 9 的补数, 便于减法电路实现)。
const BCDIntro = () => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div>
      <p style={{ margin: "4px 0 8px" }}>
        BCD（Binary-Coded Decimal，二-十进制码）用 4 位二进制表示一位十进制数字（0~9）。
        不同码型的位权与构成规则不同：2421 码、余3码、余3循环码具有自补性
        （码按位取反即为 9 的补数，便于减法电路实现）；Gray 码相邻数字仅 1 位变化，抗干扰性强。
        下表为各码型 0~9 的编码对照。
      </p>
      <table style={{ borderCollapse: "collapse", fontSize: 12, margin: "8px 0" }}>
        <thead>
          <tr>
            <th style={ thStyle }>十进制</th>
            { digits.map((d) => <th key={ d } style={ thStyle }>{ d }</th>) }
          </tr>
        </thead>
        <tbody>
          { codeList.map((item) => (
            <tr key={ item.value }>
              <td style={ tdStyle }>{ item.label }</td>
              { ENCODE_TABLES[item.value as BCDType].map((b, i) => <td key={ i } style={ tdStyle }>{ b }</td>) }
            </tr>
          )) }
        </tbody>
      </table>
      <p style={{ margin: "4px 0 8px", opacity: 0.75 }}>
        编码时逐位转换并每 4 位用空格分组；解码时每 4 位映射回一个数字，非法码组会给出提示。
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = { border: "1px solid #d9d9d9", padding: "2px 6px", fontWeight: 600 };
const tdStyle: React.CSSProperties = { border: "1px solid #d9d9d9", padding: "2px 6px", textAlign: "center" };

export default BCDIntro;