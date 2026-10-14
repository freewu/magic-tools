import { Alert, Button, Card, Divider, Input, Segmented, Select, Space, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, EyeInvisibleOutlined, EyeOutlined, FolderOpenOutlined, FullscreenExitOutlined, FullscreenOutlined, SaveOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MermaidAPI } from 'mermaid';
import { useLocale } from '../../hook/locale-context';
import { useTheme } from '../../hook/theme-context';
import { copyTextToClipboard } from '../../lib';
import { readTextFile } from '../../lib/file';
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
  CODE_ACCEPT,
  MIME_OF,
  dataUrlToBytes,
  extractCode,
  fileNameOf,
  isBlankCode,
  markdownFileNameOf,
  mermaidConfig,
  parseSvgSize,
  prepareSvgForExport,
  rasterizeSvg,
  scaleSize,
  supportsWebp,
  toMarkdown,
  type MermaidFormat,
} from './lib';
import { u, uT } from './lang';
import MermaidIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace';

// 窗口内全屏兜底样式 (原生 Fullscreen API 在部分内嵌 webview 不可用, 与白板 / 思维导图同一套做法):
// 顶部工具行保持原高, 输入 / 预览两栏平分剩余高度, 各自内部滚动
const EDITOR_CSS = `
.mmd-editor { position: relative; }
.mmd-editor-dragging::after {
  content: ''; position: absolute; inset: 6px; border-radius: 8px; pointer-events: none;
  border: 2px dashed var(--app-divider-text, #4c6cb3);
}
.mmd-editor-full {
  position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  padding: 12px; overflow: auto; background: var(--app-bg, #f0f2f5);
}
.mmd-editor-full > .ant-space { flex: 1 1 auto; min-height: 0; }
.mmd-editor-full > .ant-space > .ant-space-item:last-child { flex: 1 1 auto; display: flex; min-height: 0; }
.mmd-editor-full .mmd-main { flex: 1 1 auto; min-width: 0; min-height: 0; }
.mmd-editor-full .mmd-main > .ant-card { display: flex; flex-direction: column; min-height: 0; }
.mmd-editor-full .mmd-main > .ant-card > .ant-card-body {
  flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
}
.mmd-editor-full .mmd-code { flex: 1 1 auto; }
.mmd-editor-full .mmd-pvcol { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.mmd-editor-full .mmd-pvcol > .ant-space { flex: 0 0 auto; }
.mmd-editor-full .mmd-pvbox { flex: 1 1 auto; min-height: 0; }
`;

// 全屏: 优先原生 Fullscreen API, 不可用时用窗口内全屏兜底
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => void | Promise<void> };
type FullscreenDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void | Promise<void> };
const exitNativeFullscreen = () => {
  const doc = document as FullscreenDocument;
  if (!document.fullscreenElement && !doc.webkitFullscreenElement) return;
  try {
    const exit = document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(doc);
    void Promise.resolve(exit?.()).catch(() => undefined);
  } catch {
    /* 忽略: 退出失败不影响窗口内全屏兜底 */
  }
};

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
  const [fileName, setFileName] = useState(''); // 已打开的文件名 (作为 .md 保存与图片导出的默认名)
  const [source, setSource] = useState(''); // 打开文件的原始内容 (保存 .md 时用于保留周边 Markdown 文字)
  const [dragging, setDragging] = useState(false);
  const [full, setFull] = useState(false);
  const seqRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ---- 全屏 ----
  const enterFull = useCallback(() => {
    setFull(true);
    const el = rootRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try {
      void Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略: 已有窗口内全屏兜底 */
    }
  }, []);
  const exitFull = useCallback(() => {
    setFull(false);
    exitNativeFullscreen();
  }, []);

  // 浏览器自身退出全屏 (Esc / F11) 时同步状态
  useEffect(() => {
    const doc = document as FullscreenDocument;
    const onChange = () => {
      const el = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      if (!el) setFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // 窗口内全屏兜底: Esc 退出
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) exitFull();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [full, exitFull]);

  // 切走本页 (卸载) 时退出原生全屏, 避免残留全屏层
  useEffect(() => () => exitNativeFullscreen(), []);

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
  // 文件名前缀: 已打开的文件名优先, 其次是所选示例, 最后兜底
  const base = fileName ? fileName.replace(/\.[^.]+$/, '') : sampleId ? `mermaid-${sampleId}` : DEFAULT_FILE_BASE;
  const lines = code ? code.split('\n').length : 0;

  const copy = async (text: string, tip: string) => {
    try {
      await copyTextToClipboard(text);
      message.success(tip);
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };

  /** 打开本地文件: .md 文档取其中的 ```mermaid 代码块, .mmd / .txt 整体作为源码 */
  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = await readTextFile(file);
      setFileName(file.name);
      setSource(raw);
      setSampleId(''); // 代码来自文件, 不再跟随示例
      setCode(extractCode(raw));
      message.success(tt('已打开 {file}', { file: file.name }));
    } catch {
      message.error(t('打开文件失败'));
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 清空 value, 允许连续打开同一个文件
    void loadFile(file);
  };

  /** 保存为 .md: 弹系统保存对话框 (纯网页回退为浏览器下载) */
  const saveMarkdown = async () => {
    const name = markdownFileNameOf(base);
    try {
      const ok = await saveTextFile(name, toMarkdown(code, source), t('保存为 .md 文件'), {
        filterName: t('Markdown 文件'),
        extensions: [ 'md', 'markdown', 'mmd', 'txt' ],
      });
      if (ok) message.success(tt('已保存 {file}', { file: name }));
    } catch {
      message.error(t('保存失败'));
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
    <div
      ref={rootRef}
      className={`mmd-editor${full ? ' mmd-editor-full' : ''}${dragging ? ' mmd-editor-dragging' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); void loadFile(e.dataTransfer?.files?.[0]); }}
    >
      <style>{EDITOR_CSS}</style>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space size={8} wrap>
          <input ref={fileRef} type="file" accept={CODE_ACCEPT} style={{ display: 'none' }} onChange={onPickFile} />
          <Tooltip title={t('打开 .mmd / .md 文件编辑 (也可直接把文件拖到编辑区)')}>
            <Button size="small" icon={<FolderOpenOutlined />} onClick={() => fileRef.current?.click()}>{t('打开文件')}</Button>
          </Tooltip>
          <Tooltip title={t('保存为 .md 文件 (Mermaid 代码写入 mermaid 代码块)')}>
            <Button size="small" icon={<SaveOutlined />} disabled={!code} onClick={() => { void saveMarkdown(); }}>{t('保存为 .md')}</Button>
          </Tooltip>
          <Tooltip title={t(full ? '退出全屏' : '全屏')}>
            <Button
              size="small"
              icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={full ? exitFull : enterFull}
            >{t(full ? '退出全屏' : '全屏')}</Button>
          </Tooltip>
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
      <div className="mmd-main" style={{ display: 'flex', flexWrap: full ? 'nowrap' : 'wrap', gap: 12 }}>
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
              className="mmd-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                minHeight: full ? 0 : 420,
                height: full ? '100%' : undefined,
                fontFamily: MONO,
                fontSize: 13,
                lineHeight: 1.7,
                resize: full ? 'none' : 'vertical',
              }}
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
            <div className="mmd-pvcol">
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
              <div className="mmd-pvbox" style={{ maxHeight: full ? undefined : 560, overflow: 'auto', border: '1px solid rgba(128,128,128,0.2)', borderRadius: 6, padding: 8, background: isDark ? '#141414' : '#fff' }}>
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
            </div>
          </Card>
        )}
      </div>
      {!full && <Divider>{t(' Mermaid 编辑器说明 ')}</Divider>}
      {!full && <MermaidIntro />}
      </Space>
    </div>
  );
};

export default MermaidEditor;
