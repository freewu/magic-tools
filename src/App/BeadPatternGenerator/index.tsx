import { Button, Checkbox, Segmented, Select, Slider, message } from "antd";
import { CopyOutlined, DownloadOutlined, RedoOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from "react";
import { copyTextToClipboard } from "../../lib";
import { ImageError, loadImageFile, type ImageFile } from "../../lib/image";
import { saveBytesFile } from "../../lib/tauri";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from './lang';
import { BEAD_BRANDS, DEFAULT_BRAND, getBrand } from "./palette";
import {
  COLORS_MAX, COLORS_MIN, DEFAULT_COLORS, DEFAULT_WIDTH, WIDTH_MAX, WIDTH_MIN,
  backgroundMask, fillRegion, heightForWidth, mirrorCells, patternCsv, patternStats, quantizeToBeads,
  replaceColor, setCell, toCellGrid, usageCsv, usageText,
} from "./lib";
import {
  cellAt, computeLayout, drawLegend, drawPattern, legendHeight, type DrawLayout, type PatternCtx,
} from "./draw";

type Tool = 'brush' | 'eraser' | 'recolor' | 'fill';

/** 预览缩放范围/步进 */
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

/**
 * 图片 -> 目标豆数 (w x h) 的像素数据
 * 逐级减半后一次性缩到目标尺寸, 避免大幅缩小时的摩尔纹/锯齿 (拼豆图的取色块很大, 直接缩会脏)
 */
const resample = (img: HTMLImageElement, w: number, h: number): Uint8ClampedArray | null => {
  let cw = img.naturalWidth || img.width;
  let ch = img.naturalHeight || img.height;
  if (!(cw > 0) || !(ch > 0) || w < 1 || h < 1) return null;
  let cur: HTMLImageElement | HTMLCanvasElement = img;
  const draw = (src: HTMLImageElement | HTMLCanvasElement, tw: number, th: number): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, tw, th);
    ctx.drawImage(src, 0, 0, tw, th);
    return canvas;
  };
  while (cw > w * 2 && ch > h * 2) {
    const nw = Math.max(w, Math.floor(cw / 2));
    const nh = Math.max(h, Math.floor(ch / 2));
    const next = draw(cur, nw, nh);
    if (!next) return null;
    cur = next;
    cw = nw;
    ch = nh;
  }
  const out = draw(cur, w, h);
  if (!out) return null;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  return ctx.getImageData(0, 0, w, h).data;
};

const BeadPatternGenerator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);

  const [ src, setSrc ] = useState<ImageFile | null>(null);
  const [ brandKey, setBrandKey ] = useState(DEFAULT_BRAND);
  const [ width, setWidth ] = useState(DEFAULT_WIDTH);
  const [ height, setHeight ] = useState(DEFAULT_WIDTH);
  const [ keepRatio, setKeepRatio ] = useState(true);
  const [ maxColors, setMaxColors ] = useState(DEFAULT_COLORS);
  const [ dither, setDither ] = useState(false);
  const [ removeBg, setRemoveBg ] = useState(true);
  const [ brightness, setBrightness ] = useState(0);
  const [ contrast, setContrast ] = useState(0);
  const [ saturation, setSaturation ] = useState(0);
  const [ showCode, setShowCode ] = useState(true);
  const [ showGrid, setShowGrid ] = useState(true);
  const [ showAxis, setShowAxis ] = useState(true);
  const [ cellSize, setCellSize ] = useState(0);
  const [ zoom, setZoom ] = useState(1);
  const [ mirror, setMirror ] = useState(false);
  const [ tool, setTool ] = useState<Tool>('brush');
  const [ picked, setPicked ] = useState(-1);
  const [ manual, setManual ] = useState<Int32Array | null>(null);
  const [ past, setPast ] = useState<Int32Array[]>([]);
  const [ future, setFuture ] = useState<Int32Array[]>([]);
  const [ dragOver, setDragOver ] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const brand = getBrand(brandKey);
  const sizeLabel = (b: typeof brand) => t(b.size === 'mini' ? '小豆' : '大豆');

  // 原图按目标豆数重采样 -> 每格一色
  const pixels = useMemo(() => (src ? resample(src.img, width, height) : null), [ src, width, height ]);
  const grid = useMemo(
    () => (pixels ? toCellGrid(pixels, width, height, { brightness, contrast, saturation }) : null),
    [ pixels, width, height, brightness, contrast, saturation ],
  );
  // 自动配色 (去背景 + 用色数限制 + 色卡匹配)
  const auto = useMemo(() => {
    if (!grid) return null;
    const { mask, bgHex } = backgroundMask(grid, removeBg);
    const res = quantizeToBeads(grid, mask, brand, { maxColors, dither });
    return { cells: res.cells, bgHex };
  }, [ grid, brand, maxColors, dither, removeBg ]);

  // 自动结果变化时清空手工修改
  useEffect(() => { setManual(null); setPast([]); setFuture([]); }, [ auto ]);

  const cells = manual && manual.length === width * height ? manual : (auto ? auto.cells : null);
  const shown = useMemo(
    () => (cells && mirror ? mirrorCells(cells, width, height) : cells),
    [ cells, mirror, width, height ],
  );
  const stats = useMemo(
    () => (cells ? patternStats(cells, width, height, brand) : null),
    [ cells, width, height, brand ],
  );
  const layout: DrawLayout = useMemo(
    () => computeLayout(width, height, { cell: cellSize || undefined, showGrid, showCode, showAxis }),
    [ width, height, cellSize, showGrid, showCode, showAxis ],
  );

  // 选中的颜色始终是当前用色里的色号
  useEffect(() => {
    if (!stats || !stats.used.length) return;
    if (!stats.used.some((u) => u.index === picked)) setPicked(stats.used[0].index);
  }, [ stats, picked ]);

  // 按原图比例联动高度
  useEffect(() => {
    if (src && keepRatio) setHeight(heightForWidth(src.size.width, src.size.height, width));
  }, [ src, width, keepRatio ]);

  // 绘制预览
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shown) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = layout.width;
    canvas.height = layout.height;
    drawPattern(ctx as unknown as PatternCtx, shown, width, height, brand, layout);
  }, [ shown, brand, layout, width, height ]);

  const load = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { message.warning(t('请选择图片文件')); return; }
    try {
      const img = await loadImageFile(file);
      setSrc(img);
      setManual(null);
      setPast([]);
      setFuture([]);
      setHeight(heightForWidth(img.size.width, img.size.height, width));
      message.success(tt('已载入 {name} ({w}×{h}px)', { name: file.name, w: img.size.width, h: img.size.height }));
    } catch (err) {
      const code = err instanceof ImageError ? err.code : '';
      message.error(code === 'not-image'
        ? t('请选择图片文件')
        : code === 'read-failed' ? t('读取文件失败') : t('图片解析失败, 请确认文件格式'));
    }
  };

  // 支持直接粘贴截图 / 复制的图片 (用 ref 取最新闭包, 避免语言/宽度被定格在首次渲染)
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file) loadRef.current(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // 手工修图
  const commit = (next: Int32Array) => {
    if (!cells) return;
    setPast((p) => [ ...p, cells ].slice(-60));
    setFuture([]);
    setManual(next);
  };

  const applyAt = (cx: number, cy: number) => {
    if (!cells) return;
    const x = mirror ? width - 1 - cx : cx;
    const cur = cells[cy * width + x];
    if (tool === 'eraser') { commit(setCell(cells, width, height, x, cy, -1)); return; }
    if (tool === 'fill' && cur >= 0 && picked >= 0) { commit(fillRegion(cells, width, height, x, cy, picked)); return; }
    if (tool === 'recolor' && cur >= 0 && picked >= 0) { commit(replaceColor(cells, cur, picked)); return; }
    commit(setCell(cells, width, height, x, cy, picked < 0 ? 0 : picked));
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !cells) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const py = ((e.clientY - rect.top) * canvas.height) / rect.height;
    const pos = cellAt(layout, width, height, px, py);
    if (pos) applyAt(pos.x, pos.y);
  };

  const undo = () => {
    if (!past.length || !cells) return;
    setFuture([ cells, ...future ].slice(0, 60));
    setPast(past.slice(0, -1));
    setManual(past[past.length - 1]);
  };
  const redo = () => {
    if (!future.length || !cells) return;
    setPast([ ...past, cells ].slice(-60));
    setFuture(future.slice(1));
    setManual(future[0]);
  };
  const resetEdit = () => { setManual(null); setPast([]); setFuture([]); };

  // 预览缩放 (1 = 画布 1:1 像素) 与归位 (回到 100% 且滚动回原点)
  const setZoomSafe = (z: number) =>
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100)));
  const resetView = () => {
    setZoom(1);
    const el = previewRef.current;
    if (el) { el.scrollLeft = 0; el.scrollTop = 0; }
  };

  /** 带用量图例的完整图纸画布 (导出 PNG 用) */
  const buildExportCanvas = (): HTMLCanvasElement | null => {
    if (!shown || !stats) return null;
    const lines = [
      `${brand.name} · ${sizeLabel(brand)} ${brand.mm}mm · ${width} × ${height}`,
      `${t('成品尺寸')} ${stats.sizeCm.w} × ${stats.sizeCm.h} cm · ${t('总豆数')} ${stats.total} · ${t('拼豆板')} ${stats.boards.x}×${stats.boards.y}`,
    ];
    if (mirror) lines.push(t('镜像'));
    const canvas = document.createElement('canvas');
    canvas.width = layout.width;
    canvas.height = layout.height + legendHeight(stats.used.length, layout.width, lines.length);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    drawPattern(ctx as unknown as PatternCtx, shown, width, height, brand, layout);
    drawLegend(ctx as unknown as PatternCtx, stats, lines, layout, layout.height);
    return canvas;
  };

  const fileName = (ext: string) =>
    `${src ? src.base : 'pattern'}-${brand.key}-${width}x${height}.${ext}`;

  const save = async (name: string, bytes: Uint8Array, filterName: string, ext: string) => {
    const ok = await saveBytesFile(name, bytes, {
      title: tt('保存 {name}', { name }),
      filterName,
      extensions: [ ext ],
    });
    if (ok) message.success(tt('已保存 {name}', { name }));
  };

  const exportPng = async () => {
    const canvas = buildExportCanvas();
    if (!canvas) { message.error(t('画布创建失败, 无法导出 PNG')); return; }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
    if (!blob) { message.error(t('画布创建失败, 无法导出 PNG')); return; }
    const name = fileName('png');
    await save(name, new Uint8Array(await blob.arrayBuffer()), t('PNG 图片'), 'png');
  };

  const exportCodeCsv = async () => {
    if (!cells) return;
    const name = fileName('csv');
    const bytes = new TextEncoder().encode('\uFEFF' + patternCsv(cells, width, height, brand));
    await save(name, bytes, t('CSV 文件'), 'csv');
  };

  const exportUsageCsv = async () => {
    if (!stats) return;
    const name = `${src ? src.base : 'pattern'}-${brand.key}-usage.csv`;
    const bytes = new TextEncoder().encode('\uFEFF' + usageCsv(stats));
    await save(name, bytes, t('CSV 文件'), 'csv');
  };

  const copyList = async () => {
    if (!stats || !stats.total) return;
    const text = usageText(
      stats,
      t('颗'),
      t('合计'),
      `${t('色号')}\t${t('颜色名')}\tHEX\t${t('数量')}\t${t('占比')}`,
    );
    try {
      await copyTextToClipboard(text);
      message.success(t('已复制清单到剪贴板'));
    } catch (err) {
      message.error(t('复制失败, 请手动选中文本复制'));
    }
  };

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const labelStyle = { color: '#666', whiteSpace: 'nowrap' } as const;
  const sliderStyle = { width: 120, margin: '0 4px' } as const;
  const wideSliderStyle = { width: 200, margin: '0 4px' } as const;
  const zoomBtn = { paddingInline: 6 } as const;
  const valueStyle = { minWidth: 26, textAlign: 'right', fontFamily: 'monospace' } as const;
  const noteStyle = { color: '#888', fontSize: 12, lineHeight: '20px' } as const;

  return (
    <div>
      <input
        ref={ fileRef } type="file" accept="image/*" style={ { display: 'none' } }
        onChange={ (e) => { load(e.target.files?.[0]); e.target.value = ''; } }
      />
      <div
        onClick={ () => fileRef.current?.click() }
        onDragOver={ (e) => { e.preventDefault(); setDragOver(true); } }
        onDragLeave={ () => setDragOver(false) }
        onDrop={ (e) => { e.preventDefault(); setDragOver(false); load(e.dataTransfer.files?.[0]); } }
        style={ {
          border: `2px dashed ${dragOver ? '#1677ff' : '#d9d9d9'}`,
          borderRadius: 8,
          padding: src ? 12 : '28px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#f0f7ff' : '#fafafa',
          marginBottom: 12,
        } }
      >
        { src
          ? <img src={ src.url } alt="" style={ { maxHeight: 120, maxWidth: '100%' } } />
          : <div style={ { color: '#666' } }>{t('点击或拖拽图片到此处')}</div> }
      </div>
      <div style={ { ...noteStyle, marginBottom: 12 } }>
        <div>{t('支持 png / jpg / webp / gif (首帧), 自动按颗粒数缩放; 纯色/透明背景自动留空')}</div>
        <div>{t('载入图片后自动生成拼豆图纸: 按真实色卡匹配色号, 可手工改色后导出打印')}</div>
      </div>

      {/* 配色参数 */}
      <div style={ row }>
        <span style={ labelStyle }>{t('品牌色卡')}:</span>
        <Select
          value={ brandKey }
          onChange={ (v) => { setBrandKey(v); setPicked(-1); } }
          style={ { width: 200 } }
          options={ BEAD_BRANDS.map((b) => ({ value: b.key, label: `${b.name} · ${sizeLabel(b)}` })) }
        />
        <span style={ labelStyle }>{t('用色数')}:</span>
        <Slider min={ COLORS_MIN } max={ COLORS_MAX } value={ maxColors } onChange={ setMaxColors } style={ sliderStyle } />
        <span style={ { width: 20 } }>{maxColors}</span>
        <Checkbox checked={ dither } onChange={ (e) => setDither(e.target.checked) }>{t('抖动')}</Checkbox>
        <Checkbox checked={ removeBg } onChange={ (e) => setRemoveBg(e.target.checked) }>{t('去背景')}</Checkbox>
      </div>

      {/* 图纸宽高 (单独一行) */}
      <div style={ row }>
        <span style={ labelStyle }>{t('图纸宽 (颗粒数)')}:</span>
        <Slider
          min={ WIDTH_MIN } max={ WIDTH_MAX } value={ width } onChange={ setWidth }
          style={ wideSliderStyle } tooltip={ { open: false } }
        />
        <span style={ valueStyle }>{width}</span>
        <span style={ labelStyle }>{t('图纸高 (颗粒数)')}:</span>
        <Slider
          min={ 1 } max={ WIDTH_MAX } value={ height } onChange={ setHeight } disabled={ keepRatio }
          style={ wideSliderStyle } tooltip={ { open: false } }
        />
        <span style={ valueStyle }>{height}</span>
        <Checkbox checked={ keepRatio } onChange={ (e) => setKeepRatio(e.target.checked) }>{t('按原图比例')}</Checkbox>
      </div>

      <div style={ row }>
        <span style={ labelStyle }>{t('亮度')}</span>
        <Slider min={ -100 } max={ 100 } value={ brightness } onChange={ setBrightness } style={ sliderStyle } />
        <span style={ labelStyle }>{t('对比度')}</span>
        <Slider min={ -100 } max={ 100 } value={ contrast } onChange={ setContrast } style={ sliderStyle } />
        <span style={ labelStyle }>{t('饱和度')}</span>
        <Slider min={ -100 } max={ 100 } value={ saturation } onChange={ setSaturation } style={ sliderStyle } />
        <Checkbox checked={ showCode } onChange={ (e) => setShowCode(e.target.checked) }>{t('显示色号')}</Checkbox>
        <Checkbox checked={ showGrid } onChange={ (e) => setShowGrid(e.target.checked) }>{t('网格')}</Checkbox>
        <Checkbox checked={ showAxis } onChange={ (e) => setShowAxis(e.target.checked) }>{t('行列编号')}</Checkbox>
        <span style={ labelStyle }>{t('格子大小')}:</span>
        <Select
          value={ cellSize }
          onChange={ setCellSize }
          style={ { width: 96 } }
          options={ [
            { value: 0, label: t('自动') },
            { value: 14, label: '14 px' },
            { value: 20, label: '20 px' },
            { value: 26, label: '26 px' },
          ] }
        />
      </div>

      {/* 编辑工具 */}
      <div style={ row }>
        <span style={ labelStyle }>{t('编辑工具')}:</span>
        <Segmented
          value={ tool }
          onChange={ (v) => setTool(v as Tool) }
          options={ [
            { value: 'brush', label: t('画笔') },
            { value: 'eraser', label: t('橡皮') },
            { value: 'recolor', label: t('换色') },
            { value: 'fill', label: t('魔棒') },
          ] }
        />
        <Button icon={ <UndoOutlined /> } onClick={ undo } disabled={ !past.length }>{t('撤销')}</Button>
        <Button icon={ <RedoOutlined /> } onClick={ redo } disabled={ !future.length }>{t('重做')}</Button>
        <Button onClick={ resetEdit } disabled={ !manual }>{t('重置')}</Button>
        <Checkbox checked={ mirror } onChange={ (e) => setMirror(e.target.checked) }>{t('镜像')}</Checkbox>
        <span style={ labelStyle }>{t('当前颜色')}:</span>
        <span style={ { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' } }>
          <span style={ {
            width: 16, height: 16, borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.15)',
            background: brand.colors[picked] ? brand.colors[picked].hex : '#fff', display: 'inline-block',
          } } />
          {brand.colors[picked] ? brand.colors[picked].code : '-'}
        </span>
      </div>

      <div style={ { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 4 } }>
        {/* 预览 */}
        <div style={ { flex: '1 1 420px', minWidth: 280 } }>
          <div style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 } }>
            <span style={ labelStyle }>{t('图纸预览 (点击格子可用上方工具修改)')}</span>
            <Button
              size="small" style={ zoomBtn } icon={ <ZoomOutOutlined /> }
              aria-label={ t('缩小') } title={ t('缩小') }
              disabled={ zoom <= ZOOM_MIN } onClick={ () => setZoomSafe(zoom - ZOOM_STEP) }
            />
            <span style={ { minWidth: 44, textAlign: 'center', fontFamily: 'monospace' } }>{Math.round(zoom * 100)}%</span>
            <Button
              size="small" style={ zoomBtn } icon={ <ZoomInOutlined /> }
              aria-label={ t('放大') } title={ t('放大') }
              disabled={ zoom >= ZOOM_MAX } onClick={ () => setZoomSafe(zoom + ZOOM_STEP) }
            />
            <Button size="small" onClick={ resetView } title={ t('归位') }>{t('归位')}</Button>
          </div>
          { shown
            ? <div
              ref={ previewRef }
              style={ {
                overflow: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 4,
                background: '#fff', maxHeight: '70vh',
              } }
            >
              <canvas
                ref={ canvasRef }
                onClick={ onCanvasClick }
                style={ {
                  width: layout.width * zoom, height: layout.height * zoom,
                  imageRendering: 'pixelated', display: 'block', cursor: 'crosshair',
                } }
              />
            </div>
            : <div style={ {
              border: '1px dashed #e0e0e0', borderRadius: 6, padding: '40px 16px',
              textAlign: 'center', color: '#aaa', background: '#fafafa',
            } }>{t('载入图片后显示图纸预览')}</div> }
        </div>

        {/* 统计与用量 */}
        <div style={ { flex: '0 0 340px', minWidth: 280 } }>
          { stats && shown
            ? <>
              <div style={ { border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 } }>
                <div style={ { fontWeight: 600, marginBottom: 8 } }>{t('统计')}</div>
                <div style={ { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', fontSize: 13 } }>
                  <span style={ labelStyle }>{t('总豆数')}</span>
                  <span>{stats.total}</span>
                  <span style={ labelStyle }>{t('用色数')}</span>
                  <span>{tt('{n} 种', { n: stats.colors })}</span>
                  <span style={ labelStyle }>{t('成品尺寸')}</span>
                  <span>{tt('成品 {w} × {h} cm', { w: stats.sizeCm.w, h: stats.sizeCm.h })}</span>
                  <span style={ labelStyle }>{t('拼豆板')}</span>
                  <span>{tt('29×29 拼豆板 {x}×{y} ({n} 块)', { x: stats.boards.x, y: stats.boards.y, n: stats.boards.total })}</span>
                  <span style={ labelStyle }>{t('单颗尺寸')}</span>
                  <span>{tt('单颗 {mm}mm ({size})', { mm: brand.mm, size: sizeLabel(brand) })}</span>
                </div>
                <div style={ { ...noteStyle, marginTop: 8 } }>
                  {auto?.bgHex
                    ? tt('已识别背景色 {hex}', { hex: auto.bgHex })
                    : (removeBg ? t('未识别到纯色背景') : '')}
                </div>
              </div>

              <div style={ { ...row, marginTop: 12, marginBottom: 8 } }>
                <Button type="primary" icon={ <DownloadOutlined /> } onClick={ exportPng }>{t('导出图纸 PNG')}</Button>
                <Button onClick={ exportCodeCsv }>{t('导出色号 CSV')}</Button>
                <Button onClick={ exportUsageCsv }>{t('导出用量 CSV')}</Button>
                <Button icon={ <CopyOutlined /> } onClick={ copyList } disabled={ !stats.total }>{t('复制清单')}</Button>
              </div>

              <div style={ { fontWeight: 600, margin: '8px 0' } }>{t('用量清单')}</div>
              <div style={ { display: 'flex', gap: 8, fontSize: 12, color: '#999', padding: '0 6px 4px' } }>
                <span style={ { width: 56 } }>{t('色号')}</span>
                <span style={ { flex: 1 } }>{t('颜色名')}</span>
                <span style={ { width: 48, textAlign: 'right' } }>{t('数量')}</span>
                <span style={ { width: 48, textAlign: 'right' } }>{t('占比')}</span>
              </div>
              <div style={ { maxHeight: 280, overflowY: 'auto' } }>
                { stats.used.map((u) => (
                  <div
                    key={ u.index }
                    onClick={ () => setPicked(u.index) }
                    style={ {
                      display: 'flex', alignItems: 'center', gap: 8, padding: '3px 6px',
                      borderRadius: 4, cursor: 'pointer', fontSize: 12,
                      background: u.index === picked ? '#e6f4ff' : undefined,
                    } }
                  >
                    <span style={ {
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: '1px solid rgba(0, 0, 0, 0.15)', background: u.hex,
                    } } />
                    <span style={ { width: 50, fontFamily: 'monospace' } }>{u.code}</span>
                    <span style={ { flex: 1, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>{u.name}</span>
                    <span style={ { width: 48, textAlign: 'right', fontFamily: 'monospace' } }>{u.count}</span>
                    <span style={ { width: 48, textAlign: 'right', color: '#aaa' } }>{(u.ratio * 100).toFixed(1)}%</span>
                  </div>
                )) }
              </div>
            </>
            : <div style={ noteStyle }>{t('载入图片后自动生成拼豆图纸: 按真实色卡匹配色号, 可手工改色后导出打印')}</div> }
        </div>
      </div>

      <div style={ { ...noteStyle, marginTop: 12 } }>
        {t('提示: 用色数越少越省豆; 熨烫需翻面, 可用「镜像」查看翻面后的效果')}
      </div>
    </div>
  );
};

export default BeadPatternGenerator;
