import { codeMap, codeNotes, codeList } from "./data";
import { useLocale } from '../../hook/locale-context';

// 码型详述: data.ts 的 codeNotes 为 zh-CN 原文, 此处补 zh-TW / en 两套
const twNotes: Record<string, string> = {
  "Base16": "十六進位表示, 每個字元對應 4 bit。最直觀的位元組形態, 常用於雜湊摘要、顏色值、協定除錯; 輸出約為原始位元組長度的 2 倍。",
  "Base32": "最常用的 Base32 風格字母表 (A-Z 與數字 2-8), 去除易混淆字元, 比 Base16 緊湊約 40%; 常用於校驗和、令牌等文字環境。",
  "Base32-hex": "擴充十六進位風格字母表 (0-9A-V), 與十六進位保持字典序一致, 用於 DNSSEC 等需要排序穩定的場景。",
  "Base32-z-base-32": "Zooko 設計的易讀字母表, 刻意剔除易混淆字元並避免拼出完整英文單字, 用於 Zeronet 等場景。",
  "Base32-Geohash": "地理雜湊字母表 (0-9 與去除 i/l/o 的小寫字母), 把經緯度摺疊為短字串, 用於地理編碼與鄰近搜尋。",
  "Base32-WordSafe": "WordSafe 字母表 (Go 生態常用), 混合大小寫與數字但避免組成可讀單字, 適合識別碼與檔案名稱。",
  "Base36": "數字 + 26 個小寫字母共 36 字元, 短 ID、邀請碼、兌換碼常見; 結果可用 parseInt 等直接還原為整數。",
  "Base45": "RFC 9285 標準, 每 2 位元組編碼為 3 個字元, 字元集避開 XML/URL 保留字元; 用於歐洲電子健康證明等 QR Code 場景。",
  "Base58": "比特幣等加密貨幣地址的編碼, 移除 0/O/I/l 易混淆字元且不含 +/; 輸出緊湊, 適合人工抄寫。",
  "Base62": "數字 + 大小寫字母共 62 字元, URL 短網址與短 ID 的最常用選擇, 文字緊湊且 URL 安全。",
  "Base64": "RFC 4648 標準 (含 +/), 每 3 位元組編碼為 4 字元; 文字協定 / JSON / DataURL 傳輸二進位的通用方案。",
  "Base64-URLSafe": "Base64 的 URL 變體 (-_ 取代 +/), JWT 與 URL 參數中無需再跳脫。",
  "Base85-Ascii85": "Adobe PostScript / PDF 官方編碼, 4 位元組編碼為 5 字元, 比 Base64 省約 25%; <~ ~> 包裹與 'z' 壓縮屬上層協定, 本工具為純字母表對應。",
  "Base85-ZeroMQ": "ZeroMQ 的 Z85 編碼, 字元集涵蓋常用可列印 ASCII, 用於二進位金鑰的文字傳輸。",
  "Base85-IPv6": "RFC 1924 提出的 IPv6 位址緊湊文字表示方案 (實驗性質)。",
  "Base91": "每 13 bit 編碼為 2 字元, 比 Base64 / Base85 更緊湊, 常用於壓縮資料的文字化; 無統一補齊規則, 不同實作需使用相同字母表。",
};

const enNotes: Record<string, string> = {
  "Base16": "Hexadecimal representation — each digit carries 4 bits. The most human-readable byte form, often used for hash digests, color values and protocol debugging; the output is about 2x the original byte length.",
  "Base32": "The most common Base32-style alphabet (A-Z plus digits 2-8), omitting confusable characters — about 40% more compact than Base16; often used for checksums, tokens and other text contexts.",
  "Base32-hex": "Extended-hex alphabet (0-9A-V), keeping the same lexicographic order as hexadecimal — used where stable ordering matters, e.g. DNSSEC.",
  "Base32-z-base-32": "A human-friendly alphabet designed by Zooko — it deliberately drops confusable characters and avoids spelling out English words; used by Zeronet and similar projects.",
  "Base32-Geohash": "The geohash alphabet (0-9 plus lowercase letters minus i/l/o) — it folds latitude/longitude into a short string for geocoding and proximity search.",
  "Base32-WordSafe": "The WordSafe alphabet (common in the Go ecosystem) — mixes upper/lowercase and digits without forming readable words, well suited to identifiers and filenames.",
  "Base36": "Digits plus 26 lowercase letters (36 chars) — common for short IDs, invite codes and redemption codes; results can be turned straight back into integers with parseInt and similar.",
  "Base45": "RFC 9285 standard — encodes 2 bytes into 3 characters with a charset that avoids XML/URL reserved characters; used in QR-code scenarios such as the European Digital COVID Certificate.",
  "Base58": "The encoding behind Bitcoin and other cryptocurrency addresses — it removes the confusable 0/O/I/l and has no +/; the compact output is convenient for hand transcription.",
  "Base62": "Digits plus upper/lowercase letters (62 chars) — the most common choice for URL shorteners and short IDs: compact and URL-safe.",
  "Base64": "The RFC 4648 standard (with +/) — encodes 3 bytes into 4 characters; the universal way to carry binary over text protocols / JSON / data URLs.",
  "Base64-URLSafe": "The URL-safe variant of Base64 (-_ instead of +/), so no escaping is needed inside JWTs or URL parameters.",
  "Base85-Ascii85": "The official Adobe PostScript / PDF encoding — 4 bytes become 5 characters, about 25% shorter than Base64; the <~ ~> framing and 'z' compression belong to the layer above, this tool is a pure alphabet mapping.",
  "Base85-ZeroMQ": "ZeroMQ's Z85 encoding — its charset covers the common printable ASCII range and is used to transmit binary keys as text.",
  "Base85-IPv6": "A compact textual representation for IPv6 addresses proposed in RFC 1924 (experimental).",
  "Base91": "Encodes 13 bits into 2 characters — more compact than Base64 / Base85, often used to textualize compressed data; there is no standard padding, so implementations must share the same alphabet.",
};

// BaseX 编码说明: 顶部为当前码型的详细说明 (随切换联动), 下方为通用简介与支持列表
const BaseXIntro = ({ code }: { code?: string }) => {
  const { locale } = useLocale();
  const alphabet = code ? codeMap.get(code) : undefined;
  const note = code
    ? locale === 'zh-TW'
      ? twNotes[code] ?? codeNotes.get(code)
      : locale === 'en'
        ? enNotes[code] ?? codeNotes.get(code)
        : codeNotes.get(code)
    : undefined;

  const t = {
    codeTitle: (c: string) =>
      locale === 'zh-TW' ? `${c} 編碼說明` : locale === 'en' ? `${c} — Encoding notes` : `${c} 编码说明`,
    alphaLen: (n: number) =>
      locale === 'zh-TW' ? `字母表長度 ${n} (即 ${n} 進位)` : locale === 'en' ? `Alphabet length ${n} (base ${n})` : `字母表长度 ${n} (即 ${n} 进制)`,
    alphabetLabel: locale === 'en' ? 'Alphabet: ' : '字母表: ',
    para:
      locale === 'zh-TW'
        ? `BaseX 編碼把任意位元組序列視為一個大整數, 再用目標字母表 (Alphabet) 做進位轉換, 得到一個僅含字母表字元的文字串。字母表長度即進位數:

  · 字母表越短, 編碼後文字越長 (Base16 每位表示 4 bit, Base32 每位 5 bit, Base64 每位 6 bit)
  · 字母表越長, 文字越緊湊 (Base85/Base91 常用於壓縮二進位資料後的文字表示)
  · 同一進位下編碼結果與位元組序、補齊規則密切相關, 不同實作可能無法互通`
        : locale === 'en'
          ? `BaseX encoding treats any byte sequence as one big integer and then converts it into the target alphabet, producing a text string made only of alphabet characters. The alphabet length is the base:

  · A shorter alphabet means longer output (Base16 carries 4 bits per digit, Base32 5 bits, Base64 6 bits)
  · A longer alphabet means more compact output (Base85/Base91 are common for rendering compressed binary as text)
  · Within the same base the result depends heavily on byte order and padding rules, so different implementations may not interoperate`
          : `BaseX 编码把任意字节序列视为一个大整数, 再用目标字母表(Alphabet)做进制转换, 得到一个仅含字母表字符的文本串。字母表长度即进制数:

  · 字母表越短, 编码后文本越长 (Base16 每位表示 4 bit, Base32 每位 5 bit, Base64 每位 6 bit)
  · 字母表越长, 文本越紧凑 (Base85/Base91 常用于压缩二进制数据后的文本表示)
  · 同一进制下编码结果与字节序、补齐规则强相关, 不同实现可能不互通`,
    head:
      locale === 'zh-TW'
        ? '本工具支援的碼型 (藍色為目前):'
        : locale === 'en'
          ? 'Supported code types (blue = current):'
          : '本工具支持的码型 (蓝色为当前):',
  };

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
            { t.codeTitle(code) }
            <span style={ { color: '#999', fontWeight: 400, marginLeft: 10, fontSize: 12 } }>
              { t.alphaLen(alphabet.length) }
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
            { t.alphabetLabel }{ alphabet }
          </div>
        </div>
      ) }

      <p style={ { whiteSpace: 'pre-line', margin: '4px 0 8px' } }>
        { t.para }
      </p>
      <p style={ { margin: '4px 0 4px' } }>{ t.head }</p>
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
