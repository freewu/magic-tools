import { Alert, Button, Card, Divider, Input, Segmented, Select, Space, Tooltip, message } from 'antd';
import { CopyOutlined, DownloadOutlined, ExpandOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { useTheme } from '../../hook/theme-context';
import { copyTextToClipboard } from '../../lib';
import { fileNameOf } from '../../lib/file';
import { saveBytesFile, savePngFile, saveTextFile } from '../../lib/tauri';
import { dataUrlToBytes, exportSvgFromCanvas, rasterizeSvg, supportsWebp, type SvgBox } from '../../lib/svg';
import {
  BACKGROUND_OPTIONS,
  COLOR_DEFAULT,
  COLOR_SCHEMES,
  COLOR_SCHEME_KEYS,
  DEFAULT_FILE_BASE,
  DEFAULT_SCALE,
  DEPTH_ALL,
  DEPTH_OPTIONS,
  EXPORT_PADDING,
  FONT_DEFAULT,
  FONT_SIZES,
  PREVIEW_HEIGHT,
  RASTER_QUALITY,
  SAMPLES,
  SCALE_OPTIONS,
  type RasterBackground,
} from './data';
import {
  exportBaseName,
  exportBoxOf,
  getDefaultColorScheme,
  getDefaultDepth,
  getDefaultSample,
  isBlankMarkdown,
  loadMarkmap,
  markdownStats,
  outlineInfo,
  viewOptions,
  type MindMapInstance,
  type OutlineInfo,
} from './lib';
import { u, uT } from './lang';
import MindMapIntro from './intro';

const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace';

type ExportFormat = 'svg' | 'png' | 'webp';

/** Markdown 变化后延迟渲染 (输入停顿再重排, 避免每敲一个字符重绘整棵树) */
const RENDER_DELAY = 250;

/** 透明背景用棋盘格表示 (与位图导出的透明通道对应) */
const PREVIEW_CSS = [
  '.mindmap-preview-checker {',
  '  background-image: linear-gradient(45deg, rgba(128,128,128,0.22) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.22) 75%),',
  '    linear-gradient(45deg, rgba(128,128,128,0.22) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.22) 75%);',
  '  background-size: 16px 16px;',
  '  background-position: 0 0, 8px 8px;',
  '}',
  '.mindmap-preview-checker svg { outline: none; }',
].join('\n');

const EMPTY_INFO: OutlineInfo = { total: 0, depth: 0 };

const MindMap: React.FC = () => {
  const { locale } = useLocale();
  const { isDark } = useTheme();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);

  // 初始值来自设置中心的默认项
  const [sampleId, setSampleId] = useState(() => getDefaultSample());
  const [code, setCode] = useState(() => {
    const id = getDefaultSample();
    return SAMPLES.find((s) => s.id === id)?.code ?? '';
  });
  const [scheme, setScheme] = useState(() => getDefaultColorScheme());
  const [depth, setDepth] = useState(() => getDefaultDepth());
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  // 深色模式下默认用深色底导出, 否则位图导出会是浅字白底
  const [bg, setBg] = useState<RasterBackground>(() => (isDark ? 'dark' : 'white'));
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [busy, setBusy] = useState<ExportFormat | ''>('');
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [box, setBox] = useState<SvgBox | null>(null);
  const [info, setInfo] = useState<OutlineInfo>(EMPTY_INFO);
  const [webpOk] = useState(() => supportsWebp());

  const svgRef = useRef<SVGSVGElement | null>(null);
  const instRef = useRef<{ el: SVGSVGElement; mm: MindMapInstance } | null>(null);
  const seqRef = useRef(0);
  const bgTouchedRef = useRef(false);
  const blank = isBlankMarkdown(code);
  // 深色底配浅色文字 (与「背景」联动, 否则深色模式下导出白底 + 浅字会看不清)
  const darkBg = bg === 'dark';

  // 主题切换时联动默认背景 (用户手动选过则不再改)
  useEffect(() => {
    if (!bgTouchedRef.current) setBg(isDark ? 'dark' : 'white');
  }, [isDark]);

  // 渲染: markmap 实例按「预览是否显示」创建/销毁, 数据与参数每次都重建 (fit 后记录内容包围盒用于导出)
  useEffect(() => {
    if (!showPreview) {
      instRef.current?.mm.destroy();
      instRef.current = null;
      setBox(null);
      setInfo(EMPTY_INFO);
      setError('');
      setRendering(false);
      return;
    }
    if (blank) {
      // 空大纲不建实例: 直接清空预览与可导出状态
      instRef.current?.mm.destroy();
      instRef.current = null;
      setBox(null);
      setInfo(EMPTY_INFO);
      setError('');
      setRendering(false);
      return;
    }
    const el = svgRef.current;
    if (!el) return;
    let cancelled = false;
    const seq = ++seqRef.current;
    setRendering(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const kit = await loadMarkmap();
          if (cancelled || seq !== seqRef.current) return;
          const { root, frontmatter } = kit.transform(code);
          const options = viewOptions(kit.deriveOptions, { scheme, depth, fontSize, darkBg }, frontmatter);
          let inst = instRef.current && instRef.current.el === el ? instRef.current.mm : null;
          if (!inst) {
            instRef.current?.mm.destroy();
            inst = kit.Markmap.create(el, options, root);
            instRef.current = { el, mm: inst };
          }
          // setData 会重建整棵树 (含折叠状态), 因此配色 / 层级 / 字号 / 主题变化也走这里
          else await inst.setData(root, options);
          if (cancelled || seq !== seqRef.current) return;
          await inst.fit();
          if (cancelled || seq !== seqRef.current) return;
          setBox(exportBoxOf(inst.state.rect));
          setInfo(outlineInfo(root));
          setError('');
        } catch (err) {
          if (cancelled || seq !== seqRef.current) return;
          // 渲染失败时销毁实例; 承载 svg 的容器必须保留 (下次修好后才拿得到元素)
          instRef.current?.mm.destroy();
          instRef.current = null;
          setBox(null);
          setInfo(EMPTY_INFO);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          if (!cancelled && seq === seqRef.current) setRendering(false);
        }
      })();
    }, RENDER_DELAY);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ code, blank, scheme, depth, fontSize, darkBg, showPreview ]);

  const stats = useMemo(() => markdownStats(code), [ code ]);
  const bgColor = useMemo(() => BACKGROUND_OPTIONS.find((o) => o.value === bg)?.color ?? null, [ bg ]);
  const sampleOptions = useMemo(
    () => SAMPLES.map((s) => ({ value: s.id, label: t(s.label), title: t(s.desc) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  const colorOptions = useMemo(
    () => COLOR_SCHEME_KEYS.map((k) => ({ value: k, label: t(COLOR_SCHEMES[k].label) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  const depthOptions = useMemo(
    () => DEPTH_OPTIONS.map((n) => ({ value: n, label: n === DEPTH_ALL ? t('全部展开') : tt('仅展开 {n} 层', { n }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  const canExport = !!box && !error;

  const copy = async (text: string, tip: string) => {
    try {
      await copyTextToClipboard(text);
      message.success(tip);
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };

  const fitView = async () => {
    const inst = instRef.current?.mm;
    if (!inst) return;
    await inst.fit();
    setBox(exportBoxOf(inst.state.rect));
    message.success(t('已适应窗口'));
  };

  const exportAs = async (format: ExportFormat) => {
    const el = svgRef.current;
    const inst = instRef.current?.mm;
    // 折叠 / 缩放会改变布局, 因此导出时按当前布局重新取包围盒
    const live = exportBoxOf(inst?.state.rect, EXPORT_PADDING) ?? box;
    if (!el || !live || !inst) {
      message.warning(t('没有可导出的内容'));
      return;
    }
    setBusy(format);
    try {
      const svgText = exportSvgFromCanvas(el, live);
      if (format === 'svg') {
        const name = fileNameOf(exportBaseName(code, sampleId), 'svg', DEFAULT_FILE_BASE);
        const ok = await saveTextFile(name, svgText, t('导出 SVG'), { filterName: 'SVG 图片', extensions: [ 'svg' ] });
        if (ok) message.success(tt('已导出 {file}', { file: name }));
        return;
      }
      const target = {
        width: Math.max(1, Math.round(live.width * scale)),
        height: Math.max(1, Math.round(live.height * scale)),
      };
      const dataUrl = await rasterizeSvg(svgText, {
        size: target,
        mime: format === 'png' ? 'image/png' : 'image/webp',
        background: bgColor,
        quality: RASTER_QUALITY,
      });
      const name = fileNameOf(exportBaseName(code, sampleId), format, DEFAULT_FILE_BASE);
      const ok = format === 'png'
        ? await savePngFile(name, dataUrl)
        : await saveBytesFile(name, dataUrlToBytes(dataUrl), { title: t('导出 WebP'), filterName: 'WebP 图片', extensions: [ 'webp' ] });
      if (ok) message.success(tt('已导出 {file}', { file: name }));
    } catch (err) {
      message.error(tt('导出失败: {msg}', { msg: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy('');
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space size={8} wrap>
        <Button
          size="small"
          icon={showEditor ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setShowEditor(!showEditor)}
        >{t(showEditor ? '隐藏输入' : '显示输入')}</Button>
        <Button
          size="small"
          icon={showPreview ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setShowPreview(!showPreview)}
        >{t(showPreview ? '隐藏预览' : '显示预览')}</Button>
      </Space>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {showEditor && (
          <Card
            size="small"
            title={t('Markdown 大纲')}
            style={{ flex: '1 1 420px', minWidth: 320 }}
            extra={
              <Space size={8}>
                <Select
                  size="small"
                  showSearch
                  value={sampleId || undefined}
                  placeholder={t('示例')}
                  style={{ minWidth: 190 }}
                  optionFilterProp="label"
                  onChange={(v) => {
                    const s = SAMPLES.find((x) => x.id === v);
                    if (!s) return;
                    setSampleId(s.id);
                    setCode(s.code);
                  }}
                  options={sampleOptions}
                />
                <Button size="small" icon={<CopyOutlined />} disabled={!code} onClick={() => { void copy(code, t('已复制大纲')); }}>{t('复制大纲')}</Button>
                <Button size="small" danger disabled={!code} onClick={() => { setCode(''); setSampleId(''); }}>{t('清空')}</Button>
              </Space>
            }
          >
            <Input.TextArea
              value={code}
              onChange={(e) => { setCode(e.target.value); setSampleId(''); }}
              style={{ minHeight: 420, fontFamily: MONO, fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
              placeholder={t('在此输入 Markdown 大纲…')}
            />
            <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>
              {tt('{l} 行 / {c} 字符 / {h} 个标题', { l: stats.lines, c: stats.chars, h: stats.headings })}
              {info.total > 0 ? ` · ${tt('{n} 个节点 · {d} 层', { n: info.total, d: info.depth })}` : ''}
            </div>
          </Card>
        )}
        {showPreview && (
          <Card
            size="small"
            title={t('预览')}
            style={{ flex: '1 1 460px', minWidth: 320 }}
            extra={
              <Space size={8} wrap>
                <Tooltip title={t('导出 SVG (矢量, 透明背景)')}>
                  <Button size="small" icon={<DownloadOutlined />} disabled={!canExport} loading={busy === 'svg'} onClick={() => { void exportAs('svg'); }}>{t('导出 SVG')}</Button>
                </Tooltip>
                <Button size="small" type="primary" icon={<DownloadOutlined />} disabled={!canExport} loading={busy === 'png'} onClick={() => { void exportAs('png'); }}>{t('导出 PNG')}</Button>
                <Tooltip title={webpOk ? t('「背景 / 缩放」仅作用于位图导出与预览; 矢量 SVG 导出时始终透明') : t('当前浏览器不支持 WebP 导出, 请改用 PNG')}>
                  <Button size="small" icon={<DownloadOutlined />} disabled={!canExport || !webpOk} loading={busy === 'webp'} onClick={() => { void exportAs('webp'); }}>{t('导出 WebP')}</Button>
                </Tooltip>
                <Button size="small" icon={<CopyOutlined />} disabled={!canExport} onClick={() => {
                  const el = svgRef.current;
                  const live = exportBoxOf(instRef.current?.mm.state.rect, EXPORT_PADDING) ?? box;
                  if (!el || !live) return;
                  void copy(exportSvgFromCanvas(el, live), t('已复制 SVG'));
                }}>{t('复制 SVG')}</Button>
                <Button size="small" icon={<ExpandOutlined />} disabled={!canExport} onClick={() => { void fitView(); }}>{t('适应窗口')}</Button>
              </Space>
            }
          >
            <Space size={16} wrap style={{ marginBottom: 10 }}>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('配色')}</span>
                <Select
                  size="small"
                  value={scheme}
                  style={{ width: 130 }}
                  onChange={(v) => setScheme(v)}
                  options={colorOptions}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('展开层级')}</span>
                <Select
                  size="small"
                  value={depth}
                  style={{ width: 140 }}
                  onChange={(v) => setDepth(v)}
                  options={depthOptions}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('字号')}</span>
                <Segmented
                  size="small"
                  value={fontSize}
                  onChange={(v) => setFontSize(Number(v))}
                  options={FONT_SIZES.map((n) => ({ label: String(n), value: n }))}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('背景')}</span>
                <Segmented
                  size="small"
                  value={bg}
                  onChange={(v) => { bgTouchedRef.current = true; setBg(v as RasterBackground); }}
                  options={BACKGROUND_OPTIONS.map((o) => ({ label: t(o.label), value: o.value }))}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('缩放')}</span>
                <Segmented
                  size="small"
                  value={scale}
                  onChange={(v) => setScale(Number(v))}
                  options={SCALE_OPTIONS.map((n) => ({ label: n === 1 ? t('1x (自适应)') : `${n}x`, value: n }))}
                />
              </Space>
            </Space>
            {error && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 10 }}
                message={t('渲染失败')}
                description={
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: MONO, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{error}</pre>
                }
              />
            )}
            {blank && !error && (
              <div style={{ color: '#999', padding: `${Math.round(PREVIEW_HEIGHT / 3)}px 0`, textAlign: 'center' }}>
                {t('还没内容, 在左侧输入 Markdown 大纲')}
              </div>
            )}
            {/* 画布容器常驻 (出错 / 空大纲时只是不可见), 否则 svg 被卸载后无法重新渲染 */}
            <div
              className={bgColor ? 'mindmap-preview' : 'mindmap-preview mindmap-preview-checker'}
              style={{
                position: 'relative',
                height: PREVIEW_HEIGHT,
                overflow: 'auto',
                border: '1px solid rgba(128,128,128,0.2)',
                borderRadius: 6,
                background: bgColor ?? undefined,
                // visibility 保留布局尺寸, markmap 在错误状态修好后仍能正确测量
                visibility: error ? 'hidden' : undefined,
                display: blank ? 'none' : undefined,
              }}
            >
              <style>{PREVIEW_CSS}</style>
              {/* markmap 会往这个 svg 上挂缩放 / 平移与 ResizeObserver; 尺寸必须为实际像素, 布局才准确 */}
              <svg ref={svgRef} style={{ width: '100%', height: PREVIEW_HEIGHT, display: 'block' }} />
              {rendering && !error && (
                <div style={{ position: 'absolute', right: 8, bottom: 6, color: '#999', fontSize: 12 }}>{t('渲染中...')}</div>
              )}
            </div>
          </Card>
        )}
      </div>
      <Divider>{t(' 思维导图说明 ')}</Divider>
      <MindMapIntro />
    </Space>
  );
};

export default MindMap;
