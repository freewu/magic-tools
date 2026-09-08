import {
  buildBadgeSvg, svgToDataUrl, badgeFileName, escapeXml, BADGE_DEFAULTS, parseSvgSize,
} from './lib';

describe('Shield Badge 生成', () => {
  it('示例结构: 双段 path + 光泽 + 文字与阴影', () => {
    const svg = buildBadgeSvg({ label: 'php', value: '8.0', fg: '#fff', status: '#007ec6' });
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('height="20"');
    expect(svg).toContain('linearGradient id="b"');
    expect(svg).toContain('<mask id="a">');
    expect(svg).toContain('rx="3"');
    expect(svg).toContain('fill="#555"');      // label 段底色
    expect(svg).toContain('fill="#007ec6"');   // 状态段底色
    expect(svg).toContain('>php</text>');      // label 文字
    expect(svg).toContain('y="14">php</text>'); // 主文字 (y14, 影子在 y15)
    expect(svg).toContain('8.0');
    expect(svg).toContain('font-size="11"');
    expect(svg).toContain('fill-opacity=".3"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('文本宽度按 fallback 计算 (无 canvas 环境确定性)', () => {
    // php: 3 字符 -> ceil(3*7.2)+10 = 32; 8.0 同 32; 总宽 64
    const svg = buildBadgeSvg({ label: 'php', value: '8.0', fg: '#fff', status: '#007ec6' });
    expect(svg).toContain('width="64"');
    // 两段文字 x 中心: label 16, value 48
    expect(svg).toContain('x="16.0"');
    expect(svg).toContain('x="48.0"');
  });

  it('空 label 时不生成左侧段与文字, 状态段贴左', () => {
    const svg = buildBadgeSvg({ label: '   ', value: 'passing', fg: '#fff', status: '#4c1' });
    expect(svg).toMatch(/<path fill="#4c1" d="M0 0h\d+v20H0z"\/>/); // 状态段从 x=0 开始
    expect(svg).not.toContain('fill="#555"');
    expect(svg).not.toContain('x="16.0"');
    expect(svg).toContain('passing');
  });

  it('文字与状态均空返回空串', () => {
    expect(buildBadgeSvg({ label: '  ', value: ' ', fg: '#fff', status: '#4c1' })).toBe('');
  });

  it('parseSvgSize 解析声明尺寸, 空串返回 null', () => {
    const svg = buildBadgeSvg({ label: 'php', value: '8.0', fg: '#fff', status: '#007ec6' });
    expect(parseSvgSize(svg)).toEqual({ w: 64, h: 20 });
    expect(parseSvgSize('')).toBeNull();
    expect(parseSvgSize(buildBadgeSvg({ label: '   ', value: 'passing', fg: '#fff', status: '#4c1' }))?.h).toBe(20);
  });

  it('XML 特殊字符转义', () => {
    const svg = buildBadgeSvg({ label: 'a&b<c>', value: '"d\'', fg: '#fff', status: '#4c1' });
    expect(svg).toContain('a&amp;b&lt;c&gt;');
    expect(svg).toContain('&quot;d&apos;');
    // 去掉全部标签后, 文字内容不得残留裸 & < > (实体 &amp; 等属合法)
    const body = svg.replace(/<[^>]+>/g, ' ');
    expect(body).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
    expect(body).not.toMatch(/[<>]/);
  });

  it('自定义颜色: 文字/状态/label 底色均写入', () => {
    const svg = buildBadgeSvg({ label: 'x', value: 'y', fg: '#123456', status: '#abcdef', labelBg: '#111' });
    expect(svg).toContain('fill="#111"');
    expect(svg).toContain('fill="#abcdef"');
    expect(svg).toContain('fill="#123456"');
    expect(svg).not.toContain('fill="#555"');
  });

  it('labelBg 缺省用默认 #555', () => {
    expect(BADGE_DEFAULTS.labelBg).toBe('#555');
    const svg = buildBadgeSvg({ label: 'a', value: 'b', fg: '#fff', status: '#4c1' });
    expect(svg).toContain('fill="#555"');
  });

  it('svgToDataUrl 前缀与编码', () => {
    const url = svgToDataUrl('<svg></svg>');
    expect(url).toContain('data:image/svg+xml;charset=utf-8,');
    expect(url).toContain('%3Csvg');
  });

  it('导出文件名清理非法字符并保留中文', () => {
    expect(badgeFileName('a/b:c*?"<>|', 'pass')).toBe('abc-pass.svg');
    expect(badgeFileName('版本', '1.0')).toBe('版本-1.0.svg');
    expect(badgeFileName('', '')).toBe('badge-status.svg');
  });

  it('escapeXml 映射正确', () => {
    expect(escapeXml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    expect(escapeXml("it's")).toBe('it&apos;s');
  });
});
