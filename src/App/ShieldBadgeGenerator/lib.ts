// Shield Badge 生成: shields.io 风格 SVG badge

export interface BadgeOpts {
  /** 左侧文字 (如 php) */
  label: string;
  /** 右侧状态文字 (如 8.0) */
  value: string;
  /** 文字颜色 (两段文字共用, 默认白) */
  fg: string;
  /** 状态段背景色 (右侧, 默认 shields 蓝) */
  status: string;
  /** 标签段背景色 (左侧, 默认 shields 深灰) */
  labelBg?: string;
}

export const BADGE_DEFAULTS = { fg: '#fff', status: '#007ec6', labelBg: '#555' } as const;

// XML 特殊字符转义
export const escapeXml = (s: string): string =>
  s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[m] as string);

// 文本宽度: 优先 canvas 精确测量 (运行环境), 无 canvas 时按字符数估算 (测试/SSR)
const FALLBACK_CHAR = 7.2; // Verdana 11px 平均字宽近似
const measureText = (text: string): number => {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.font = '11px "DejaVu Sans", Verdana, Geneva, sans-serif';
      return ctx.measureText(text).width;
    }
  } catch (e) { /* ignore */ }
  return text.length * FALLBACK_CHAR;
};

const segWidth = (text: string) => Math.ceil(measureText(text)) + 10;

/**
 * 生成 shields.io 风格 SVG badge (总高 20, 圆角 3, 双段 + 顶部光泽渐变 + 文字阴影)
 * 结构: <mask> 圆角裁剪 -> label 段(#555) + value 段(状态色) + 光泽层 -> 文字(带 1px 投影)
 */
export const buildBadgeSvg = (o: BadgeOpts): string => {
  const label = (o.label ?? '').trim();
  const value = (o.value ?? '').trim();
  const fg = o.fg || BADGE_DEFAULTS.fg;
  const status = o.status || BADGE_DEFAULTS.status;
  const labelBg = o.labelBg || BADGE_DEFAULTS.labelBg;

  const L = label ? segWidth(label) : 0;
  const R = value ? Math.max(segWidth(value), 10) : 0; // 状态段至少 10px
  const W = L + R;
  const H = 20;
  if (!L && !R) return ''; // 文字与状态均留空 -> 无内容

  const el = escapeXml(label);
  const ev = escapeXml(value);
  const lx = (L / 2).toFixed(1);
  const vx = (L + R / 2).toFixed(1);

  const paths = [];
  if (L > 0) paths.push(`<path fill="${labelBg}" d="M0 0h${L}v${H}H0z"/>`);
  if (R > 0) paths.push(`<path fill="${status}" d="M${L} 0h${R}v${H}H${L}z"/>`);
  paths.push(`<path fill="url(#b)" d="M0 0h${W}v${H}H0z"/>`);

  const texts = [];
  const shadow = (x: string, t: string) =>
    `<text x="${x}" y="15" fill="#010101" fill-opacity=".3">${t}</text><text x="${x}" y="14">${t}</text>`;
  if (L > 0) texts.push(shadow(lx, el));
  if (R > 0) texts.push(shadow(vx, ev));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`,
    `<linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`,
    `<mask id="a"><rect width="${W}" height="${H}" rx="3" fill="#fff"/></mask>`,
    `<g mask="url(#a)">${paths.join('')}</g>`,
    `<g fill="${fg}" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">${texts.join('')}</g>`,
    '</svg>',
  ].join('');
};

/** svg -> data URL (供 <img> 预览) */
export const svgToDataUrl = (svg: string): string =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/** 导出文件名: 文字-状态.svg (去非法文件名字符) */
export const badgeFileName = (label: string, value: string): string =>
  ((label || 'badge') + '-' + (value || 'status')).replace(/[\\/:*?"<>|]/g, '') + '.svg';
