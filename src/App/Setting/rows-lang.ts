// 设置中心 - 各工具「设置面板」行级文案的集中小词条表
// 说明: 这些短文案出现在 设置中心 各工具面板 (Form.Item 标签/开关/选项/占位/提示) 中;
// 以「源 zh 文案」为索引集中维护 zh-TW/en 翻译 (缺词条原样回退 zh-CN)。
// 各工具页面本体的长文案仍在各自 lang.ts, 本表只服务设置中心的行级小词条。
import type { LocaleId } from '../../i18n/lang';

type Row = [tw: string, en: string];

const ROWS: Record<string, Row> = {
  // ---- 通用词 ----
  '默认类型': ['預設類型', 'Default type'],
  '默认展示类型': ['預設顯示類型', 'Default display type'],
  '默认码型': ['預設碼型', 'Default code type'],
  '默认编码': ['預設編碼', 'Default encoding'],
  '默认制式': ['預設制式', 'Default system'],
  '默认公制单位': ['預設公制單位', 'Default metric unit'],
  '默认英制单位': ['預設英制單位', 'Default imperial unit'],
  '默认市制单位': ['預設市制單位', 'Default Chinese unit'],
  '默认日式单位': ['預設日式單位', 'Default Japanese unit'],
  '默认美制单位': ['預設美制單位', 'Default US unit'],
  '默认坐标类型': ['預設座標類型', 'Default coordinate type'],
  '默认输入格式': ['預設輸入格式', 'Default input format'],
  '默认输出格式': ['預設輸出格式', 'Default output format'],
  '默认格式': ['預設格式', 'Default format'],
  '默认尺寸': ['預設尺寸', 'Default size'],
  '默认语言': ['預設語言', 'Default language'],
  '默认字体': ['預設字型', 'Default font'],
  '默认缩进': ['預設縮排', 'Default indent'],
  '默认外观': ['預設外觀', 'Default appearance'],
  '默认模式': ['預設模式', 'Default mode'],
  '默认填充': ['預設填充', 'Default padding'],
  '默认密钥': ['預設金鑰', 'Default key'],
  '默认密钥口令': ['預設金鑰口令', 'Default passphrase'],
  '默认密钥长度': ['預設金鑰長度', 'Default key length'],
  '默认偏移量(IV)': ['預設偏移量(IV)', 'Default IV'],
  '默认 Nonce': ['預設 Nonce', 'Default Nonce'],
  '默认计数器': ['預設計數器', 'Default counter'],
  '默认循环次数': ['預設迴圈次數', 'Default rounds'],
  '默认位移量': ['預設位移量', 'Default shift'],
  '默认栏数': ['預設欄數', 'Default rails'],
  '默认加密方式': ['預設加密方式', 'Default hash method'],
  '默认公钥 (SPKI PEM)': ['預設公鑰 (SPKI PEM)', 'Default public key (SPKI PEM)'],
  '默认私钥 (PKCS#8 PEM)': ['預設私鑰 (PKCS#8 PEM)', 'Default private key (PKCS#8 PEM)'],
  '默认算法': ['預設演算法', 'Default algorithm'],
  '默认散列算法': ['預設雜湊演算法', 'Default hash algorithm'],
  '默认校验算法': ['預設校驗演算法', 'Default checksum algorithm'],
  '默认输出长度': ['預設輸出長度', 'Default output length'],
  '默认 SHAKE 输出长度': ['預設 SHAKE 輸出長度', 'Default SHAKE output length'],
  '默认 XOF 模式': ['預設 XOF 模式', 'Default XOF mode'],
  '默认盐值(Salt)': ['預設鹽值(Salt)', 'Default salt'],
  '默认密钥 (16 字符或 32 位 HEX)': ['預設金鑰 (16 字元或 32 位 HEX)', 'Default key (16 chars or 32-digit HEX)'],
  '默认私钥 (64 位 HEX)': ['預設私鑰 (64 位 HEX)', 'Default private key (64-digit HEX)'],
  '默认公钥 (04‖X‖Y HEX)': ['預設公鑰 (04‖X‖Y HEX)', 'Default public key (04‖X‖Y HEX)'],
  '默认容错等级': ['預設容錯等級', 'Default error correction level'],
  '默认生成尺寸': ['預設產生尺寸', 'Default output size'],
  '默认条宽': ['預設條寬', 'Default bar width'],
  '默认高度': ['預設高度', 'Default height'],
  '默认背景颜色': ['預設背景顏色', 'Default background color'],
  '默认文字颜色': ['預設文字顏色', 'Default text color'],
  '默认宽高': ['預設寬高', 'Default width & height'],
  '自定义预设尺寸': ['自訂預設尺寸', 'Custom size presets'],
  '默认内边距': ['預設內邊距', 'Default padding'],
  '默认显示行号': ['預設顯示行號', 'Show line numbers by default'],
  '默认开启批量取色': ['預設開啟批量取色', 'Batch color pick by default'],
  '默认最大批量取色个数': ['預設最大批量取色數量', 'Max batch color-pick count'],
  '默认展示配色板': ['預設顯示調色盤', 'Default color palette'],
  '默认 Opacity': ['預設 Opacity', 'Default opacity'],
  '默认编辑器风格': ['預設編輯器風格', 'Default editor theme'],
  // ---- 名称式 Divider ----
  'GPS坐标转换': ['GPS 座標轉換', 'GPS Coordinate Convert'],
  '字节转换': ['位元組轉換', 'Byte Convert'],
  '温度转换': ['溫度轉換', 'Temperature Convert'],
  '距离转换': ['距離轉換', 'Distance Convert'],
  '配置转换': ['設定轉換', 'Config Convert'],
  '速度转换': ['速度轉換', 'Speed Convert'],
  '重量转换': ['重量轉換', 'Weight Convert'],
  '面积转换': ['面積轉換', 'Area Convert'],
  'BCD 编解码': ['BCD 編解碼', 'BCD Codec'],
  'BaseX 编解码': ['BaseX 編解碼', 'BaseX Codec'],
  'Gzip 编解码': ['Gzip 編解碼', 'Gzip Codec'],
  '摩斯码常用编码': ['摩斯碼常用編碼', 'Common Morse Codes'],
  '二维码生成': ['二維碼產生', 'QR Code Generator'],
  '条形码生成': ['條碼產生', 'Barcode Generator'],
  '代码截图': ['程式碼截圖', 'Code Screenshot'],
  '占位图片': ['佔位圖片', 'Placeholder Image'],
  'ICO 生成': ['ICO 產生', 'ICO Generator'],
  'URL 提取': ['URL 擷取', 'URL Extract'],
  'HTML 格式化': ['HTML 格式化', 'HTML Format'],
  '正则表达式': ['正規表達式', 'Regex Tester'],
  'ASCII 文字': ['ASCII 文字', 'ASCII Text Art'],
  'htpasswd 生成': ['htpasswd 產生', 'htpasswd Generator'],
  'CSS 配色': ['CSS 配色', 'CSS Colors'],
  'ASCII / 文本': ['ASCII / 文字', 'ASCII / Text'],
  'HEX (十六进制)': ['HEX (十六進位)', 'HEX'],
  '普通': ['一般', 'Normal'],
  '标志': ['旗標', 'Flags'],
  // ---- 短动作 / 属性词 ----
  '显示': ['顯示', 'Show'],
  '隐藏': ['隱藏', 'Hide'],
  '显示内容': ['顯示內容', 'Show content'],
  '开启': ['開啟', 'On'],
  '关闭': ['關閉', 'Off'],
  '添加': ['新增', 'Add'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  '位': ['位元', 'bits'],
  '次': ['次', 'times'],
  '字节': ['位元組', 'bytes'],
  '2 空格': ['2 空格', '2 spaces'],
  '4 空格': ['4 空格', '4 spaces'],
  '每行一条数据': ['每行一筆資料', 'One item per line'],
  '展示默认字符串': ['顯示預設字串', 'Show a default sample string'],
  '结果大写展示': ['結果大寫顯示', 'Uppercase output'],
  '结果去重': ['結果去重', 'Deduplicate results'],
  'bcrypt 成本': ['bcrypt 成本', 'bcrypt cost'],
  '压缩结果展示格式': ['壓縮結果展示格式', 'Result display format'],
  '推导密钥长度': ['推導金鑰長度', 'Derived key length'],
  '推荐 128 / 256 / 512': ['建議 128 / 256 / 512', 'Recommended: 128 / 256 / 512'],
  '迭代次数': ['疊代次數', 'Iterations'],
  '选择 CRC 算法': ['選擇 CRC 演算法', 'CRC algorithm'],
  '正则标志位, 如 gim': ['正則旗標, 如 gim', 'Regex flags, e.g. gim'],
  '新预设名称': ['新預設名稱', 'New preset name'],
  '新预设正则表达式': ['新預設正規表達式', 'New preset regex'],
  '请填写名称与正则表达式': ['請填寫名稱與正規表達式', 'Please fill in the name and regex'],
  '请填写填入文本': ['請填寫填入文字', 'Please enter the text'],
  '常用正则列表, 保存后可在「正则表达式」工具下拉框里点击直接套用': ['常用正則清單, 儲存後可在「正規表達式」工具下拉框中點擊直接套用', 'Common regex presets — save them here, then click to apply them from the Regex tool dropdown'],
  '迭代 2^cost 次, 默认 10': ['疊代 2^cost 次, 預設 10', 'Iterates 2^cost times (default 10)'],
  '一键复制该正则规则': ['一鍵複製該正則規則', 'Copy this regex rule'],
  '正则表达式无效: ': ['正規表達式無效: ', 'Invalid regex: '],
  '填入文本': ['填入文字', 'Enter text'],
  '填入文本 (如 TU)': ['填入文字 (如 TU)', 'Enter text (e.g. TU)'],
  '说明 (含义)': ['說明 (含義)', 'Description (meaning)'],
  '说明 (如 谢谢)': ['說明 (如 謝謝)', 'Description (e.g. thanks)'],
  // ---- 通知 ----
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '已保存': ['已儲存', 'Saved'],
  '已恢复默认预设': ['已恢復預設', 'Default presets restored'],
  '恢复默认预设': ['恢復預設', 'Restore default presets'],
  '已添加': ['已新增', 'Added'],
  // ---- 长说明 (静态) ----
  '自定义常用编码, 保存后可在「摩斯码编解码」的常用编码下拉框中选中快速填充到明文与摩斯码区': ['自訂常用編碼, 儲存後可在「摩斯碼編解碼」的常用編碼下拉框中選中, 快速填入明文與摩斯碼區', 'Add custom code entries here. Once saved they appear in the common-code dropdown of the Morse Codec tool for quick filling of the plaintext / Morse fields.'],
  '暂无自定义编码, 在下方添加即可 (内置 CQ/SOS/Q简语/73 等无需配置)': ['尚無自訂編碼, 在下方新增即可 (內建 CQ/SOS/Q 簡語/73 等無需設定)', 'No custom codes yet — add them below. (Built-ins such as CQ / SOS / Q-codes / 73 need no configuration.)'],
  'Gzip 压缩结果默认以哪种格式展示 (Base64 更紧凑, Hex 可读性更好, 解压时两种格式都能自动识别)': ['Gzip 壓縮結果預設以何種格式顯示 (Base64 較緊湊, Hex 可讀性較佳; 解壓時兩種格式都能自動辨識)', 'Default display format for Gzip output (Base64 is more compact, Hex more readable; both are auto-detected when decompressing)'],
  '从文本提取链接时, 重复的 URL 只保留首次出现的一条; 关闭则每次出现都完整保留。工具页内也可临时切换, 此处修改将作为默认值。': ['從文字擷取連結時, 重複的 URL 只保留首次出現的一筆; 關閉則每次出現都完整保留。工具頁內也可暫時切換, 此處修改將作為預設值。', 'When extracting links from text, duplicate URLs keep only the first occurrence; when off, every occurrence is kept. The tool page also lets you toggle this temporarily — changes here become the default.'],
  '当前 ${padding}px': ['目前 ${padding}px', 'Current ${padding}px'],
  '已添加 ${cw}×${ch}': ['已新增 ${cw}×${ch}', 'Added ${cw}×${ch}'],
  '共收录 ${FONT_NAMES.length} 款 figlet 字体': ['共收錄 ${FONT_NAMES.length} 款 figlet 字型', 'Includes ${FONT_NAMES.length} figlet fonts'],
  '打开「占位图片」工具时默认填入的宽高 (默认 ${w}×${h})': ['開啟「佔位圖片」工具時預設填入的寬高 (預設 ${w}×${h})', 'Default width & height filled in when the Placeholder Image tool opens (default ${w}×${h})'],
  '自定义预设最多 10 个': ['自訂預設最多 10 個', 'At most 10 custom presets'],
  '该尺寸已在自定义列表中': ['該尺寸已在自訂清單中', 'This size is already in the custom list'],
  '请填写宽和高': ['請填寫寬與高', 'Please enter the width and height'],
  '自定义尺寸会出现在「占位图片」工具页的预设下拉中, 便于一键填充 (上限 10 个)': ['自訂尺寸會出現在「佔位圖片」工具頁的預設下拉中, 方便一鍵填入 (上限 10 個)', 'Custom sizes appear in the preset dropdown of the Placeholder Image tool for one-click filling (max 10)'],
  '打开页面时 SHAKE128/256 的输出长度 (bit), 须为 8 的整数倍': ['開啟頁面時 SHAKE128/256 的輸出長度 (bit), 須為 8 的整數倍', 'Output length (bit) of SHAKE128/256 used when the page opens; must be a multiple of 8'],
  '口令经 SHA-256 派生为 32 字节密钥': ['口令經 SHA-256 衍生為 32 位元組金鑰', 'The passphrase is derived into a 32-byte key via SHA-256'],
  '24 位 HEX (12 字节)': ['24 位 HEX (12 位元組)', '24-digit HEX (12 bytes)'],
  '64 位 HEX; 留空表示不配置; 用于解密, 请妥善保管': ['64 位 HEX; 留空表示不設定; 用於解密, 請妥善保管', '64-digit HEX; leave empty to skip. Used for decryption — keep it safe'],
  '04 开头共 130 位 HEX, 由生成或「从私钥推导公钥」得到; 留空表示不配置': ['04 開頭共 130 位 HEX, 由生成或「從私鑰推導公鑰」取得; 留空表示不設定', '130-digit HEX starting with 04, obtained by generation or deriving the public key from the private key; leave empty to skip'],
  '4 个字母 = 2×2 (如 HILL) / 9 个字母 = 3×3 (如 GYBNQKURP), 留空表示不配置': ['4 個字母 = 2×2 (如 HILL) / 9 個字母 = 3×3 (如 GYBNQKURP), 留空表示不設定', '4 letters = 2×2 (e.g. HILL) / 9 letters = 3×3 (e.g. GYBNQKURP); leave empty to skip'],
  '英文字母, 例如 LEMON (留空表示不配置)': ['英文字母, 例如 LEMON (留空表示不設定)', 'English letters, e.g. LEMON (leave empty to skip)'],
  '留空表示不配置; 用于解密, 请妥善保管': ['留空表示不設定; 用於解密, 請妥善保管', 'Leave empty to skip; used for decryption — keep it safe'],
  '留空表示不配置; 用于「RSA 加解密」页加密': ['留空表示不設定; 用於「RSA 加解密」頁加密', 'Leave empty to skip; used for encryption in the RSA tool'],
};

/**
 * 行级文案取词: locale + zh 原文 -> 对应语言文案 (无词条回退 zh)
 */
export const row = (locale: LocaleId, zh: string): string => {
  const r = ROWS[zh];
  if (!r) return zh;
  if (locale === 'zh-TW') return r[0];
  if (locale === 'en') return r[1];
  return zh;
};

/**
 * 含 {var} 模板的行级文案 (与 row 同表, 占位符沿用原文写法 ${x})
 */
export const rowT = (
  locale: LocaleId,
  zh: string,
  vars?: Record<string, string | number>
): string => {
  let s = row(locale, zh);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split('${' + k + '}').join(String(v));
    }
  }
  return s;
};
