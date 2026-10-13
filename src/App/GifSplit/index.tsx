// GIF 拆解: 载入 GIF 后逐帧预览 / 回放, 可把选中帧导出为 PNG 或拼成一张精灵图 (gifuct-js 解析, 全程本地)
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Button, Checkbox, Collapse, Divider, InputNumber, Progress, Select, Slider, Space, Tooltip, message,
} from "antd";
import {
  CaretRightOutlined, ClearOutlined, DownloadOutlined, FileImageOutlined, InboxOutlined, PauseOutlined,
  StepBackwardOutlined, StepForwardOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { saveBytesBatch, saveBytesFile } from "../../lib/tauri";
import {
  GIF_MAX_FRAMES, composeSprite, drawRgba, formatDuration, formatFps, frameFileName,
  parseGif, rgbaToPngBytes, totalDuration, type GifData, type GifFrame,
} from "../../lib/gif";
import { formatBytes } from "../../lib/image";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from './lang';
import {
  GIF_SPLIT_CHANGED, MAX_GIF_SIZE, MAX_ROWS, SPEEDS, allFrameIds, disposalKey, framePrefix, frameWait,
  getDefaultCols, getDefaultGap, invertIds, nextFrame, parseErrorKey, prevFrame, setDefaultCols,
  setDefaultGap, sortedIds, toCols, toGap, toggleId,
} from './lib';

/** 单帧缩略图: 把合成后的整幅 RGBA 画到小 canvas 上 (canvas 不可用时留空) */
const FrameThumb = ({ frame, width, height }: { frame: GifFrame; width: number; height: number }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawRgba(canvas, frame.data, width, height);
  }, [ frame, width, height ]);
  return <canvas ref={ ref } className="gs-thumb" style={ { width: 76, height: 'auto', display: 'block', imageRendering: 'pixelated' } } />;
};

const GifSplit = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);

  const [ fileName, setFileName ] = useState('');
  const [ gif, setGif ] = useState<GifData | null>(null);
  const [ selected, setSelected ] = useState<Set<number>>(() => new Set());
  const [ current, setCurrent ] = useState(0);
  const [ playing, setPlaying ] = useState(false);
  const [ speed, setSpeed ] = useState(1);
  const [ cols, setCols ] = useState<number>(() => getDefaultCols());
  const [ gap, setGap ] = useState<number>(() => getDefaultGap());
  const [ dragging, setDragging ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ done, setDone ] = useState<number | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // 设置页改默认排版时同步
  useEffect(() => {
    const onChanged = () => { setCols(getDefaultCols()); setGap(getDefaultGap()); };
    window.addEventListener(GIF_SPLIT_CHANGED, onChanged);
    return () => window.removeEventListener(GIF_SPLIT_CHANGED, onChanged);
  }, []);

  const frames = gif?.frames ?? [];
  const selectedIds = useMemo(() => sortedIds(selected), [ selected ]);
  const shown = useMemo(() => frames.slice(0, MAX_ROWS), [ frames ]);
  const prefix = useMemo(() => framePrefix(fileName), [ fileName ]);
  const duration = useMemo(() => totalDuration(frames), [ frames ]);
  const loopCount = gif?.loopCount ?? null;

  // 把当前帧画到预览画布
  useEffect(() => {
    const canvas = previewRef.current;
    const frame = frames[current];
    if (!canvas || !gif || !frame) return;
    drawRgba(canvas, frame.data, gif.width, gif.height);
  }, [ gif, frames, current ]);

  // 播放: 按当前帧延时 (受速度倍率影响) 自动切下一帧
  useEffect(() => {
    if (!playing || frames.length <= 1) return;
    const timer = window.setTimeout(
      () => setCurrent((c) => nextFrame(c, frames.length)),
      frameWait(frames[current]?.delay ?? 100, speed),
    );
    return () => window.clearTimeout(timer);
  }, [ playing, frames, current, speed ]);

  const loadFile = async (file: File) => {
    if (file.size > MAX_GIF_SIZE) {
      notice.error(tt('GIF 文件过大 ({size}), 请选择小于 {max} 的文件', {
        size: formatBytes(file.size), max: formatBytes(MAX_GIF_SIZE),
      }));
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const data = parseGif(bytes);
      setFileName(file.name);
      setGif(data);
      setSelected(allFrameIds(data.frames.length));
      setCurrent(0);
      setPlaying(data.frames.length > 1);
      setDone(null);
      setProgress(0);
    } catch (err) {
      const raw = String((err as Error)?.message ?? err);
      const key = parseErrorKey(raw);
      notice.error(key !== '' ? tt(key, { n: GIF_MAX_FRAMES }) : tt('GIF 解析失败: {msg}', { msg: raw }));
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await loadFile(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!/\.gif$/i.test(file.name) && file.type !== 'image/gif') { notice.error(t('请选择 .gif 文件')); return; }
    await loadFile(file);
  };

  const clear = () => {
    setFileName('');
    setGif(null);
    setSelected(new Set());
    setCurrent(0);
    setPlaying(false);
    setDone(null);
    setProgress(0);
  };

  /** 导出选中的帧为逐个 PNG 文件 */
  const exportFrames = async () => {
    if (!gif) return;
    const ids = selectedIds;
    if (ids.length === 0) { notice.warning(t('请先选择要导出的帧')); return; }
    setBusy(true);
    setProgress(0);
    setDone(null);
    try {
      const files: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < ids.length; i += 1) {
        const frame = gif.frames[ids[i]];
        const bytes = frame ? rgbaToPngBytes(frame.data, gif.width, gif.height) : null;
        if (bytes) files.push({ name: frameFileName(prefix, ids[i], gif.frames.length), bytes });
        setProgress(Math.round(((i + 1) / ids.length) * 80));
      }
      if (files.length === 0) { notice.error(t('当前环境不支持 Canvas, 无法导出图片')); return; }
      const written = await saveBytesBatch(files, { title: t('导出选中帧 (PNG)'), dirName: prefix });
      // 用户取消选择文件夹
      if (written === 0) return;
      setProgress(100);
      setDone(written);
      if (written < files.length) notice.warning(tt('有 {n} 个文件写入失败, 详见控制台', { n: files.length - written }));
      else notice.success(tt('已导出 {n} 个文件', { n: written }));
    } catch (err) {
      notice.error(tt('导出失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    } finally {
      setBusy(false);
    }
  };

  /** 把选中帧拼成一张精灵图导出 */
  const exportSprite = async () => {
    if (!gif) return;
    const ids = selectedIds;
    if (ids.length === 0) { notice.warning(t('请先选择要导出的帧')); return; }
    setBusy(true);
    setProgress(0);
    setDone(null);
    try {
      const sprite = composeSprite(ids.map((id) => gif.frames[id].data), gif.width, gif.height, cols, gap);
      const bytes = rgbaToPngBytes(sprite.data, sprite.width, sprite.height);
      if (!bytes) { notice.error(t('当前环境不支持 Canvas, 无法导出图片')); return; }
      const ok = await saveBytesFile(`${prefix}_sprite.png`, bytes, {
        title: t('导出精灵图'), filterName: 'PNG', extensions: [ 'png' ],
      });
      setProgress(100);
      if (ok) { setDone(1); notice.success(t('精灵图已保存')); }
    } catch (err) {
      notice.error(tt('导出失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    } finally {
      setBusy(false);
    }
  };

  /** 单帧导出 */
  const exportOne = async (frame: GifFrame) => {
    if (!gif) return;
    const bytes = rgbaToPngBytes(frame.data, gif.width, gif.height);
    if (!bytes) { notice.error(t('当前环境不支持 Canvas, 无法导出图片')); return; }
    try {
      const ok = await saveBytesFile(frameFileName(prefix, frame.index, gif.frames.length), bytes, {
        title: t('导出此帧'), filterName: 'PNG', extensions: [ 'png' ],
      });
      if (ok) { setDone(1); setProgress(100); }
    } catch (err) {
      notice.error(tt('导出失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    }
  };

  const changeCols = (v: number | null) => {
    const next = toCols(v);
    setCols(next);
    setDefaultCols(next);
  };
  const changeGap = (v: number | null) => {
    const next = toGap(v);
    setGap(next);
    setDefaultGap(next);
  };

  const dropBorder = dragging ? '#1677ff' : '#d9d9d9';
  const loopText = loopCount === null ? t('只播放一次') : loopCount === 0 ? t('无限循环') : tt('循环 {n} 次', { n: loopCount });

  return (
    <div style={ { width: '100%' } }>
      { contextHolder }

      {/* 选择 / 拖拽区 */}
      <div
        className="gs-drop"
        onClick={ () => inputRef.current?.click() }
        onDragOver={ (e) => { e.preventDefault(); setDragging(true); } }
        onDragEnter={ (e) => { e.preventDefault(); setDragging(true); } }
        onDragLeave={ () => setDragging(false) }
        onDrop={ onDrop }
        style={ {
          border: `1px dashed ${dropBorder}`,
          borderRadius: 8,
          padding: '18px 12px',
          textAlign: 'center',
          background: dragging ? 'rgba(22,119,255,0.06)' : 'transparent',
          cursor: 'pointer',
          color: '#888',
          lineHeight: 1.9,
        } }
      >
        <InboxOutlined style={ { fontSize: 28, color: dragging ? '#1677ff' : '#bfbfbf' } } />
        <div>
          { dragging ? t('松开鼠标即可载入 GIF') : t('点击选择 GIF 图片, 或把 .gif 文件拖到这里') }
          { fileName !== '' && <div style={ { color: '#1677ff' } }><b>{ fileName }</b>{ gif ? ` — ${formatBytes(gif.bytes)}` : '' }</div> }
        </div>
      </div>

      <Space wrap style={ { margin: '10px 0 4px' } }>
        <Button type="primary" icon={ <FileImageOutlined /> } onClick={ () => inputRef.current?.click() }>{ t('选择 GIF') }</Button>
        <Button danger icon={ <ClearOutlined /> } disabled={ gif === null } onClick={ clear }>{ t('清空') }</Button>
      </Space>
      <input ref={ inputRef } id="gifSplitInput" type="file" accept=".gif,image/gif" style={ { display: 'none' } } onChange={ onInputChange } />

      { gif === null && (
        <div className="gs-empty" style={ { color: '#999', padding: '10px 2px' } }>{ t('还没有载入 GIF') }</div>
      ) }

      { gif !== null && (
        <>
          <Alert
            type="info"
            showIcon
            className="gs-info"
            style={ { marginTop: 10 } }
            message={ tt('尺寸 {w} × {h} px, 共 {n} 帧, 时长 {dur}, 平均 {fps} fps, {loop}, 文件 {size}', {
              w: gif.width, h: gif.height, n: gif.frames.length,
              dur: formatDuration(duration), fps: formatFps(gif.frames),
              loop: loopText, size: formatBytes(gif.bytes),
            }) }
          />

          <Divider dashed plain style={ { margin: '12px 0 6px' } }>{ t('动画预览') }</Divider>

          <div className="gs-preview" style={ { textAlign: 'center' } }>
            <canvas
              ref={ previewRef }
              className="gs-canvas"
              style={ {
                maxWidth: '100%',
                maxHeight: 320,
                imageRendering: 'pixelated',
                background: 'repeating-conic-gradient(rgba(140,140,140,0.18) 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                border: '1px solid rgba(140,140,140,0.25)',
                borderRadius: 6,
              } }
            />
          </div>

          <Space wrap size={ 12 } align="center" style={ { marginTop: 8, justifyContent: 'center', width: '100%' } }>
            <Space size={ 4 }>
              <Button size="small" aria-label={ t('上一帧') } icon={ <StepBackwardOutlined /> } onClick={ () => { setPlaying(false); setCurrent((c) => prevFrame(c, frames.length)); } } />
              <Button
                size="small"
                type="primary"
                icon={ playing ? <PauseOutlined /> : <CaretRightOutlined /> }
                onClick={ () => setPlaying((p) => !p) }
              >{ playing ? t('暂停') : t('播放') }</Button>
              <Button size="small" aria-label={ t('下一帧') } icon={ <StepForwardOutlined /> } onClick={ () => { setPlaying(false); setCurrent((c) => nextFrame(c, frames.length)); } } />
            </Space>
            <Slider
              style={ { width: 260 } }
              min={ 0 }
              max={ Math.max(0, frames.length - 1) }
              value={ current }
              onChange={ (v: number) => { setPlaying(false); setCurrent(v); } }
              tooltip={ { formatter: (v?: number) => `#${(v ?? 0) + 1}` } }
            />
            <span className="gs-frame-info" style={ { color: '#888', fontSize: 12 } }>
              { tt('第 {i} / {n} 帧, 延时 {delay}', { i: current + 1, n: frames.length, delay: `${frames[current]?.delay ?? 0} ms` }) }
            </span>
            <Space size={ 6 }>
              <span>{ t('播放速度') }</span>
              <Select
                size="small"
                style={ { width: 92 } }
                value={ speed }
                onChange={ (v: number) => setSpeed(v) }
                options={ SPEEDS.map((s) => ({ value: s, label: `${s}×` })) }
              />
            </Space>
          </Space>

          <Divider dashed plain style={ { margin: '12px 0 6px' } }>
            { t('帧列表') }
            { ` · ${tt('已选 {n} 帧', { n: selectedIds.length })}` }
          </Divider>

          <Space wrap style={ { marginBottom: 6 } }>
            <Button size="small" icon={ <UnorderedListOutlined /> } disabled={ busy } onClick={ () => setSelected(allFrameIds(frames.length)) }>{ t('全选') }</Button>
            <Button size="small" disabled={ busy } onClick={ () => setSelected((prev) => invertIds(prev, frames.length)) }>{ t('反选') }</Button>
            <Button size="small" disabled={ busy } onClick={ () => setSelected(new Set()) }>{ t('取消选择') }</Button>
            <Button
              type="primary"
              size="small"
              loading={ busy }
              disabled={ selectedIds.length === 0 }
              onClick={ exportFrames }
            >{ busy ? t('正在导出…') : t('导出选中帧 (PNG)') }</Button>
            <Button
              size="small"
              disabled={ busy || selectedIds.length === 0 }
              onClick={ exportSprite }
            >{ t('导出精灵图') }</Button>
          </Space>

          <Space wrap size={ 12 } align="center" style={ { marginBottom: 8 } }>
            <Space size={ 6 }>
              <span>{ t('精灵图列数') }</span>
              <InputNumber size="small" min={ 1 } max={ 20 } value={ cols } onChange={ changeCols } />
            </Space>
            <Space size={ 6 }>
              <span>{ t('间隔 (px)') }</span>
              <InputNumber size="small" min={ 0 } max={ 20 } value={ gap } onChange={ changeGap } />
            </Space>
            <span style={ { color: '#999', fontSize: 12 } }>{ t('精灵图把选中帧按行列拼成一张 PNG, 列数与间隔会记住上次设置') }</span>
          </Space>

          {/* 帧列表 */}
          <div
            className="gs-list"
            style={ { maxHeight: 360, overflow: 'auto', border: '1px solid rgba(140,140,140,0.25)', borderRadius: 6 } }
          >
            <div
              className="gs-row gs-head"
              style={ {
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', color: '#888', fontSize: 12,
                borderBottom: '1px solid rgba(140,140,140,0.25)', position: 'sticky', top: 0,
                background: 'rgba(140,140,140,0.08)',
              } }
            >
              <span style={ { width: 20 } } />
              <span style={ { width: 76 } }>{ t('缩略图') }</span>
              <span style={ { width: 52 } }>{ t('帧号') }</span>
              <span style={ { width: 84 } }>{ t('延时') }</span>
              <span style={ { width: 168 } }>{ t('区域') }</span>
              <span style={ { width: 96 } }>{ t('处置方式') }</span>
              <span style={ { flex: 1, textAlign: 'right' } }>{ t('导出') }</span>
            </div>

            { shown.map((frame) => (
              <div
                key={ frame.index }
                className="gs-row gs-row-frame"
                style={ {
                  display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px',
                  borderBottom: '1px solid rgba(140,140,140,0.15)', fontSize: 13,
                  background: frame.index === current ? 'rgba(22,119,255,0.07)' : undefined,
                } }
              >
                <Checkbox
                  style={ { width: 20 } }
                  checked={ selected.has(frame.index) }
                  aria-label={ `frame-${frame.index + 1}` }
                  onChange={ () => setSelected((prev) => toggleId(prev, frame.index)) }
                />
                <span style={ { width: 76 } }>
                  <FrameThumb frame={ frame } width={ gif.width } height={ gif.height } />
                </span>
                <span style={ { width: 52 } }>{ `#${frame.index + 1}` }</span>
                <span className="gs-row-delay" style={ { width: 84, color: '#888' } }>{ `${frame.delay} ms` }</span>
                <span style={ { width: 168, color: '#888', fontSize: 12 } }>{ `${frame.width}×${frame.height} @ ${frame.left},${frame.top}` }</span>
                <Tooltip title={ t('处置方式决定下一帧绘制前如何处理本帧画面 (保留 / 还原背景 / 还原上一帧)') }>
                  <span style={ { width: 96, color: '#888', fontSize: 12 } }>{ t(disposalKey(frame.disposal)) }</span>
                </Tooltip>
                <span style={ { flex: 1, textAlign: 'right' } }>
                  <Button size="small" type="text" icon={ <DownloadOutlined /> } aria-label={ `${t('导出此帧')} #${frame.index + 1}` } onClick={ () => exportOne(frame) } />
                </span>
              </div>
            ))}
          </div>

          { frames.length > MAX_ROWS && (
            <div style={ { color: '#999', fontSize: 12, margin: '4px 2px 0' } }>{ tt('只显示前 {n} 帧 (导出不受影响)', { n: MAX_ROWS }) }</div>
          ) }

          { busy && <Progress percent={ progress } style={ { maxWidth: 420, marginTop: 10 } } /> }

          { done !== null && (
            <Alert
              type="success"
              showIcon
              className="gs-result"
              style={ { marginTop: 12 } }
              message={ tt('导出完成: 共 {n} 个文件', { n: done }) }
            />
          ) }
        </>
      ) }

      <Collapse
        ghost
        style={ { marginTop: 14 } }
        items={ [ {
          key: 'intro',
          label: t('GIF 拆解说明'),
          children: (
            <div style={ { color: '#888', lineHeight: 1.9 } }>
              <p>{ t('读取 GIF 的每一帧并按处置方式 (保留 / 还原背景 / 还原上一帧) 合成出完整画面, 全部在本地浏览器 / WebView 内完成, GIF 不会上传到任何服务器。') }</p>
              <p>{ t('预览可播放 / 暂停 / 逐帧步进, 并能调整播放速度; 帧列表给出延时、绘制区域与处置方式, 便于检查合成结果。') }</p>
              <p>{ t('「导出选中帧」会为每帧输出一个 PNG, 桌面版选择一个文件夹后按「GIF 文件名/帧序号」写入; Web 演示版会逐个触发下载。') }</p>
              <p>{ t('「导出精灵图」把选中帧按行列拼成一张 PNG (列数与间隔可调), 适合做素材图集或对照检查。') }</p>
            </div>
          ),
        } ] }
      />
    </div>
  );
};

export default GifSplit;
