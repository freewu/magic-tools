// 图片尺寸调整: 按比例或按像素缩放图片, 支持锁定宽高比 / 不放大 / PNG·JPEG 输出
import { Alert, Button, Divider, InputNumber, Radio, Segmented, Slider, Space, Switch, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { saveBytesFile, savePngFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { ir, irT } from './lang';
import {
  CANVAS_MAX, PERCENT_MAX, PERCENT_MIN, PERCENT_PRESETS, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN, SIZE_MAX, SIZE_MIN,
} from './data';
import {
  OUTPUT_FORMATS, SIZE_MODES, baseName, computeSize, dataUrlToBytes, formatBytes, formatScale,
  getDefaultFormat, getDefaultPercent, getDefaultQuality, getLockRatio, outputFileName, scaleSteps,
  setLockRatio, sizeFromHeight, sizeFromWidth,
  type OutputFormat, type Size, type SizeMode,
} from './lib';
import ImageResizeIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 缩放结果 */
interface ResizeResult { url: string; bytes: number; width: number; height: number; }

const ImageResize = () => {
  const { locale } = useLocale();
  const t = (zh: string) => ir(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => irT(locale, zh, v);
  const { token } = theme.useToken();

  const imgRef = useRef<HTMLImageElement | null>(null); // 已解码的原图
  const [ src, setSrc ] = useState(''); // 原图 dataURL (预览)
  const [ orig, setOrig ] = useState<Size>({ width: 0, height: 0 }); // 原图尺寸
  const [ fileBytes, setFileBytes ] = useState(0); // 原图字节数 (来自所选文件)
  const [ base, setBase ] = useState('image'); // 文件名主体
  const [ mode, setMode ] = useState<SizeMode>('percent'); // 尺寸模式
  const [ percent, setPercent ] = useState<number>(() => getDefaultPercent()); // 缩放比例
  const [ width, setWidth ] = useState(0); // 目标宽度 (按像素)
  const [ height, setHeight ] = useState(0); // 目标高度 (按像素)
  const [ lock, setLock ] = useState<boolean>(() => getLockRatio()); // 锁定宽高比
  const [ noUpscale, setNoUpscale ] = useState(true); // 不放大 (仅缩小)
  const [ format, setFormat ] = useState<OutputFormat>(() => getDefaultFormat()); // 输出格式
  const [ quality, setQuality ] = useState<number>(() => getDefaultQuality()); // JPEG 质量
  const [ result, setResult ] = useState<ResizeResult | null>(null);
  const [ busy, setBusy ] = useState(false); // 处理中
  const [ saving, setSaving ] = useState(false); // 保存中
  const [ err, setErr ] = useState('');

  /** 读取文件 -> 解码图片 (同时记下文件名与原始字节数) */
  const onFile = (file: File) => {
    if (!file.type.startsWith('image/')) { message.error(t('请选择图片文件')); return false; }
    const reader = new FileReader();
    reader.onerror = () => setErr(t('图片读取失败'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const img = new Image();
      img.onerror = () => setErr(t('图片解析失败'));
      img.onload = () => {
        imgRef.current = img;
        const size = { width: img.naturalWidth, height: img.naturalHeight };
        setOrig(size);
        setFileBytes(file.size);
        setBase(baseName(file.name));
        setWidth(size.width);
        setHeight(size.height);
        setErr('');
        setSrc(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    return false;
  };

  /** 切换尺寸模式: 进入按像素时用当前结果尺寸回填, 避免数值跳变 */
  const onModeChange = (v: SizeMode) => {
    if (v === 'pixel' && src !== '') {
      const cur = computeSize(orig, { mode, percent, width, height, noUpscale });
      setWidth(cur.width);
      setHeight(cur.height);
    }
    setMode(v);
  };

  const onWidthChange = (v: number | null) => {
    const w = Number(v ?? SIZE_MIN);
    setWidth(w);
    if (lock) setHeight(sizeFromWidth(w, orig).height);
  };

  const onHeightChange = (v: number | null) => {
    const h = Number(v ?? SIZE_MIN);
    setHeight(h);
    if (lock) setWidth(sizeFromHeight(h, orig).width);
  };

  const onLockChange = (v: boolean) => {
    setLock(v);
    setLockRatio(v);
    if (v) setHeight(sizeFromWidth(width, orig).height);
  };

  /** 用原图尺寸回填宽高 */
  const onUseOriginal = () => {
    setWidth(orig.width);
    setHeight(orig.height);
  };

  /** 缩放: 逐级绘制 (大比例缩小时画质更好) -> dataURL */
  const resize = () => {
    const img = imgRef.current;
    if (!img) return;
    const t0 = computeSize(orig, { mode, percent, width, height, noUpscale });
    if (t0.width < 1 || t0.height < 1) {
      setResult(null);
      setErr(t('目标尺寸无效'));
      return;
    }
    if (t0.width > CANVAS_MAX || t0.height > CANVAS_MAX) {
      setResult(null);
      setErr(tT('目标尺寸过大, 单边不能超过 {n} px', { n: CANVAS_MAX }));
      return;
    }
    // 原图 -> 逐级中间尺寸 -> 目标尺寸
    let source: HTMLImageElement | HTMLCanvasElement = img;
    for (const step of scaleSteps(img.naturalWidth, img.naturalHeight, t0.width, t0.height)) {
      const canvas = document.createElement('canvas');
      canvas.width = step.width;
      canvas.height = step.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setResult(null); setErr(t('当前环境不支持 Canvas, 无法调整尺寸')); return; }
      // JPEG 无透明通道, 先铺白底避免透明区域变黑
      if (format === 'JPEG') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, step.width, step.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, step.width, step.height);
      source = canvas;
    }
    const url = format === 'JPEG'
      ? (source as HTMLCanvasElement).toDataURL('image/jpeg', quality)
      : (source as HTMLCanvasElement).toDataURL('image/png');
    setResult({
      url,
      // base64 长度 -> 大致字节数 (4 字符表示 3 字节)
      bytes: Math.round((url.length - url.indexOf(',') - 1) * 0.75),
      width: t0.width,
      height: t0.height,
    });
    setErr('');
  };

  // 图片或参数变化后重新缩放 (先渲染再计算, 避免界面卡住没有反馈)
  useEffect(() => {
    if (!src) return;
    setBusy(true);
    const timer = window.setTimeout(() => {
      try {
        resize();
      } catch (e) {
        setResult(null);
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ src, orig, mode, percent, width, height, noUpscale, format, quality ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    imgRef.current = null;
    setSrc('');
    setOrig({ width: 0, height: 0 });
    setFileBytes(0);
    setWidth(0);
    setHeight(0);
    setResult(null);
    setErr('');
  };

  /** 保存结果 (PNG 走图片保存, JPEG 走字节保存) */
  const onSave = async () => {
    if (!result || saving) return;
    setSaving(true);
    const name = outputFileName(base, { width: result.width, height: result.height }, format);
    try {
      const ok = format === 'PNG'
        ? await savePngFile(name, result.url)
        : await saveBytesFile(name, dataUrlToBytes(result.url), {
          title: t('保存'),
          filterName: 'JPEG',
          extensions: [ 'jpg', 'jpeg' ],
        });
      if (ok) message.success(tT('已保存 {n}', { n: name }));
      else message.info(t('已取消保存'));
    } catch {
      message.error(t('保存失败, 请重试'));
    } finally {
      setSaving(false);
    }
  };

  const fmtSize = (s: Size) => tT('{a} × {b} px', { a: s.width, b: s.height });

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0, fontFamily: MONO } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6 } }>{ value }</span>
    </Tag>
  );

  const preview = (url: string, style: React.CSSProperties = {}) => (
    <img
      src={ url }
      alt=""
      style={ {
        maxWidth: 260,
        maxHeight: 200,
        objectFit: 'contain',
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        background: token.colorFillQuaternary,
        ...style,
      } }
    />
  );

  return (
    <>
      {/* 顶部操作栏 */}
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 } }>
        <Space wrap>
          <Upload accept="image/*" showUploadList={ false } beforeUpload={ (f) => { onFile(f as File); return false; } }>
            <Button size="small" icon={ <UploadOutlined /> }>{ src ? t('重新选择') : t('选择图片') }</Button>
          </Upload>
          <Button
            size="small"
            type="primary"
            icon={ <DownloadOutlined /> }
            onClick={ onSave }
            loading={ saving }
            disabled={ !result }
          >
            { t('保存') }
          </Button>
          <Button size="small" onClick={ onClear } disabled={ !src }>{ t('清空') }</Button>
        </Space>
        { busy ? <Tag color="processing">{ t('正在处理…') }</Tag> : null }
      </div>

      { err ? <Alert type="error" showIcon style={ { marginBottom: 8 } } message={ err } /> : null }

      {/* 选择 / 预览 */}
      { src === '' ? (
        <div
          onDragOver={ (e) => e.preventDefault() }
          onDrop={ (e) => { e.preventDefault(); const f = e.dataTransfer.files; if (f.length > 0) onFile(f[0]); } }
          style={ {
            border: `1px dashed ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorFillQuaternary,
            padding: '48px 16px',
            textAlign: 'center',
          } }
        >
          <UploadOutlined style={ { fontSize: 32, color: token.colorTextSecondary } } />
          <div style={ { marginTop: 12 } }>{ t('拖拽图片到此处, 或点击「选择图片」') }</div>
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)') }</Text>
        </div>
      ) : (
        <div style={ { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' } }>
          <div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('原图') }</Text>
            { preview(src) }
          </div>
          <div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('结果') }</Text>
            { result
              ? preview(result.url)
              : (
                <div
                  style={ {
                    width: 260,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${token.colorBorder}`,
                    borderRadius: token.borderRadius,
                    background: token.colorFillQuaternary,
                    color: token.colorTextSecondary,
                    fontSize: 12,
                  } }
                >
                  { t('正在处理…') }
                </div>
              ) }
          </div>
          <div style={ { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: 420 } }>
            { statTag(t('原图尺寸'), fmtSize(orig)) }
            { statTag(t('结果尺寸'), result ? fmtSize({ width: result.width, height: result.height }) : '—') }
            { statTag(t('缩放比例'), result ? formatScale(orig, { width: result.width, height: result.height }) : '—') }
            { statTag(t('原图体积'), fileBytes > 0 ? formatBytes(fileBytes) : '—') }
            { statTag(t('结果体积'), result ? formatBytes(result.bytes) : '—') }
            { statTag(t('输出格式'), format === 'JPEG' ? `JPEG · ${quality}` : 'PNG') }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('尺寸参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('尺寸模式') }</Text>
          <Segmented
            value={ mode }
            onChange={ (v) => onModeChange(v as SizeMode) }
            options={ SIZE_MODES.map((m) => ({ value: m, label: t(m === 'percent' ? '按比例' : '按像素') })) }
          />
        </div>

        { mode === 'percent' ? (
          <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
            <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('缩放比例') }</Text>
            <Slider
              style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
              min={ PERCENT_MIN }
              max={ PERCENT_MAX }
              step={ 1 }
              value={ percent }
              onChange={ setPercent }
              marks={ { [PERCENT_MIN]: `1%`, 100: '100%', [PERCENT_MAX]: `${PERCENT_MAX}%` } }
            />
            <InputNumber
              min={ PERCENT_MIN }
              max={ PERCENT_MAX }
              step={ 1 }
              addonAfter="%"
              value={ percent }
              onChange={ (v) => setPercent(Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, Number(v ?? PERCENT_MIN)))) }
            />
            <Radio.Group
              value={ PERCENT_PRESETS.includes(percent as 25 | 50 | 75 | 100) ? percent : null }
              onChange={ (e) => setPercent(Number(e.target.value)) }
              options={ PERCENT_PRESETS.map((p) => ({ value: p, label: `${p}%` })) }
              optionType="button"
              buttonStyle="solid"
              size="small"
            />
          </div>
        ) : (
          <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
            <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('宽度') }</Text>
            <InputNumber
              min={ SIZE_MIN }
              max={ SIZE_MAX }
              value={ width }
              onChange={ onWidthChange }
              style={ { width: 120 } }
            />
            <Text style={ { flex: '0 0 auto' } }>{ t('高度') }</Text>
            <InputNumber
              min={ SIZE_MIN }
              max={ SIZE_MAX }
              value={ height }
              onChange={ onHeightChange }
              style={ { width: 120 } }
            />
            <Button size="small" onClick={ onUseOriginal } disabled={ !src }>{ t('用原图尺寸') }</Button>
          </div>
        ) }

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('锁定宽高比') }</Text>
          <Switch checked={ lock } onChange={ onLockChange } disabled={ mode === 'percent' } />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('按像素模式下生效: 修改宽度或高度时自动换算另一边') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('不放大图片 (仅缩小)') }</Text>
          <Switch checked={ noUpscale } onChange={ setNoUpscale } />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('「不放大」开启时结果不会超过原图尺寸') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('输出格式') }</Text>
          <Segmented
            value={ format }
            onChange={ (v) => setFormat(v as OutputFormat) }
            options={ OUTPUT_FORMATS.map((v) => ({ value: v, label: v })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('JPEG 体积更小, 适合照片; PNG 无损且保留透明') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('JPEG 质量') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ QUALITY_MIN }
            max={ QUALITY_MAX }
            step={ 0.01 }
            value={ quality }
            disabled={ format !== 'JPEG' }
            marks={ { [QUALITY_MIN]: String(QUALITY_MIN), [QUALITY_MAX]: String(QUALITY_MAX) } }
            onChange={ setQuality }
          />
          <InputNumber
            min={ QUALITY_MIN }
            max={ QUALITY_MAX }
            step={ 0.01 }
            value={ quality }
            disabled={ format !== 'JPEG' }
            onChange={ (v) => setQuality(Number(v ?? QUALITY_DEFAULT)) }
          />
        </div>

        <Text type="secondary" style={ { fontSize: 12 } }>{ t('缩小超过一半时会分多步绘制, 避免出现锯齿') }</Text>
      </div>

      <Divider>{ t('图片尺寸调整说明') }</Divider>
      <ImageResizeIntro />
    </>
  );
};

export default ImageResize;
