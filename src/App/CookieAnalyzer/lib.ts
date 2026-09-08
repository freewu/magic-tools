// Cookie 分析 纯逻辑层
// 输入支持三种来源: ① Cookie 字符串 (a=1; b=2) ② HTTP Headers
// (Cookie:/Set-Cookie: 行) ③ document.cookie 赋值语句;
// 输出: JSON 对象 (name→value) / JSON 数组 (完整字段) / 表格。

export interface CookieItem {
  name: string;
  value: string;
  /** 来源分类 (表格展示用) */
  source: 'string' | 'headers';
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: string;
  sameSite?: string;
  secure: boolean;
  httpOnly: boolean;
  partitioned: boolean;
}

export type CookieInputKind = 'string' | 'headers' | 'document';

export function detectCookieInput(text: string): CookieInputKind {
  const s = String(text ?? '');
  if (/^\s*(?:set-cookie|cookie)\s*:/im.test(s)) return 'headers';
  if (/document\.cookie\s*=/.test(s)) return 'document';
  return 'string';
}

/** 拆分 cookie 键值对串; 返回 name→value(attr key→value|null) 顺序表 */
interface Seg { name: string; value: string; attr?: boolean }

function splitSegments(part: string): Seg[] {
  return part.split(';').map((p) => {
    const eq = p.indexOf('=');
    if (eq === -1) return { name: p.trim().toLowerCase(), value: '', attr: true };
    return { name: p.slice(0, eq).trim(), value: p.slice(eq + 1).trim() };
  });
}

const ATTR_KEYS = new Set(['domain', 'path', 'expires', 'max-age', 'samesite', 'secure', 'httponly', 'partitioned']);

/** 流式解析: 首段起新 cookie, 标准属性/裸标记挂当前, 未知 name=value 视为新 cookie */
function parseSegsToItems(segs: Seg[], source: CookieItem['source']): CookieItem[] {
  const items: CookieItem[] = [];
  let cur: CookieItem | null = null;
  for (const seg of segs) {
    if (seg.attr) {
      const lk = seg.name;
      if (!cur) continue;
      if (lk === 'secure') cur.secure = true;
      else if (lk === 'httponly') cur.httpOnly = true;
      else if (lk === 'partitioned') cur.partitioned = true;
      continue;
    }
    const lk = seg.name.toLowerCase();
    if (cur && ATTR_KEYS.has(lk)) {
      const v = seg.value;
      if (lk === 'domain' && v) cur.domain = v;
      else if (lk === 'path' && v) cur.path = v;
      else if (lk === 'expires' && v) cur.expires = v;
      else if (lk === 'max-age' && v) cur.maxAge = v;
      else if (lk === 'samesite' && v) cur.sameSite = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      continue;
    }
    cur = { name: seg.name, value: seg.value, source, secure: false, httpOnly: false, partitioned: false };
    items.push(cur);
  }
  return items;
}

/** 去掉 document.cookie 赋值外壳 (含首尾引号) */
function stripDocumentCookie(line: string): string | null {
  const m = /^\s*document\.cookie\s*=\s*(['"]?)(.*?)\1\s*;?$/.exec(line);
  return m ? m[2] : null;
}

/** 完整解析: 自动识别输入类型后输出 cookie 列表 */
export function parseCookies(input: string): { kind: CookieInputKind; items: CookieItem[] } {
  const text = String(input ?? '');
  const kind = detectCookieInput(text);
  const items: CookieItem[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const header = /^\s*(set-cookie|cookie)\s*:\s*(.*)$/i.exec(rawLine);
    if (header) {
      if (kind === 'headers') {
        items.push(...parseSegsToItems(splitSegments(header[2]), 'headers'));
      } else {
        items.push(...parseSegsToItems(splitSegments(header[2]), 'string'));
      }
      continue;
    }
    if (kind === 'headers') continue; // headers 模式下跳过非 Cookie/Set-Cookie 行
    const body = stripDocumentCookie(rawLine) ?? rawLine;
    items.push(...parseSegsToItems(splitSegments(body), 'string'));
  }
  return { kind, items };
}

/** JSON 对象: 仅 name → value (同名列后者覆盖; 用于快速构造请求 Cookie 头) */
export function cookiesToMap(items: CookieItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const it of items) map[it.name] = it.value;
  return map;
}

/** 重新拼回 "name=value; name2=value2" (可作 Cookie 头/下一次请求) */
export function cookiesToHeader(items: CookieItem[]): string {
  return items.map((it) => `${it.name}=${it.value}`).join('; ');
}

/** JSON 数组输出: 完整字段 (bool 全保留, 可选字段省略) */
export function cookiesToArray(items: CookieItem[]): Array<Record<string, unknown>> {
  return items.map((it) => {
    const o: Record<string, unknown> = {
      name: it.name,
      value: it.value,
      source: it.source,
      secure: it.secure,
      httpOnly: it.httpOnly,
      partitioned: it.partitioned,
    };
    if (it.domain) o.domain = it.domain;
    if (it.path) o.path = it.path;
    if (it.expires) o.expires = it.expires;
    if (it.maxAge) o.maxAge = it.maxAge;
    if (it.sameSite) o.sameSite = it.sameSite;
    return o;
  });
}
