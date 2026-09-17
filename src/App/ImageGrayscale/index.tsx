// 图片黑白化: 灰度化 (4 种算法) 或 黑白二值化 (Otsu 自动 / 手动阈值)
import { Alert, Button, Divider, InputNumber, Segmented, Slider, Space, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useState } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { bw, bwT } from './lang';
import {
  FILE_SUFFIX, GRAY_METHODS, METHOD_DEFAULT, MODE_DEFAULT, MODES, PREVIEW_MAX_H, PREVIEW_MAX_W, QUALITY_DEFAULT,
  QUALITY_MAX, QUALITY_MIN, THRESHOLD_DEFAULT, THRESHOLD_MAX, THRESHOLD_MIN, THRESHOLD_MODES,
  type GrayMethod, type Mode, type ThresholdMode,
} from './data';
import { autoThresholdOf, binarizePixels, grayscalePixels, normalizeThreshold } from './lib';
import {
  CANVAS_MAX, ImageError, OUTPUT_FORMATS, extOf, filterImage, formatBytes, isLossy, loadImageFile, saveDataUrl,
  supportsWebp,
  type ImageFile, type OutputFormat, type Size,
} from '../../lib/image';
import ImageGrayscaleIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 灰度算法的界面文案与说明 */
const METHOD_LABEL: Record<GrayMethod, string> = {
  luma: '亮度 (推荐)',
  average: '平均',
  max: '最大值',
  min: '最小值',
};
const METHOD_HINT: Record<GrayMethod, string> = {
  luma: '亮度算法与人眼观感最接近 (Rec.709, 与 CSS 的 grayscale 一致)',
  average: '三个通道简单平均, 计算最快, 对纯色块比较平',
  max: '取最亮的通道, 结果整体偏亮 (适合把浅色文字化开)',
  min: '取最暗的通道, 结果整体偏暗 (适合保留深色轮廓)',
};

const ImageGrayscale = () => {
  const { locale } = useLocale();
  const t = (zh: string) => bw(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => bwT(locale, zh, v);
  const { token } = theme.useToken();

  const [ file, setFile ] = useState<ImageFile | null>(null); // 已解码的原图
  const [ mode, setMode ] = useState<Mode>(MODE_DEFAULT); // 灰度 / 二值
  const [ method, setMethod ] = useState<GrayMethod>(METHOD_DEFAULT); // 灰度算法
  const [ thresholdMode, setThresholdMode ] = useState<ThresholdMode>('auto'); // 阈值来源
  const [ threshold, setThreshold ] = useState<number>(THRESHOLD_DEFAULT); // 手动阈值
  const [ autoT, setAutoT ] = useState<number | null>(null); // 本次 Otsu 自动阈值
  const [ format, setFormat ] = useState<OutputFormat>('PNG');
  const [ quality, setQuality ] = useState<number>(QUALITY_DEFAULT);
  const [ result, setResult ] = useState<{ url: string; bytes: number } | null>(null);
  const [ busy, setBusy ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ err, setErr ] = useState('');

  /** 读取文件 -> 解码图片 */
  const onFile = (f: File) => {
    loadImageFile(f)
      .then((loaded) => {
        setFile(loaded);
        setResult(null);
        setErr('');
      })
      .catch((e) => {
        setFile(null);
        setResult(null);
        const code = e instanceof ImageError ? e.code : 'decode-failed';
        setErr(code === 'not-image'
          ? t('请选择图片文件')
          : code === 'read-failed' ? t('图片读取失败') : t('图片解析失败'));
      });
  };

  /** 灰度化 / 二值化 */
  const process = () => {
    const f = file;
    if (!f) return;
    const size: Size = f.size;
    if (size.width > CANVAS_MAX || size.height > CANVAS_MAX) {
      setResult(null);
      setErr(tT('图片尺寸过大, 单边不能超过 {n} px', { n: CANVAS_MAX }));
      return;
    }
    let usedThreshold: number | null = null;
    const out = filterImage(f.img, size, {
      format,
      quality,
      transform: (data) => {
        if (mode === 'binary') {
          // 自动阈值需要按当前像素直方图实时计算 (Otsu), 并在界面上回显
          const v = thresholdMode === 'auto' ? autoThresholdOf(data, method) : normalizeThreshold(threshold);
          usedThreshold = v;
          return binarizePixels(data, v, method);
        }
        return grayscalePixels(data, method);
      },
    });
    if (!out) {
      setResult(null);
      setErr(t('当前环境不支持 Canvas, 无法处理图片'));
      return;
    }
    setAutoT(mode === 'binary' && thresholdMode === 'auto' ? usedThreshold : null);
    setResult(out);
    setErr('');
  };

  // 图片或参数变化后重新处理
  useEffect(() => {
    if (!file) return;
    setBusy(true);
    const timer = window.setTimeout(() => {
      try {
        process();
      } catch (e) {
        setResult(null);
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ file, mode, method, thresholdMode, threshold, format, quality ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    setFile(null);
    setResult(null);
    setAutoT(null);
    setErr('');
  };

  /** 保存结果 (PNG 走图片保存, JPEG / WebP 走字节保存) */
  const onSave = async () => {
    if (!result || !file || saving) return;
    setSaving(true);
    const name = `${file.base}_${FILE_SUFFIX[mode]}.${extOf(format)}`;
    try {
      const ok = await saveDataUrl(result.url, name, format, { title: t('保存') });
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
        maxWidth: PREVIEW_MAX_W,
        maxHeight: PREVIEW_MAX_H,
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
            <Button size="small" icon={ <UploadOutlined /> }>{ file ? t('重新选择') : t('选择图片') }</Button>
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
          <Button size="small" onClick={ onClear } disabled={ !file }>{ t('清空') }</Button>
        </Space>
        { busy ? <Tag color="processing">{ t('正在处理…') }</Tag> : null }
      </div>

      { err ? <Alert type="error" showIcon style={ { marginBottom: 8 } } message={ err } /> : null }

      {/* 选择 / 预览 */}
      { !file ? (
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
            { preview(file.url) }
          </div>
          <div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('结果') }</Text>
            { result
              ? preview(result.url, mode === 'binary' ? { imageRendering: 'pixelated' } : {})
              : (
                <div
                  style={ {
                    width: PREVIEW_MAX_W,
                    height: PREVIEW_MAX_H,
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
            { statTag(t('原图尺寸'), fmtSize(file.size)) }
            { statTag(t('结果尺寸'), result ? fmtSize(file.size) : '—') }
            { statTag(t('原图体积'), formatBytes(file.bytes)) }
            { statTag(t('结果体积'), result ? formatBytes(result.bytes) : '—') }
            { statTag(t('输出格式'), isLossy(format) ? `${format} · ${quality}` : 'PNG') }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('调整参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('处理方式') }</Text>
          <Segmented
            value={ mode }
            onChange={ (v) => setMode(v as Mode) }
            disabled={ !file }
            options={ MODES.map((m) => ({ value: m, label: t(m === 'binary' ? '黑白二值' : '灰度') })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>
            { mode === 'binary'
              ? t('灰度值大于阈值的像素变纯白, 其余变纯黑')
              : t('α (透明度) 通道保持不变; 输出 JPEG / WebP 时会先铺白底') }
          </Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('灰度算法') }</Text>
          <Segmented
            value={ method }
            onChange={ (v) => setMethod(v as GrayMethod) }
            disabled={ !file }
            options={ GRAY_METHODS.map((m) => ({ value: m, label: t(METHOD_LABEL[m]) })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t(METHOD_HINT[method]) }</Text>
        </div>

        { mode === 'binary' ? (
          <>
            <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
              <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('阈值方式') }</Text>
              <Segmented
                value={ thresholdMode }
                onChange={ (v) => setThresholdMode(v as ThresholdMode) }
                disabled={ !file }
                options={ THRESHOLD_MODES.map((m) => ({
                  value: m,
                  label: t(m === 'auto' ? '自动 (Otsu)' : '手动'),
                })) }
              />
              { thresholdMode === 'auto'
                ? <Tag color="blue">{ autoT === null ? '—' : tT('自动阈值 {n}', { n: autoT }) }</Tag>
                : null }
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('Otsu 会按图像直方图自动找出前景 / 背景的最佳分割点') }
              </Text>
            </div>

            { thresholdMode === 'manual' ? (
              <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
                <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('二值阈值') }</Text>
                <Slider
                  style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
                  min={ THRESHOLD_MIN }
                  max={ THRESHOLD_MAX }
                  step={ 1 }
                  value={ threshold }
                  disabled={ !file }
                  marks={ { [THRESHOLD_MIN]: '0', 128: '128', [THRESHOLD_MAX]: '255' } }
                  onChange={ setThreshold }
                />
                <InputNumber
                  min={ THRESHOLD_MIN }
                  max={ THRESHOLD_MAX }
                  step={ 1 }
                  value={ threshold }
                  disabled={ !file }
                  onChange={ (v) => setThreshold(normalizeThreshold(v)) }
                />
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('灰度值大于阈值的像素变纯白, 其余变纯黑') }</Text>
              </div>
            ) : null }
          </>
        ) : null }

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('输出格式') }</Text>
          <Segmented
            value={ format }
            onChange={ (v) => setFormat(v as OutputFormat) }
            options={ OUTPUT_FORMATS.map((v) => ({
              value: v,
              label: v,
              disabled: v === 'WebP' && !supportsWebp(),
            })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('PNG 无损且保留透明; JPEG / WebP 体积更小, 质量可调') }</Text>
          { supportsWebp()
            ? null
            : <Text type="secondary" style={ { fontSize: 12 } }>{ t('当前环境不支持 WebP 导出') }</Text> }
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('输出质量') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ QUALITY_MIN }
            max={ QUALITY_MAX }
            step={ 0.01 }
            value={ quality }
            disabled={ !isLossy(format) }
            marks={ { [QUALITY_MIN]: String(QUALITY_MIN), [QUALITY_MAX]: String(QUALITY_MAX) } }
            onChange={ setQuality }
          />
          <InputNumber
            min={ QUALITY_MIN }
            max={ QUALITY_MAX }
            step={ 0.01 }
            value={ quality }
            disabled={ !isLossy(format) }
            onChange={ (v) => setQuality(Number(v ?? QUALITY_DEFAULT)) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('仅 JPEG / WebP 输出时生效') }</Text>
        </div>
      </div>

      <Divider>{ t('图片黑白化说明') }</Divider>
      <ImageGrayscaleIntro />
    </>
  );
};

export default ImageGrayscale;
