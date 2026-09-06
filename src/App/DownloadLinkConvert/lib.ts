// 下载链接转换
// 四种格式:
//  真实地址: http(s):// / ftp:// 等标准地址
//  迅雷地址: thunder:// + Base64("AA" + 真实地址 + "ZZ")
//  快车地址: qqdl:// + Base64(真实地址)
//  旋风地址: qdl:// + Base64(真实地址)

const b64Encode = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

const b64Decode = (s: string): string => {
  let bin = '';
  try {
    bin = atob(s.trim());
  } catch (e) {
    throw new Error('链接内容 Base64 解码失败');
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
};

export interface DownloadLinks {
  real: string;   // 真实地址
  thunder: string; // 迅雷地址
  qqdl: string;   // 快车地址
  qdl: string;    // 旋风地址
}

const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

export type DownloadFormat = keyof DownloadLinks;

export const DOWNLOAD_FORMATS: { value: DownloadFormat; label: string }[] = [
  { value: 'real', label: '真实地址' },
  { value: 'thunder', label: '迅雷地址' },
  { value: 'qqdl', label: '快车地址' },
  { value: 'qdl', label: '旋风地址' },
];

// 批量转换: 每行一条, 自动识别后统一转为目标格式; 空行忽略; 任一无效行抛错 (含行号)
export const batchConvert = (input: string, format: DownloadFormat): string => {
  const lines = input.split(/\r?\n/).map((l) => l.trim());
  const out: string[] = [];
  lines.forEach((line, idx) => {
    if (line === '') return;
    try {
      out.push(convertDownloadLink(line)[format]);
    } catch (err) {
      throw new Error('第 ' + (idx + 1) + ' 行: ' + (err instanceof Error ? err.message : String(err)));
    }
  });
  return out.join('\n');
};

// 自动识别输入并转换出四种格式; 无法识别时抛错
export const convertDownloadLink = (input: string): DownloadLinks => {
  const text = input.trim();
  if (text === '') throw new Error('请输入下载地址');

  let real: string;
  const m = /^(thunder|qqdl|qdl):\/\//i.exec(text);
  if (m) {
    const payload = text.slice(text.indexOf('://') + 3);
    const decoded = b64Decode(payload);
    if (m[1].toLowerCase() === 'thunder') {
      if (!decoded.startsWith('AA') || !decoded.endsWith('ZZ')) {
        throw new Error('迅雷地址内容无效 (缺少 AA/ZZ 标记)');
      }
      real = decoded.slice(2, decoded.length - 2);
    } else {
      real = decoded;
    }
  } else if (SCHEME_RE.test(text)) {
    real = text; // 已是真实地址
  } else {
    throw new Error('无法识别: 请输入 http(s)/ftp 真实地址, 或 thunder://、qqdl://、qdl:// 专用链接');
  }

  if (!SCHEME_RE.test(real)) throw new Error('识别结果不是有效地址: ' + real);

  return {
    real,
    thunder: 'thunder://' + b64Encode('AA' + real + 'ZZ'),
    qqdl: 'qqdl://' + b64Encode(real),
    qdl: 'qdl://' + b64Encode(real),
  };
};
