// 通用 SVG 处理工具 (绘图类工具共用)
// 职责: SVG 尺寸解析 / 导出前处理、SVG 与 data URL 互转、SVG 光栅化为位图。
// 原先只服务于 Mermaid 编辑器, 现抽出为公共层 (MermaidEditor/lib.ts 仍原样再导出, 保持既有导入路径可用)。
// 只依赖浏览器 API (Image + canvas), 不依赖 React。

export interface SvgSize { width: number; height: number; }

const SVG_NS = 'http://www.w3.org/2000/svg';

const rootTagOf = (svg: string): string => (/<svg\b[^>]*>/i.exec(svg) ?? [ '' ])[0];

const numberAttr = (tag: string, name: string): number | null => {
  const m = new RegExp(`(^|\\s)${name}="([^"]*)"`, 'i').exec(tag);
  if (!m) return null;
  const raw = m[2].trim();
  if (/%$/.test(raw)) return null; // 百分比宽度无法用于位图导出
  const v = parseFloat(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
};

/**
 * 解析 SVG 的像素尺寸
 * mermaid 默认输出 `<svg ... width="100%" style="max-width:300px" viewBox="0 0 300 200">`,
 * 因此优先取数值型 width/height, 否则回退 viewBox 的宽高。
 */
export const parseSvgSize = (svg: string): SvgSize | null => {
  const tag = rootTagOf(svg);
  if (!tag) return null;
  const w = numberAttr(tag, 'width');
  const h = numberAttr(tag, 'height');
  if (w && h) return { width: w, height: h };
  const vb = /(^|\s)viewBox="([^"]*)"/i.exec(tag);
  if (vb) {
    const p = vb[2].trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p.every((n) => Number.isFinite(n)) && p[2] > 0 && p[3] > 0) {
      return { width: p[2], height: p[3] };
    }
  }
  return null;
};

/** 按倍率放大尺寸 (四舍五入到整像素, 避免 canvas 尺寸为小数) */
export const scaleSize = (size: SvgSize, scale: number): SvgSize => ({
  width: Math.max(1, Math.round(size.width * scale)),
  height: Math.max(1, Math.round(size.height * scale)),
});

/**
 * 导出前的 SVG 处理: 把根节点的 width/height 固定为像素值 (mermaid 输出的是 100%),
 * 并补上 xmlns / xmlns:xlink (脱离 DOM 作为独立文件 / data URL 时必须声明)。
 * viewBox 保留, 因此缩放不失真。
 */
export const prepareSvgForExport = (svg: string, size: SvgSize): string => {
  const tag = rootTagOf(svg);
  if (!tag) return svg;
  const start = svg.indexOf(tag);
  let next = tag
    .replace(/(^|\s)width="[^"]*"/i, '')
    .replace(/(^|\s)height="[^"]*"/i, '');
  if (!/(^|\s)xmlns=/i.test(next)) next = next.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  if (!/(^|\s)xmlns:xlink=/i.test(next)) next = next.replace(/^<svg/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  if (!/(^|\s)viewBox=/i.test(next)) next = next.replace(/^<svg/i, `<svg viewBox="0 0 ${size.width} ${size.height}"`);
  next = next.replace(/^<svg/i, `<svg width="${size.width}" height="${size.height}"`);
  return svg.slice(0, start) + next + svg.slice(start + tag.length);
};

// ---------------- data URL ----------------

/** UTF-8 字符串 -> base64 (btoa 只接受 Latin-1, 中文 / emoji 需要先转字节) */
export const utf8ToBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

/** SVG 文本 -> data URL (base64, 避免 # / 中文等字符在 URL 中出问题) */
export const svgToDataUrl = (svg: string): string => `data:image/svg+xml;base64,${utf8ToBase64(svg)}`;

/** data URL -> 字节 (兼容 base64 与 URL 编码两种形式) */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const comma = dataUrl.indexOf(',');
  const head = comma < 0 ? '' : dataUrl.slice(0, comma);
  const body = comma < 0 ? dataUrl : dataUrl.slice(comma + 1);
  if (!/;base64$/i.test(head)) return new TextEncoder().encode(decodeURIComponent(body));
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

// ---------------- 光栅化 (Image + canvas) ----------------

export interface RasterOptions {
  size: SvgSize;
  mime: string;
  /** canvas 底色; null / 省略 = 透明 */
  background?: string | null;
  /** WebP 有损压缩质量 0~1 */
  quality?: number;
}

/**
 * SVG -> 位图 data URL (PNG / WebP)
 * 走 Image + canvas: SVG 为矢量, 通过 canvas 尺寸实现多倍图放大后再导出。
 * 背景色直接画在 canvas 上 (SVG 本身保持透明), 这样「透明背景」就是不加底色。
 */
export const rasterizeSvg = (svg: string, opts: RasterOptions): Promise<string> =>
  new Promise((resolve, reject) => {
    const { size, mime, background, quality } = opts;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法创建 canvas 绘图上下文');
        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, size.width, size.height);
        }
        ctx.drawImage(img, 0, 0, size.width, size.height);
        resolve(canvas.toDataURL(mime, quality));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error('SVG 图像解码失败'));
    img.src = svgToDataUrl(svg);
  });

/** 当前浏览器是否支持 WebP 编码 (canvas.toDataURL 探测) */
export const supportsWebp = (): boolean => {
  try {
    return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

// ---------------- DOM 侧: 克隆场景图并导出为独立 SVG ----------------

export interface SvgBox { x: number; y: number; width: number; height: number; }

/**
 * 把画布 (可能是带缩放/平移的交互画布) 克隆成一份独立 SVG 文本
 * - 去掉内容层 <g> 上的交互 transform, 让内容回到原始坐标系
 * - 用 box 重写根节点 width / height / viewBox, 使导出结果恰好包住内容
 * - 强制可见: 去掉 foreignObject 上动画残留的 opacity (否则动画未结束时会导出空白)
 */
export const exportSvgFromCanvas = (node: SVGSVGElement, box: SvgBox): string => {
  const clone = node.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('foreignObject').forEach((fo) => fo.removeAttribute('style'));
  const content = Array.from(clone.children).find((el) => el.tagName.toLowerCase() === 'g');
  content?.removeAttribute('transform');
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('width', String(box.width));
  clone.setAttribute('height', String(box.height));
  clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
  if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  return new XMLSerializer().serializeToString(clone);
};
