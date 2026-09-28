// QrDecode 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '二維碼解析' },
  en: { appName: 'QR code decoder' },
} as const;

// 界面文案词条 (zh 短语即 key; 无命中回退 zh 原文)
const uilangRows: Record<string, [string, string]> = {
  // 操作
  '选择二维码图片': ['選擇二維碼圖片', 'Choose a QR image'],
  '重新选择': ['重新選擇', 'Choose another'],
  '清空': ['清空', 'Clear'],
  '清空历史': ['清空歷史', 'Clear history'],
  '复制': ['複製', 'Copy'],
  '保存为 TXT': ['儲存為 TXT', 'Save as TXT'],
  '打开链接': ['開啟連結', 'Open link'],
  '已复制解析结果': ['已複製解析結果', 'Result copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed — please copy manually'],
  '已保存 {file}': ['已儲存 {file}', 'Saved {file}'],
  '保存失败: {msg}': ['儲存失敗: {msg}', 'Save failed: {msg}'],

  // 参数
  '反色策略': ['反色策略', 'Inversion'],
  '图片最大边长': ['圖片最大邊長', 'Max image edge'],
  '自动尝试反色 (推荐)': ['自動嘗試反色 (推薦)', 'Try both (recommended)'],
  '只按原色解析': ['只按原色解析', 'Non-inverted only'],
  '只按反色解析 (深底浅码)': ['只按反色解析 (深底淺碼)', 'Inverted only (light code on dark)'],
  '优先按反色解析': ['優先按反色解析', 'Inverted first'],
  '不缩放 (原图)': ['不縮放 (原圖)', 'No scaling'],
  '不缩放': ['不縮放', 'No scaling'],

  // 上传区
  '拖拽二维码图片到此处, 或点击「选择二维码图片」': [
    '拖曳二維碼圖片到此處, 或點擊「選擇二維碼圖片」',
    'Drop a QR image here, or click “Choose a QR image”',
  ],
  '也可以直接把截图粘贴进来 (Ctrl / ⌘ + V)': [
    '也可以直接把截圖貼進來 (Ctrl / ⌘ + V)',
    'You can also paste a screenshot directly (Ctrl / ⌘ + V)',
  ],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片; 解析全在本地完成, 图片不会上传': [
    '支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片; 解析全在本機完成, 圖片不會上傳',
    'PNG / JPG / GIF / WebP / BMP and any image your browser can decode; decoding is local and nothing is uploaded',
  ],

  // 状态
  '解析中…': ['解析中…', 'Decoding…'],
  '未识别到二维码': ['未識別到二維碼', 'No QR code found'],
  '可尝试: 换一张更清晰 / 更完整的图; 把「反色策略」改成「自动尝试反色」; 截图时四周多留一点白边; 二维码太小可先放大图片再截一次': [
    '可嘗試: 換一張更清晰 / 更完整的圖; 把「反色策略」改成「自動嘗試反色」; 截圖時四周多留一點白邊; 二維碼太小可先放大圖片再截一次',
    'Try: a sharper and more complete image; set Inversion to “Try both”; leave a white margin around the code when cropping; enlarge a tiny code before capturing',
  ],
  '解析完成': ['解析完成', 'Decoded'],
  '解析失败': ['解析失敗', 'Decode failed'],
  '当前环境不支持 Canvas, 无法解析二维码': [
    '目前環境不支援 Canvas, 無法解析二維碼',
    'Canvas is unavailable in this environment — cannot decode',
  ],
  '图片尺寸过大, 单边不能超过 {n} px': [
    '圖片尺寸過大, 單邊不能超過 {n} px',
    'Image is too large — each side must stay under {n} px',
  ],
  '请选择图片文件': ['請選擇圖片檔案', 'Please choose an image file'],
  '图片读取失败': ['圖片讀取失敗', 'Could not read the image'],
  '图片解析失败': ['圖片解析失敗', 'Could not decode the image'],

  // 结果区
  '解析结果': ['解析結果', 'Result'],
  '内容类型': ['內容類型', 'Content type'],
  '结构化信息': ['結構化資訊', 'Structured data'],
  '编码信息': ['編碼資訊', 'Encoding'],
  '版本 V{v}': ['版本 V{v}', 'Version V{v}'],
  '数据段': ['資料段', 'Data segments'],
  '原始字节 ({n} 字节)': ['原始位元組 ({n} 位元組)', 'Raw bytes ({n} bytes)'],
  '{n} 字节': ['{n} 位元組', '{n} bytes'],
  '图片尺寸': ['圖片尺寸', 'Image size'],
  '解析尺寸': ['解析尺寸', 'Decoded size'],
  '解码用时': ['解碼用時', 'Decode time'],
  '{n} ms': ['{n} ms', '{n} ms'],
  '二维码位置': ['二維碼位置', 'QR position'],
  '共 {n} 个数据段': ['共 {n} 個資料段', '{n} segment(s)'],

  // 历史记录
  '历史记录': ['歷史記錄', 'History'],
  '暂无记录': ['暫無記錄', 'No records yet'],
  '点击可重新查看': ['點擊可重新查看', 'Click to view again'],
  '已从历史记录恢复': ['已從歷史記錄恢復', 'Restored from history'],
  '最多保留 {n} 条': ['最多保留 {n} 條', 'Keeps the latest {n}'],

  // 数据段类型
  '数字': ['數字', 'Numeric'],
  '字母数字': ['字母數字', 'Alphanumeric'],
  '字节': ['位元組', 'Bytes'],
  '日文汉字': ['日文漢字', 'Kanji'],
  'ECI 字符集': ['ECI 字元集', 'ECI charset'],
  '其它': ['其他', 'Other'],

  // 内容类型
  '网址': ['網址', 'URL'],
  'WiFi 配网': ['WiFi 配網', 'WiFi config'],
  '名片 (vCard)': ['名片 (vCard)', 'Contact (vCard)'],
  '名片 (MECARD)': ['名片 (MECARD)', 'Contact (MECARD)'],
  '邮件地址': ['郵件地址', 'Email address'],
  '电话号码': ['電話號碼', 'Phone number'],
  '短信': ['簡訊', 'SMS'],
  '坐标位置': ['座標位置', 'Geo location'],
  '动态口令 (OTP)': ['動態密碼 (OTP)', 'One-time password'],
  '纯文本': ['純文字', 'Plain text'],

  // 结构化字段名
  '加密方式': ['加密方式', 'Security'],
  '密码': ['密碼', 'Password'],
  '隐藏网络': ['隱藏網路', 'Hidden network'],
  '姓名': ['姓名', 'Name'],
  '组织': ['組織', 'Organization'],
  '职位': ['職稱', 'Title'],
  '电话': ['電話', 'Phone'],
  '邮箱': ['Email', 'Email'],
  '地址': ['地址', 'Address'],
  '备注': ['備註', 'Note'],
  '版本': ['版本', 'Version'],
  '生日': ['生日', 'Birthday'],
  '收件人': ['收件人', 'To'],
  '号码': ['號碼', 'Number'],
  '正文': ['內文', 'Body'],
  '主题': ['主旨', 'Subject'],
  '抄送': ['副本', 'Cc'],
  '密送': ['密件副本', 'Bcc'],
  '纬度': ['緯度', 'Latitude'],
  '经度': ['經度', 'Longitude'],
  '海拔': ['海拔', 'Altitude'],
  '查询': ['查詢', 'Query'],
  '类型': ['類型', 'Type'],
  '签发方': ['簽發方', 'Issuer'],
  '账号': ['帳號', 'Account'],
  '密钥': ['密鑰', 'Secret'],
  '位数': ['位數', 'Digits'],
  '周期 (秒)': ['週期 (秒)', 'Period (s)'],
  '算法': ['演算法', 'Algorithm'],

  // 说明区标题
  ' 二维码解析说明 ': [' 二維碼解析說明 ', ' About QR decoding '],
};

// 取词: 无命中回退 zh 原文
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};
