// 图片负片: 把图片 RGB 通道反相 (α 通道保留), 强度可调
import { Alert, Button, Divider, InputNumber, Segmented, Slider, Space, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useState } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { nv, nvT } from './lang';
import { FILE_SUFFIX, PREVIEW_MAX_H, PREVIEW_MAX_W, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN, STRENGTH_DEFAULT, STRENGTH_MAX, STRENGTH_MIN } from './data';
import { invertPixels, normalizeStrength } from './lib';
import {
  CANVAS_MAX, ImageError, OUTPUT_FORMATS, extOf, filterImage, formatBytes, isLossy, loadImageFile, saveDataUrl,
  supportsWebp,
  type ImageFile, type OutputFormat, type Size,
} from '../../lib/image';
import ImageNegativeIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const ImageNegative = () => {
  const { locale } = useLocale();
  const t = (zh: string) => nv(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => nvT(locale, zh, v);
  const { token } = theme.useToken();

  const [ file, setFile ] = useState<ImageFile | null>(null); // 已解码的原图
  const [ strength, setStrength ] = useState<number>(STRENGTH_DEFAULT); // 负片强度 (%)
  const [ format, setFormat ] = useState<OutputFormat>('PNG'); // 输出格式
  const [ quality, setQuality ] = useState<number>(QUALITY_DEFAULT); // JPEG / WebP 质量
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

  /** 反相: 画布 -> 取像素 -> invertPixels -> 写回 -> dataURL */
  const process = () => {
    const f = file;
    if (!f) return;
    const size: Size = f.size;
    if (size.width > CANVAS_MAX || size.height > CANVAS_MAX) {
      setResult(null);
      setErr(tT('图片尺寸过大, 单边不能超过 {n} px', { n: CANVAS_MAX }));
      return;
    }
    const out = filterImage(f.img, size, {
      format,
      quality,
      transform: (data) => invertPixels(data, strength),
    });
    if (!out) {
      setResult(null);
      setErr(t('当前环境不支持 Canvas, 无法处理图片'));
      return;
    }
    setResult(out);
    setErr('');
  };

  // 图片或参数变化后重新处理 (先渲染再计算, 避免界面没有反馈)
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
  }, [ file, strength, format, quality ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    setFile(null);
    setResult(null);
    setErr('');
  };

  /** 保存结果 (PNG 走图片保存, JPEG / WebP 走字节保存) */
  const onSave = async () => {
    if (!result || !file || saving) return;
    setSaving(true);
    const name = `${file.base}_${FILE_SUFFIX}.${extOf(format)}`;
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
              ? preview(result.url)
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
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('负片强度') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ STRENGTH_MIN }
            max={ STRENGTH_MAX }
            step={ 1 }
            value={ strength }
            disabled={ !file }
            marks={ { [STRENGTH_MIN]: '0%', 50: '50%', [STRENGTH_MAX]: '100%' } }
            onChange={ setStrength }
          />
          <InputNumber
            min={ STRENGTH_MIN }
            max={ STRENGTH_MAX }
            step={ 1 }
            addonAfter="%"
            value={ strength }
            disabled={ !file }
            onChange={ (v) => setStrength(normalizeStrength(v)) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('0% 保留原图, 100% 完全反相 (黑变白 / 白变黑); 中间值相当于按该比例把负片叠在原图上') }</Text>
        </div>

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

        <Text type="secondary" style={ { fontSize: 12 } }>{ t('只有 RGBA 颜色通道会被反相, α (透明度) 通道保持不变') }</Text>
      </div>

      <Divider>{ t('图片负片说明') }</Divider>
      <ImageNegativeIntro />
    </>
  );
};

export default ImageNegative;
