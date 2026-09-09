import { useLocale } from '../../hook/locale-context';
import { tr } from '../../i18n/lang';
import bcdLang from './lang';
import { ENCODE_TABLES, codeList, type BCDType } from "./data";

// BCD (Binary-Coded Decimal, 二-十进制码) 简介
const zhP = (
  <>
    <p style={{ margin: "4px 0 8px" }}>
      BCD（Binary-Coded Decimal，二-十进制码）用 4 位二进制表示一位十进制数字（0~9）。
      不同码型的位权与构成规则不同：2421 码、余3码、余3循环码具有自补性
      （码按位取反即为 9 的补数，便于减法电路实现）；Gray 码相邻数字仅 1 位变化，抗干扰性强。
      下表为各码型 0~9 的编码对照。
    </p>
    <p style={{ margin: "4px 0 8px", opacity: 0.75 }}>
      编码时逐位转换并每 4 位用空格分组；解码时每 4 位映射回一个数字，非法码组会给出提示。
    </p>
  </>
);

const twP = (
  <>
    <p style={{ margin: "4px 0 8px" }}>
      BCD（Binary-Coded Decimal，二-十進位碼）用 4 位元二進位表示一位十進位數字（0~9）。
      不同碼型的位權與構成規則不同：2421 碼、餘3碼、餘3循環碼具有自補性
      （碼按位取反即為 9 的補數，便於減法電路實現）；Gray 碼相鄰數字僅 1 位元變化，抗干擾性強。
      下表為各碼型 0~9 的編碼對照。
    </p>
    <p style={{ margin: "4px 0 8px", opacity: 0.75 }}>
      編碼時逐位轉換並每 4 位元用空格分組；解碼時每 4 位元對應回一個數字，非法碼組會給出提示。
    </p>
  </>
);

const enP = (
  <>
    <p style={{ margin: "4px 0 8px" }}>
      BCD (Binary-Coded Decimal) encodes each decimal digit (0~9) as a 4-bit binary value.
      Different code types use different weights/rules: the 2421, Excess-3 and Excess-3 Gray codes are
      self-complementing (inverting each bit yields the 9's complement, which simplifies subtraction circuits),
      while Gray code changes only one bit between adjacent digits for better noise immunity.
      The table below lists the 0~9 encodings of each code type.
    </p>
    <p style={{ margin: "4px 0 8px", opacity: 0.75 }}>
      Encoding converts digit by digit and groups every 4 bits with a space; decoding maps every 4 bits back to a
      digit and warns about illegal code groups.
    </p>
  </>
);

const BCDIntro = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(bcdLang, locale, key, fallback);
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const thStyle: React.CSSProperties = { border: "1px solid #d9d9d9", padding: "2px 6px", fontWeight: 600 };
  const tdStyle: React.CSSProperties = { border: "1px solid #d9d9d9", padding: "2px 6px", textAlign: "center" };
  return (
    <div>
      { locale === 'zh-TW' ? twP : locale === 'en' ? enP : zhP }
      <table style={{ borderCollapse: "collapse", fontSize: 12, margin: "8px 0" }}>
        <thead>
          <tr>
            <th style={ thStyle }>{ t('dec', '十进制') }</th>
            { digits.map((d) => <th key={ d } style={ thStyle }>{ d }</th>) }
          </tr>
        </thead>
        <tbody>
          { codeList.map((item) => (
            <tr key={ item.value }>
              <td style={ tdStyle }>{ t('c_' + item.value.replace(/-/g, '_'), item.label) }</td>
              { ENCODE_TABLES[item.value as BCDType].map((b, i) => <td key={ i } style={ tdStyle }>{ b }</td>) }
            </tr>
          )) }
        </tbody>
      </table>
    </div>
  );
}

export default BCDIntro;
