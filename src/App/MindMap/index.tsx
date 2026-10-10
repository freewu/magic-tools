import { Alert, Button, Card, Divider, Dropdown, Input, Select, Space, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import { CopyOutlined, DownloadOutlined, DownOutlined, ExpandOutlined, EyeInvisibleOutlined, EyeOutlined, FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  DEPTH_OPTIONS,
  DEPTH_LABELS,
  EXPORT_PADDING,
  FONT_DEFAULT,
  FONT_SIZES,
  PREVIEW_HEIGHT,
  RASTER_QUALITY,
  SAMPLES,
  SCALE_OPTIONS,
  SCALE_LABELS,
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

/** 「导出图片」下拉的菜单项: 上排格式名, 下排说明 */
const MENU_ITEM_STYLE :React.CSSProperties = { display: 'flex', flexDirection: 'column', lineHeight: 1.35 };
const MENU_DESC_STYLE :React.CSSProperties = { color: '#999', fontSize: 12 };

/** 原生全屏 API 的类型补充 (内嵌 WebView 只认 webkit 前缀) */
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type ExportFormat = 'svg' | 'png' | 'webp';

/** Markdown 变化后延迟渲染 (输入停顿再重排, 避免每敲一个字符重绘整棵树) */
const RENDER_DELAY = 250;

/** 全屏切换后等布局稳定再重新 fit (原生全屏与窗口内全屏都受这一帧延迟影响) */
const FIT_DELAY = 80;

/** 重新适应窗口, 再按当前缩放倍率放大 / 缩小预览 (rescale 是绝对倍率, 以视口中心为锚点, 与导出倍率同一个值) */
const fitWithScale = async (inst: MindMapInstance, scale: number) => {
  await inst.fit();
  if (scale !== 1) await inst.rescale?.(scale);
};

/** 全屏态样式: 未进入原生全屏时用 position: fixed 铺满窗口兜底 (内嵌 webview 可能拒绝原生全屏)。
 *  全屏是**整个页面**全屏 (工具栏 / 大纲 / 预览一起铺满视口), 下方说明区在全屏时隐藏 */
const STAGE_CSS = [
  '.mindmap-stage.mindmap-full { position: fixed; inset: 0; z-index: 1000; overflow: auto; padding: 12px; }',
  // 卡片行吃掉工具栏与内边距之外的剩余高度 (两个区域都不会被隐藏)
  '.mindmap-stage.mindmap-full .mindmap-row { flex: 1 1 auto; min-height: 0; }',
  '.mindmap-stage.mindmap-full .mindmap-pane > .ant-card { border-radius: 0; }',
  // 画布吃掉预览卡剩余高度, 其余 (标题 / 参数 / 提示条) 保持自然高度
  '.mindmap-stage.mindmap-full .mindmap-canvas { flex: 1 1 auto; min-height: 0; }',
].join('\n');

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
  const [full, setFull] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const instRef = useRef<{ el: SVGSVGElement; mm: MindMapInstance } | null>(null);
  // 缩放值只影响视图, 不该重建整棵树: 供渲染 / 全屏等 effect 读取最新值
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [ scale ]);
  // 首次渲染不需要为「缩放」额外 fit 一次 (渲染本身已经 fit 过)
  const scaleTouchedRef = useRef(false);
  const seqRef = useRef(0);
  const bgTouchedRef = useRef(false);
  const fullTouchedRef = useRef(false);
  const blank = isBlankMarkdown(code);
  // 深色底配浅色文字 (与「背景」联动, 否则深色模式下导出白底 + 浅字会看不清)
  const darkBg = bg === 'dark';

  // 主题切换时联动默认背景 (用户手动选过则不再改)
  useEffect(() => {
    if (!bgTouchedRef.current) setBg(isDark ? 'dark' : 'white');
  }, [isDark]);

  // ---- 全屏: 先请求原生全屏, 失败 (内嵌 webview / 非用户手势) 时用窗口内全屏兜底 ----
  const enterFull = useCallback(() => {
    setFull(true);
    const el = stageRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try {
      void Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略: 已有 CSS 全屏兜底 */
    }
  }, []);

  const exitFull = useCallback(() => {
    setFull(false);
    const doc = document as FullscreenDocument;
    const active = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    if (!active) return;
    try {
      const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
      void Promise.resolve(exit?.()).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  }, []);

  // 浏览器(含 Esc / F11)退出原生全屏时同步状态, 避免按钮卡在「退出全屏」
  useEffect(() => {
    const doc = document as FullscreenDocument;
    const onChange = () => { if (!doc.fullscreenElement && !doc.webkitFullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // 卸载时退出原生全屏, 避免切到别的工具后还停在全屏层
  useEffect(() => () => {
    const doc = document as FullscreenDocument;
    if (!(doc.fullscreenElement ?? doc.webkitFullscreenElement)) return;
    try {
      const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
      void Promise.resolve(exit?.()).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  }, []);

  // Esc 退出窗口内全屏 (原生全屏由浏览器自己处理)
  useEffect(() => {
    if (!full) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const doc = document as FullscreenDocument;
      if (doc.fullscreenElement ?? doc.webkitFullscreenElement) return;
      exitFull();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ full, exitFull ]);

  // 进入 / 退出全屏后画布尺寸变化, 重新 fit 把整棵树收回视野 (markmap 只在内容变化时自动重排)
  useEffect(() => {
    if (!fullTouchedRef.current) {
      fullTouchedRef.current = true;
      return;
    }
    const inst = instRef.current?.mm;
    if (!inst) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fitWithScale(inst, scaleRef.current).then(() => {
        if (!cancelled) setBox(exportBoxOf(inst.state.rect));
      }).catch(() => undefined);
    }, FIT_DELAY);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ full ]);

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
          await fitWithScale(inst, scaleRef.current);
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
    () => DEPTH_OPTIONS.map((n) => ({ value: n, label: t(DEPTH_LABELS[n] ?? String(n)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  // 字号 / 背景 / 缩放与配色、层级一样用下拉, 保持参数区风格统一
  const fontOptions = useMemo(() => FONT_SIZES.map((n) => ({ value: n, label: String(n) })), []);
  const bgOptions = useMemo(
    () => BACKGROUND_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  const scaleOptions = useMemo(
    () => SCALE_OPTIONS.map((n) => ({ value: n, label: t(SCALE_LABELS[n] ?? `${n}x`) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ],
  );
  const canExport = !!box && !error;

  // 「导出图片」下拉: 选格式后再导出 (原三个导出按钮合并为一个)
  const exportItems = useMemo<MenuProps['items']>(() => ([
    {
      key: 'svg',
      label: (
        <div style={ MENU_ITEM_STYLE }>
          <span>{t('SVG 图片')}</span>
          <span style={ MENU_DESC_STYLE }>{t('矢量图, 始终透明背景')}</span>
        </div>
      ),
    },
    {
      key: 'png',
      label: (
        <div style={ MENU_ITEM_STYLE }>
          <span>{t('PNG 图片')}</span>
          <span style={ MENU_DESC_STYLE }>{t('位图, 按「背景 / 缩放」设置导出')}</span>
        </div>
      ),
    },
    {
      key: 'webp',
      disabled: !webpOk,
      label: (
        <div style={ MENU_ITEM_STYLE }>
          <span>{t('WebP 图片')}</span>
          <span style={ MENU_DESC_STYLE }>{webpOk ? t('位图, 体积更小') : t('当前浏览器不支持, 请改用 PNG')}</span>
        </div>
      ),
    },
  ]), [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    locale, webpOk,
  ]);

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
    await fitWithScale(inst, scale);
    setBox(exportBoxOf(inst.state.rect));
    message.success(t('已适应窗口'));
  };

  // 缩放: 在适应窗口的基础上按倍率放大 (不重建树, 折叠状态不受影响)
  useEffect(() => {
    if (!scaleTouchedRef.current) {
      scaleTouchedRef.current = true;
      return;
    }
    const inst = instRef.current?.mm;
    if (!inst) return;
    let cancelled = false;
    void fitWithScale(inst, scale).then(() => {
      if (!cancelled) setBox(exportBoxOf(inst.state.rect));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [ scale ]);

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
    <div
      ref={stageRef}
      className={full ? 'mindmap-stage mindmap-full' : 'mindmap-stage'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        // 窗口内全屏 (兜底) 时铺满视口, 底色跟随预览背景, 深色模式下不闪白
        background: full ? bgColor ?? (isDark ? '#141414' : '#fff') : undefined,
      }}
    >
      <style>{STAGE_CSS}</style>
      <Space size={8} wrap>
        <Button
          size="small"
          icon={showEditor ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          disabled={showEditor && !showPreview}
          onClick={() => setShowEditor(!showEditor)}
        >{t(showEditor ? '隐藏输入' : '显示输入')}</Button>
        <Button
          size="small"
          icon={showPreview ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          disabled={showPreview && !showEditor}
          onClick={() => setShowPreview(!showPreview)}
        >{t(showPreview ? '隐藏预览' : '显示预览')}</Button>
        {/* 全屏放在面板开关旁: 两个区域不会同时隐藏, 有预览就能全屏 */}
        <Tooltip title={full ? t('按 Esc 退出全屏') : t('整个页面全屏 (工具栏 / 大纲 / 预览一起放大), 画布更大更好拖拽')}>
          <Button
            size="small"
            disabled={!showPreview}
            icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={full ? exitFull : enterFull}
          >{t(full ? '退出全屏' : '全屏')}</Button>
        </Tooltip>
      </Space>
      <div className="mindmap-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {showEditor && (
          <Card
            size="small"
            title={t('Markdown 大纲')}
            // 与右侧预览卡等高对齐: 卡片撑满这一行, 正文用 flex 把输入框拉到同高
            style={{ flex: '1 1 420px', minWidth: 320, display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 } }}
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
            <div style={{ marginBottom: 6, color: '#888', fontSize: 12 }}>
              {tt('{l} 行 / {c} 字符 / {h} 个标题', { l: stats.lines, c: stats.chars, h: stats.headings })}
              {info.total > 0 ? ` · ${tt('{n} 个节点 · {d} 层', { n: info.total, d: info.depth })}` : ''}
            </div>
            <Input.TextArea
              value={code}
              onChange={(e) => { setCode(e.target.value); setSampleId(''); }}
              style={{ flex: '1 1 auto', minHeight: 420, fontFamily: MONO, fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
              placeholder={t('在此输入 Markdown 大纲…')}
            />
          </Card>
        )}
        {showPreview && (
          <div
            className="mindmap-pane"
            style={{ flex: '1 1 460px', minWidth: 320, display: 'flex', flexDirection: 'column' }}
          >
          <Card
            size="small"
            title={t('预览')}
            style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}
            styles={{ body: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' } }}
            extra={
              <Space size={8} wrap>
                <Dropdown
                  trigger={[ 'click' ]}
                  disabled={!canExport}
                  menu={{ items: exportItems, onClick: ({ key }) => { void exportAs(key as ExportFormat); } }}
                >
                  <Button size="small" type="primary" icon={<DownloadOutlined />} disabled={!canExport} loading={busy !== ''}>
                    {t('导出图片')}<DownOutlined style={{ fontSize: 10, marginInlineStart: 4 }} />
                  </Button>
                </Dropdown>
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
                  style={{ width: 80 }}
                  onChange={(v) => setScheme(v)}
                  options={colorOptions}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('展开层级')}</span>
                <Select
                  size="small"
                  value={depth}
                  style={{ width: 80 }}
                  onChange={(v) => setDepth(v)}
                  options={depthOptions}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('字号')}</span>
                <Select
                  size="small"
                  value={fontSize}
                  style={{ width: 66 }}
                  onChange={(v) => setFontSize(v)}
                  options={fontOptions}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('背景')}</span>
                <Select
                  size="small"
                  value={bg}
                  style={{ width: 78 }}
                  onChange={(v) => { bgTouchedRef.current = true; setBg(v); }}
                  options={bgOptions}
                />
              </Space>
              <Space size={6}>
                <span style={{ color: '#888' }}>{t('缩放')}</span>
                <Select
                  size="small"
                  value={scale}
                  style={{ width: 88 }}
                  onChange={(v) => setScale(v)}
                  options={scaleOptions}
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
              className={[ 'mindmap-canvas', bgColor ? 'mindmap-preview' : 'mindmap-preview mindmap-preview-checker' ].join(' ')}
              style={{
                position: 'relative',
                // 全屏时高度交给 flex 撑满 (见 STAGE_CSS), 普通模式用固定高度
                height: full ? undefined : PREVIEW_HEIGHT,
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
              <svg ref={svgRef} style={{ width: '100%', height: full ? '100%' : PREVIEW_HEIGHT, display: 'block' }} />
              {rendering && !error && (
                <div style={{ position: 'absolute', right: 8, bottom: 6, color: '#999', fontSize: 12 }}>{t('渲染中...')}</div>
              )}
            </div>
          </Card>
          </div>
        )}
      </div>
      {!full && (
        <>
          <Divider>{t(' 思维导图说明 ')}</Divider>
          <MindMapIntro />
        </>
      )}
    </div>
  );
};

export default MindMap;
