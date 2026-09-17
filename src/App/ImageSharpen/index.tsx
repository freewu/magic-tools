// 图片锐化: USM 钝化蒙版 (原图 + 强度 × (原图 − 模糊图))
import { Alert, Button, Divider, InputNumber, Segmented, Slider, Space, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useState } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { sh, shT } from './lang';
import {
  AMOUNT_DEFAULT, AMOUNT_MAX, AMOUNT_MIN, FILE_SUFFIX, PREVIEW_MAX_H, PREVIEW_MAX_W, QUALITY_DEFAULT, QUALITY_MAX,
  QUALITY_MIN, RADIUS_DEFAULT, RADIUS_MAX, RADIUS_MIN, THRESHOLD_DEFAULT, THRESHOLD_MAX, THRESHOLD_MIN,
} from './data';
import { normalizeAmount, normalizeRadius, normalizeThreshold, unsharpMask } from './lib';
import {
  CANVAS_MAX, ImageError, OUTPUT_FORMATS, extOf, filterImage, formatBytes, isLossy, loadImageFile, saveDataUrl,
  supportsWebp,
  type ImageFile, type OutputFormat, type Size,
} from '../../lib/image';
import ImageSharpenIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const ImageSharpen = () => {
  const { locale } = useLocale();
  const t = (zh: string) => sh(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => shT(locale, zh, v);
  const { token } = theme.useToken();

  const [ file, setFile ] = useState<ImageFile | null>(null); // 已解码的原图
  const [ amount, setAmount ] = useState<number>(AMOUNT_DEFAULT); // 强度 (%)
  const [ radius, setRadius ] = useState<number>(RADIUS_DEFAULT); // 半径 (px)
  const [ threshold, setThreshold ] = useState<number>(THRESHOLD_DEFAULT); // 阈值 (0~255)
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

  /** USM 锐化 */
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
      transform: (data) => unsharpMask(data, size.width, size.height, { amount, radius, threshold }),
    });
    if (!out) {
      setResult(null);
      setErr(t('当前环境不支持 Canvas, 无法处理图片'));
      return;
    }
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
  }, [ file, amount, radius, threshold, format, quality ]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const preview = (url: string) => (
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
            { statTag(t('锐化参数'), `${normalizeAmount(amount)}% · r${normalizeRadius(radius)} · t${normalizeThreshold(threshold)}`) }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('调整参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('锐化强度') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ AMOUNT_MIN }
            max={ AMOUNT_MAX }
            step={ 5 }
            value={ amount }
            disabled={ !file }
            marks={ { 0: '0%', 100: '100%', 300: '300%' } }
            onChange={ setAmount }
          />
          <InputNumber
            min={ AMOUNT_MIN }
            max={ AMOUNT_MAX }
            step={ 5 }
            addonAfter="%"
            value={ amount }
            disabled={ !file }
            onChange={ (v) => setAmount(normalizeAmount(v)) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('强度越高边缘越"硬", 但过冲也越明显 (100% 为标准叠加量)') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('半径') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ RADIUS_MIN }
            max={ RADIUS_MAX }
            step={ 1 }
            value={ radius }
            disabled={ !file }
            marks={ { 1: '1px', 3: '3px', 5: '5px' } }
            onChange={ setRadius }
          />
          <InputNumber
            min={ RADIUS_MIN }
            max={ RADIUS_MAX }
            step={ 1 }
            addonAfter="px"
            value={ radius }
            disabled={ !file }
            onChange={ (v) => setRadius(normalizeRadius(v)) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('参与模糊的邻域半径: 1 px 只锐化细小的纹理, 5 px 会强化更大的轮廓') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('阈值') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ THRESHOLD_MIN }
            max={ THRESHOLD_MAX }
            step={ 1 }
            value={ threshold }
            disabled={ !file }
            marks={ { 0: '0', 128: '128', 255: '255' } }
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
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('细节差值小于阈值的像素不锐化, 用来避免放大平坦区域的噪点 (0 表示全部参与)') }</Text>
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

        <Text type="secondary" style={ { fontSize: 12 } }>{ t('α (透明度) 通道始终保持不变; 输出 JPEG / WebP 时会先铺白底') }</Text>
      </div>

      <Divider>{ t('图片锐化说明') }</Divider>
      <ImageSharpenIntro />
    </>
  );
};

export default ImageSharpen;
