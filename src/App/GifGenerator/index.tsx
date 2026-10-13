// GIF 生成: 把多张图片按统一尺寸合成帧并编码为 GIF (modern-gif 编码, 全程本地)
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Button, Checkbox, Collapse, ColorPicker, Divider, InputNumber, Progress, Select, Space, Tooltip, message,
} from "antd";
import {
  ArrowDownOutlined, ArrowUpOutlined, CaretRightOutlined, ClearOutlined, DeleteOutlined, DownloadOutlined,
  FileImageOutlined, InboxOutlined, PauseOutlined, SwapOutlined,
} from '@ant-design/icons';
import { saveBytesFile } from "../../lib/tauri";
import {
  GIF_DITHERS, drawRgba, encodeGif, formatDuration, type EncodeFrame, type GifDither,
} from "../../lib/gif";
import { CANVAS_MAX, formatBytes, isImageFile, loadImageFile, type Size } from "../../lib/image";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from './lang';
import {
  BG_DEFAULT, COLORS_MAX, COLORS_MIN, DELAY_MAX, DELAY_MIN, DITHER_TEXT, FIT_HINTS,
  FIT_MODES, FIT_TEXT, GIF_GEN_CHANGED, LOOP_MAX, LOOP_MIN, MAX_IMAGES, buildFrames,
  canvasSizeFor, defaultGifName, getGenDefaults, moveItem, normalizeColor, normalizeDelay, removeItem,
  reverseItems, setGenDefault, totalMs, withAllDelays, withDelay, type FitMode, type GenDefaults,
} from './lib';

interface GenItem {
  id: number;
  name: string;
  url: string;
  img: HTMLImageElement;
  size: Size;
  delay: number;
}

/** 列表里的缩略图: 用已解码的图片直接画 (canvas 不可用时留空) */
const ItemThumb = ({ item }: { item: GenItem }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = 56;
    const h = Math.max(1, Math.round((item.size.height / Math.max(1, item.size.width)) * w));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(item.img, 0, 0, w, h);
  }, [ item ]);
  return <canvas ref={ ref } className="gg-thumb" style={ { display: 'block', width: 56, height: 'auto' } } />;
};

const GifGenerator = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);

  const initial: GenDefaults = useMemo(() => getGenDefaults(), []);
  const [ items, setItems ] = useState<GenItem[]>([]);
  const [ fit, setFit ] = useState<FitMode>(initial.fit);
  const [ custom, setCustom ] = useState<Size>({ width: 320, height: 320 });
  const [ delay, setDelay ] = useState<number>(initial.delay);
  const [ loop, setLoop ] = useState<number>(initial.loop);
  const [ colors, setColors ] = useState<number>(initial.colors);
  const [ dither, setDither ] = useState<GifDither>(initial.dither);
  const [ transparent, setTransparent ] = useState<boolean>(initial.bg === '');
  const [ bg, setBg ] = useState<string>(initial.bg === '' ? '#ffffff' : initial.bg);
  const [ previewIndex, setPreviewIndex ] = useState(0);
  const [ playing, setPlaying ] = useState(true);
  const [ built, setBuilt ] = useState<EncodeFrame[] | null>(null);
  const [ dragging, setDragging ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ result, setResult ] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const seq = useRef(1);

  const canvasSize = useMemo(
    () => canvasSizeFor(items.map((i) => i.size), fit, custom),
    [ items, fit, custom ],
  );
  const duration = useMemo(() => totalMs(items), [ items ]);
  const bgValue = transparent ? BG_DEFAULT : bg;

  // 设置页改默认值时同步 (未选图片时立即生效)
  useEffect(() => {
    const onChanged = () => {
      const d = getGenDefaults();
      setFit(d.fit);
      setDelay(d.delay);
      setLoop(d.loop);
      setColors(d.colors);
      setDither(d.dither);
      setTransparent(d.bg === '');
      if (d.bg !== '') setBg(d.bg);
    };
    window.addEventListener(GIF_GEN_CHANGED, onChanged);
    return () => window.removeEventListener(GIF_GEN_CHANGED, onChanged);
  }, []);

  // 参数变化时重算合成帧 (画布尺寸 / 尺寸模式 / 背景色)
  useEffect(() => {
    if (items.length === 0) { setBuilt(null); return; }
    setBuilt(buildFrames(
      items.map((i) => ({ img: i.img, size: i.size })),
      { width: canvasSize.width, height: canvasSize.height, fit, delay, bg: bgValue },
      items.map((i) => i.delay),
    ));
  }, [ items, fit, canvasSize.width, canvasSize.height, bgValue, delay ]);

  // 预览当前帧
  useEffect(() => {
    const canvas = previewRef.current;
    const frame = built?.[previewIndex];
    if (!canvas || !frame) return;
    drawRgba(canvas, frame.data, canvasSize.width, canvasSize.height);
  }, [ built, previewIndex, canvasSize.width, canvasSize.height ]);

  // 预览播放
  useEffect(() => {
    if (!playing || !built || built.length <= 1) return;
    const timer = window.setTimeout(
      () => setPreviewIndex((i) => (i + 1) % built.length),
      Math.max(20, built[previewIndex]?.delay ?? delay),
    );
    return () => window.clearTimeout(timer);
  }, [ playing, built, previewIndex, delay ]);

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const room = MAX_IMAGES - items.length;
    if (room <= 0) {
      notice.warning(tt('图片过多 (最多 {n} 张), 已忽略多余的图片', { n: MAX_IMAGES }));
      return;
    }
    if (files.length > room) notice.warning(tt('图片过多 (最多 {n} 张), 已忽略多余的图片', { n: MAX_IMAGES }));
    const next: GenItem[] = [];
    for (const file of files.slice(0, room)) {
      if (!isImageFile(file)) { notice.error(tt('读取图片失败: {msg}', { msg: file.name })); continue; }
      try {
        const loaded = await loadImageFile(file);
        next.push({ id: seq.current++, name: file.name, url: loaded.url, img: loaded.img, size: loaded.size, delay });
      } catch (err) {
        notice.error(tt('读取图片失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
      }
    }
    if (next.length === 0) return;
    setItems((prev) => [ ...prev, ...next ]);
    setResult(null);
    notice.success(tt('已添加 {n} 张图片', { n: next.length }));
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    await addFiles(files);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    await addFiles(Array.from(e.dataTransfer?.files ?? []));
  };

  const clear = () => {
    setItems([]);
    setBuilt(null);
    setPreviewIndex(0);
    setResult(null);
    setProgress(0);
  };

  const changeDelay = (v: number | null) => {
    const d = normalizeDelay(v);
    setDelay(d);
    setItems((prev) => withAllDelays(prev, d));
  };

  const changeCanvas = (key: 'width' | 'height', v: number | null) => {
    const n = Math.min(CANVAS_MAX, Math.max(1, Math.round(Number(v) || 0) || 1));
    setCustom((prev) => ({ ...prev, [key]: n }));
  };

  const generate = async () => {
    if (items.length === 0) { notice.warning(t('请先添加图片')); return; }
    setBusy(true);
    setProgress(8);
    setResult(null);
    try {
      const frames = built ?? buildFrames(
        items.map((i) => ({ img: i.img, size: i.size })),
        { width: canvasSize.width, height: canvasSize.height, fit, delay, bg: bgValue },
        items.map((i) => i.delay),
      );
      if (!frames || frames.length === 0) { notice.error(t('当前环境不支持 Canvas, 无法生成 GIF')); return; }
      setProgress(45);
      const bytes = await encodeGif(frames, {
        width: canvasSize.width,
        height: canvasSize.height,
        loop,
        maxColors: colors,
        dither,
      });
      setProgress(100);
      setResult({ bytes, name: defaultGifName(items) });
      notice.success(tt('已生成 GIF ({size})', { size: formatBytes(bytes.length) }));
    } catch (err) {
      notice.error(tt('生成失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!result) return;
    try {
      const ok = await saveBytesFile(result.name, result.bytes, {
        title: t('保存 GIF'), filterName: 'GIF', extensions: [ 'gif' ],
      });
      if (ok) notice.success(tt('已保存 {name}', { name: result.name }));
    } catch (err) {
      notice.error(tt('保存失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    }
  };

  const dropBorder = dragging ? '#1677ff' : '#d9d9d9';

  return (
    <div style={ { width: '100%' } }>
      { contextHolder }

      {/* 选择 / 拖拽区 */}
      <div
        className="gg-drop"
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
          { dragging ? t('松开鼠标即可载入图片') : t('点击选择图片, 或把多张图片拖到这里') }
          <div style={ { fontSize: 12 } }>{ tt('按添加顺序排列, 可用上移 / 下移 / 反转调整帧顺序; 最多 {n} 张', { n: MAX_IMAGES }) }</div>
        </div>
      </div>

      <Space wrap style={ { margin: '10px 0 4px' } }>
        <Button type="primary" icon={ <FileImageOutlined /> } onClick={ () => inputRef.current?.click() }>{ t('选择图片') }</Button>
        <Button danger icon={ <ClearOutlined /> } disabled={ items.length === 0 } onClick={ clear }>{ t('清空') }</Button>
      </Space>
      <input
        ref={ inputRef }
        id="gifGenInput"
        type="file"
        accept="image/*"
        multiple
        style={ { display: 'none' } }
        onChange={ onInputChange }
      />

      { items.length === 0 && (
        <div className="gg-empty" style={ { color: '#999', padding: '10px 2px' } }>{ t('还没有选择图片') }</div>
      ) }

      { items.length > 0 && (
        <>
          <Alert
            type="info"
            showIcon
            className="gg-info"
            style={ { marginTop: 10 } }
            message={ tt('共 {n} 帧, 画布 {w} × {h} px, 总时长 {dur}, {loop}', {
              n: items.length, w: canvasSize.width, h: canvasSize.height,
              dur: formatDuration(duration),
              loop: loop === 0 ? t('无限循环') : tt('循环 {n} 次', { n: loop }),
            }) }
          />

          <Divider dashed plain style={ { margin: '12px 0 6px' } }>{ t('输出设置') }</Divider>

          <Space wrap size={ 16 } align="center" style={ { marginBottom: 6 } }>
            <Space size={ 6 }>
              <span>{ t('尺寸模式') }</span>
              <Tooltip title={ t(FIT_HINTS[fit]) }>
                <Select<FitMode>
                  size="small"
                  style={ { width: 168 } }
                  value={ fit }
                  onChange={ (v) => { setFit(v); setGenDefault('fit', v); } }
                  options={ FIT_MODES.map((m) => ({ value: m, label: t(FIT_TEXT[m]) })) }
                />
              </Tooltip>
            </Space>
            <Space size={ 6 }>
              <span>{ t('画布宽度') }</span>
              <InputNumber
                size="small"
                min={ 1 }
                max={ CANVAS_MAX }
                disabled={ fit === 'source' }
                value={ canvasSize.width }
                onChange={ (v) => changeCanvas('width', v) }
              />
              <span>{ t('画布高度') }</span>
              <InputNumber
                size="small"
                min={ 1 }
                max={ CANVAS_MAX }
                disabled={ fit === 'source' }
                value={ canvasSize.height }
                onChange={ (v) => changeCanvas('height', v) }
              />
            </Space>
            <Space size={ 6 }>
              <span>{ t('帧延时 (ms)') }</span>
              <InputNumber
                size="small"
                min={ DELAY_MIN }
                max={ DELAY_MAX }
                step={ 10 }
                value={ delay }
                onChange={ changeDelay }
              />
              <Tooltip title={ t('改动后应用到所有帧') }>
                <Button size="small" id="ggDelayApply" onClick={ () => changeDelay(delay) }>{ t('应用到全部帧') }</Button>
              </Tooltip>
            </Space>
          </Space>

          <Space wrap size={ 16 } align="center" style={ { marginBottom: 6 } }>
            <Space size={ 6 }>
              <span>{ t('循环次数') }</span>
              <InputNumber
                size="small"
                min={ LOOP_MIN }
                max={ LOOP_MAX }
                value={ loop }
                onChange={ (v) => { const n = Number(v) || 0; setLoop(n); setGenDefault('loop', n); } }
              />
              <span style={ { color: '#999', fontSize: 12 } }>{ t('0 表示无限循环') }</span>
            </Space>
            <Space size={ 6 }>
              <span>{ t('最大颜色数') }</span>
              <InputNumber
                size="small"
                min={ COLORS_MIN }
                max={ COLORS_MAX }
                value={ colors }
                onChange={ (v) => { const n = Number(v) || COLORS_MAX; setColors(n); setGenDefault('colors', n); } }
              />
            </Space>
            <Space size={ 6 }>
              <span>{ t('抖动') }</span>
              <Select<GifDither>
                size="small"
                style={ { width: 148 } }
                value={ dither }
                onChange={ (v) => { setDither(v); setGenDefault('dither', v); } }
                options={ GIF_DITHERS.map((d) => ({ value: d, label: t(DITHER_TEXT[d]) })) }
              />
            </Space>
            <Space size={ 6 }>
              <Checkbox
                checked={ transparent }
                onChange={ (e) => { setTransparent(e.target.checked); setGenDefault('bg', e.target.checked ? BG_DEFAULT : bg); } }
              >{ t('透明') }</Checkbox>
              <ColorPicker
                size="small"
                disabled={ transparent }
                value={ bg }
                onChangeComplete={ (c) => {
                  const hex = normalizeColor(c.toHexString(), bg);
                  setBg(hex);
                  setGenDefault('bg', transparent ? BG_DEFAULT : hex);
                } }
              />
              <span style={ { color: '#999', fontSize: 12 } }>
                { transparent ? t('背景透明') : tt('背景色 {c}', { c: bg }) }
              </span>
            </Space>
          </Space>

          <Divider dashed plain style={ { margin: '12px 0 6px' } }>{ t('动画预览') }</Divider>

          <div className="gg-preview" style={ { textAlign: 'center' } }>
            <canvas
              ref={ previewRef }
              className="gg-canvas"
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
            <Button
              size="small"
              type="primary"
              icon={ playing ? <PauseOutlined /> : <CaretRightOutlined /> }
              onClick={ () => setPlaying((p) => !p) }
            >{ playing ? t('暂停') : t('播放') }</Button>
            <span className="gg-frame-info" style={ { color: '#888', fontSize: 12 } }>
              { tt('第 {i} / {n} 帧, 延时 {delay}', { i: previewIndex + 1, n: built?.length ?? 0, delay: `${built?.[previewIndex]?.delay ?? 0} ms` }) }
            </span>
          </Space>

          <Divider dashed plain style={ { margin: '12px 0 6px' } }>
            { t('帧列表') }
            { ` · ${tt('共 {n} 帧', { n: items.length })}` }
          </Divider>

          <Space wrap style={ { marginBottom: 6 } }>
            <Button size="small" icon={ <SwapOutlined /> } disabled={ items.length < 2 } onClick={ () => { setItems((prev) => reverseItems(prev)); setResult(null); } }>{ t('反转顺序') }</Button>
            <Button type="primary" size="small" loading={ busy } disabled={ busy } onClick={ generate }>{ busy ? t('正在生成…') : t('生成 GIF') }</Button>
            { result !== null && (
              <Button size="small" icon={ <DownloadOutlined /> } onClick={ save }>{ t('保存 GIF') }</Button>
            ) }
          </Space>

          {/* 帧列表 */}
          <div
            className="gg-list"
            style={ { maxHeight: 360, overflow: 'auto', border: '1px solid rgba(140,140,140,0.25)', borderRadius: 6 } }
          >
            <div
              className="gg-row gg-head"
              style={ {
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', color: '#888', fontSize: 12,
                borderBottom: '1px solid rgba(140,140,140,0.25)', position: 'sticky', top: 0,
                background: 'rgba(140,140,140,0.08)',
              } }
            >
              <span style={ { width: 56 } }>{ t('缩略图') }</span>
              <span style={ { width: 56 } }>{ t('帧号') }</span>
              <span style={ { flex: 1 } }>{ t('文件名') }</span>
              <span style={ { width: 96 } }>{ t('原始尺寸') }</span>
              <span style={ { width: 110 } }>{ t('延时 (ms)') }</span>
              <span style={ { width: 132, textAlign: 'right' } }>{ t('顺序 / 删除') }</span>
            </div>

            { items.map((item, index) => (
              <div
                key={ item.id }
                className="gg-row gg-row-frame"
                style={ {
                  display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px',
                  borderBottom: '1px solid rgba(140,140,140,0.15)', fontSize: 13,
                  background: index === previewIndex ? 'rgba(22,119,255,0.07)' : undefined,
                } }
              >
                <span style={ { width: 56 } }><ItemThumb item={ item } /></span>
                <span style={ { width: 56 } }>{ `#${index + 1}` }</span>
                <span className="gg-row-name" style={ { flex: 1, color: '#888', fontSize: 12, wordBreak: 'break-all' } }>{ item.name }</span>
                <span style={ { width: 96, color: '#888', fontSize: 12 } }>{ `${item.size.width}×${item.size.height}` }</span>
                <InputNumber
                  size="small"
                  style={ { width: 104 } }
                  min={ DELAY_MIN }
                  max={ DELAY_MAX }
                  step={ 10 }
                  value={ item.delay }
                  aria-label={ `${t('延时 (ms)')} #${index + 1}` }
                  onChange={ (v) => { setItems((prev) => withDelay(prev, index, Number(v) || DELAY_MIN)); setResult(null); } }
                />
                <span style={ { width: 132, textAlign: 'right' } }>
                  <Button
                    size="small"
                    type="text"
                    aria-label={ `${t('上移')} #${index + 1}` }
                    icon={ <ArrowUpOutlined /> }
                    disabled={ index === 0 }
                    onClick={ () => { setItems((prev) => moveItem(prev, index, -1)); setResult(null); } }
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label={ `${t('下移')} #${index + 1}` }
                    icon={ <ArrowDownOutlined /> }
                    disabled={ index === items.length - 1 }
                    onClick={ () => { setItems((prev) => moveItem(prev, index, 1)); setResult(null); } }
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    aria-label={ `${t('删除')} #${index + 1}` }
                    icon={ <DeleteOutlined /> }
                    onClick={ () => { setItems((prev) => removeItem(prev, index)); setResult(null); } }
                  />
                </span>
              </div>
            ))}
          </div>

          { busy && <Progress percent={ progress } style={ { maxWidth: 420, marginTop: 10 } } /> }

          { result !== null && (
            <Alert
              type="success"
              showIcon
              className="gg-result"
              style={ { marginTop: 12 } }
              message={ tt('已生成 GIF ({size})', { size: formatBytes(result.bytes.length) }) }
              description={ tt('文件名 {name}, 点「保存 GIF」写入磁盘 (Web 演示版会触发下载)', { name: result.name }) }
            />
          ) }
        </>
      ) }

      <Collapse
        ghost
        style={ { marginTop: 14 } }
        items={ [ {
          key: 'intro',
          label: t('GIF 生成说明'),
          children: (
            <div style={ { color: '#888', lineHeight: 1.9 } }>
              <p>{ t('把多张图片按添加顺序合成动画帧, 用 modern-gif 在本地编码成 GIF 文件, 图片不会上传到任何服务器。') }</p>
              <p>{ t('多张图片尺寸不一致时按「尺寸模式」放入画布: 完整显示会留白, 裁剪填满会去掉多余部分, 拉伸铺满可能变形, 跟随第一张图则用首图尺寸当画布。') }</p>
              <p>{ t('帧延时决定动画速度, 逐帧可单独调整; 循环次数为 0 表示无限循环。颜色数越少文件越小, 抖动可让渐变更自然。') }</p>
              <p>{ t('背景透明时留白处没有像素 (棋盘格显示), 如需实色背景请关闭「透明」并选择背景色。') }</p>
              <p>{ t('生成后可先看预览确认顺序与速度, 再「保存 GIF」; 聊天表情包常用 240×240 / 320×320 的画布。') }</p>
            </div>
          ),
        } ] }
      />
    </div>
  );
};

export default GifGenerator;
