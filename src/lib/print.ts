/**
 * 打印辅助: 把一段 A4 版式的 HTML 交给系统打印对话框 (唤起打印机 🖨️)。
 *
 * 实现: 用一个离屏 iframe 承载待打印文档 —— 与页面自身样式完全隔离,
 * 应用里可以继续用深色主题, 打印出来永远是白底 A4 (也不会带上应用的字号/颜色)。
 * 调用方传入 body 片段与自己的版式 CSS (基于 PRINT_BASE_CSS 提供的 .pg 页面容器)。
 */

/** A4 纸张与默认页边距 (mm) */
export const A4_MM = { width: 210, height: 297, margin: 12 };

/** 打印文档基础样式: @page 尺寸 + 一页一个 .pg 容器 (调用方 CSS 需叠加在其后) */
export const PRINT_BASE_CSS = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pg {
  position: relative;
  width: ${A4_MM.width}mm;
  height: ${A4_MM.height}mm;
  padding: ${A4_MM.margin}mm;
  overflow: hidden;
  background: #fff;
  color: #111;
  page-break-after: always;
  break-after: page;
}
.pg:last-child { page-break-after: auto; break-after: auto; }
`;

/** HTML 文本转义 (标题等插入 head 的文本) */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PrintOptions {
  /** 打印任务名 (部分系统会显示为文档标题) */
  title?: string;
  /** 完整 CSS (通常 = PRINT_BASE_CSS + 工具自己的版式) */
  css?: string;
}

/** 离屏 iframe: 不占布局空间, 也不影响页面滚动 */
const FRAME_STYLE = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;background:#fff;';

/**
 * 打印给定 HTML (body 片段, 通常由多个 `.pg` 页面组成)
 * @returns 是否已触发打印 (无 document 等异常环境返回 false)
 */
export function printHtml(body: string, opts: PrintOptions = {}): boolean {
  if (typeof document === 'undefined' || body.trim() === '') return false;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('data-print-frame', '1');
  frame.style.cssText = FRAME_STYLE;
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return false;
  }

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">`
    + `<title>${escapeHtml(opts.title ?? 'print')}</title>`
    + `<style>${opts.css ?? PRINT_BASE_CSS}</style></head><body>${body}</body></html>`;

  try {
    doc.open();
    doc.write(html);
    doc.close();
  } catch (e) {
    frame.remove();
    return false;
  }

  const cleanup = () => { if (frame.parentNode) frame.remove(); };
  const fire = () => {
    try {
      win.focus();
      win.print();
    } catch (e) {
      /* 部分环境禁止未交互的 print(): 忽略, 用户可改用浏览器菜单打印 */
    }
    // 打印对话框关闭后移除 iframe; 少数环境不派发 afterprint, 兜底 2 分钟
    win.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 120000);
  };

  // 等 iframe 文档与字体就绪再唤起打印, 避免打出空白页
  if (doc.readyState === 'complete') setTimeout(fire, 80);
  else frame.addEventListener('load', () => setTimeout(fire, 80), { once: true });

  return true;
}
