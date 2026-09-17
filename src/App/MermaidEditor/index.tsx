import { Alert, Button, Card, Divider, Input, Segmented, Select, Space, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MermaidAPI } from 'mermaid';
import { useLocale } from '../../hook/locale-context';
import { useTheme } from '../../hook/theme-context';
import { copyTextToClipboard } from '../../lib';
import { saveBytesFile, savePngFile, saveTextFile } from '../../lib/tauri';
import {
  BACKGROUND_OPTIONS,
  DEFAULT_FILE_BASE,
  DEFAULT_SCALE,
  GROUP_LABELS,
  RASTER_QUALITY,
  SAMPLES,
  SCALE_OPTIONS,
  type MermaidSampleGroup,
  type RasterBackground,
} from './data';
import {
  MIME_OF,
  dataUrlToBytes,
  fileNameOf,
  isBlankCode,
  mermaidConfig,
  parseSvgSize,
  prepareSvgForExport,
  rasterizeSvg,
  scaleSize,
  supportsWebp,
  type MermaidFormat,
} from './lib';
import { u, uT } from './lang';
import MermaidIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace';

// mermaid 体积较大 (~1MB+), 动态加载并缓存: 只在打开本页时才拉取对应 chunk
let mermaidPromise: Promise<MermaidAPI> | null = null;
const loadMermaid = (): Promise<MermaidAPI> => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid')
      .then((m) => m.default)
      .catch((err) => {
        mermaidPromise = null; // 加载失败允许重试
        throw err;
      });
  }
  return mermaidPromise;
};

const MermaidEditor: React.FC = () => {
  const { locale } = useLocale();
  const { isDark } = useTheme();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);

  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [code, setCode] = useState(SAMPLES[0].code);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(false);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [bg, setBg] = useState<RasterBackground>('white');
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [busy, setBusy] = useState<MermaidFormat | ''>('');
  const [webpOk] = useState(() => supportsWebp());
  const seqRef = useRef(0);

  // 代码变化后延迟渲染 (输入停顿 200ms 再渲染, 避免每敲一个字符都重绘)
  useEffect(() => {
    if (isBlankCode(code)) {
      seqRef.current += 1;
      setSvg('');
      setError('');
      setRendering(false);
      return;
    }
    let cancelled = false;
    const seq = ++seqRef.current;
    setRendering(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const mermaid = await loadMermaid();
          mermaid.initialize(mermaidConfig(isDark));
          const { svg: out } = await mermaid.render(`mmd-${seq}-${Date.now()}`, code);
          if (cancelled || seq !== seqRef.current) return;
          setSvg(out);
          setError('');
          setRendering(false);
        } catch (err) {
          if (cancelled || seq !== seqRef.current) return;
          setSvg('');
          setError(err instanceof Error ? err.message : String(err));
          setRendering(false);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [code, isDark]);

  const size = useMemo(() => parseSvgSize(svg), [svg]);
  // 「背景」同时作用于预览与位图导出 (SVG 始终透明); 「缩放」同时作用于预览与位图导出
  const bgColor = useMemo(() => BACKGROUND_OPTIONS.find((o) => o.value === bg)?.color ?? null, [bg]);
  const previewCss = useMemo(() => {
    const scaled = size && scale !== 1 ? `width: ${Math.round(size.width * scale)}px; max-width: none;` : 'width: auto; max-width: 100%;';
    return [
      `.mmd-preview svg { ${scaled} height: auto; }`,
      // 透明底色用棋盘格表示 (与位图导出的透明通道对应)
      '.mmd-preview-checker {',
      '  background-image: linear-gradient(45deg, rgba(128,128,128,0.22) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.22) 75%),',
      '    linear-gradient(45deg, rgba(128,128,128,0.22) 25%, transparent 25%, transparent 75%, rgba(128,128,128,0.22) 75%);',
      '  background-size: 16px 16px;',
      '  background-position: 0 0, 8px 8px;',
      '}',
    ].join('\n');
  }, [size, scale]);
  // 按图形家族分组, 并支持输入关键字筛选 (示例较多, 分组而非平铺)
  const sampleOptions = useMemo(
    () => (Object.keys(GROUP_LABELS) as MermaidSampleGroup[]).map((g) => ({
      label: t(GROUP_LABELS[g]),
      options: SAMPLES.filter((s) => s.group === g).map((s) => ({ value: s.id, label: t(s.label) })),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  const canExport = !!svg && !!size;
  const base = sampleId ? `mermaid-${sampleId}` : DEFAULT_FILE_BASE;
  const lines = code ? code.split('\n').length : 0;

  const copy = async (text: string, tip: string) => {
    try {
      await copyTextToClipboard(text);
      message.success(tip);
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };

  const exportAs = async (format: MermaidFormat) => {
    if (!svg || !size) return;
    setBusy(format);
    try {
      if (format === 'svg') {
        // 矢量导出: 固定宽高 + 补 xmlns, 保持透明背景
        const name = fileNameOf(base, 'svg');
        const ok = await saveTextFile(name, prepareSvgForExport(svg, size), t('导出 SVG'), { filterName: 'SVG 图片', extensions: [ 'svg' ] });
        if (ok) message.success(tt('已导出 {file}', { file: name }));
        return;
      }
      const color = bgColor;
      const target = scaleSize(size, scale);
      const dataUrl = await rasterizeSvg(prepareSvgForExport(svg, target), {
        size: target,
        mime: MIME_OF[format],
        background: color,
        quality: RASTER_QUALITY,
      });
      const name = fileNameOf(base, format);
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
            title={t('Mermaid 源码')}
            style={{ flex: '1 1 420px', minWidth: 320 }}
            extra={
              <Space size={8}>
                <Select
                  size="small"
                  showSearch
                  value={sampleId}
                  style={{ minWidth: 210 }}
                  optionFilterProp="label"
                  styles={{ popup: { root: { minWidth: 300 } } }}
                  listHeight={360}
                  onChange={(v) => {
                    const s = SAMPLES.find((x) => x.id === v);
                    if (!s) return;
                    setSampleId(s.id);
                    setCode(s.code);
                  }}
                  options={sampleOptions}
                />
                <Button size="small" icon={<CopyOutlined />} disabled={!code} onClick={() => { void copy(code, t('已复制源码')); }}>{t('复制源码')}</Button>
                <Button size="small" danger disabled={!code} onClick={() => setCode('')}>{t('清空')}</Button>
              </Space>
            }
          >
            <Input.TextArea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ minHeight: 420, fontFamily: MONO, fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
              placeholder={t('在此输入 Mermaid 代码…')}
            />
            <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>{tt('{l} 行 / {c} 字符', { l: lines, c: code.length })}</div>
          </Card>
        )}
        {showPreview && (
          <Card
            size="small"
            title={t('预览')}
            style={{ flex: '1 1 460px', minWidth: 320 }}
            extra={
              <Space size={8} wrap>
                <Tooltip title={t('「背景 / 缩放」同时作用于预览与位图导出; SVG 为矢量格式, 导出时始终透明背景')}>
                  <Button size="small" icon={<DownloadOutlined />} disabled={!canExport} loading={busy === 'svg'} onClick={() => { void exportAs('svg'); }}>{t('导出 SVG')}</Button>
                </Tooltip>
                <Button size="small" type="primary" icon={<DownloadOutlined />} disabled={!canExport} loading={busy === 'png'} onClick={() => { void exportAs('png'); }}>{t('导出 PNG')}</Button>
                <Tooltip title={webpOk ? undefined : t('当前浏览器不支持 WebP 导出, 请改用 PNG')}>
                  <Button size="small" icon={<DownloadOutlined />} disabled={!canExport || !webpOk} loading={busy === 'webp'} onClick={() => { void exportAs('webp'); }}>{t('导出 WebP')}</Button>
                </Tooltip>
                <Button size="small" icon={<CopyOutlined />} disabled={!canExport} onClick={() => { void copy(svg, t('已复制 SVG')); }}>{t('复制 SVG')}</Button>
              </Space>
            }
          >
            <Space size={16} wrap style={{ marginBottom: 10 }}>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('缩放')}</span>
                <Segmented
                  size="small"
                  value={scale}
                  onChange={(v) => setScale(Number(v))}
                  options={SCALE_OPTIONS.map((n) => ({ label: n === 1 ? t('1x (自适应)') : `${n}x`, value: n }))}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('背景')}</span>
                <Segmented size="small" value={bg} onChange={(v) => setBg(v as RasterBackground)} options={BACKGROUND_OPTIONS.map((o) => ({ label: t(o.label), value: o.value }))} />
              </Space>
            </Space>
            {error ? (
              <Alert
                type="error"
                showIcon
                message={t('渲染失败')}
                description={
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: MONO, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{error}</pre>
                }
              />
            ) : svg ? (
              <div style={{ maxHeight: 560, overflow: 'auto', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 6, padding: 8, background: isDark ? '#141414' : '#fff' }}>
                {/* 「缩放」改变预览尺寸 (1x 自适应卡片宽度, 更大倍率按原始宽高放大后可滚动); 导出用 SVG 自身宽高 */}
                <style>{previewCss}</style>
                <div
                  className={bgColor ? 'mmd-preview' : 'mmd-preview mmd-preview-checker'}
                  style={bgColor ? { background: bgColor } : undefined}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                {rendering && <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>{t('渲染中...')}</div>}
              </div>
            ) : (
              <div style={{ color: '#999', padding: '120px 0', textAlign: 'center' }}>
                {rendering ? t('渲染中...') : t('还没内容, 在左侧输入 Mermaid 代码')}
              </div>
            )}
          </Card>
        )}
      </div>
      <Divider>{t(' Mermaid 编辑器说明 ')}</Divider>
      <MermaidIntro />
    </Space>
  );
};

export default MermaidEditor;
