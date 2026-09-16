// 图片水印: 给图片叠加文字或图片 (logo) 水印
// 支持九宫格定位 (单个) / 整图平铺, 旋转角度, 透明度, 描边, 自动缩小, PNG·JPEG·WebP 输出
import { Alert, Button, ColorPicker, Divider, Input, Segmented, Slider, Space, Switch, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { saveBytesFile, savePngFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { iw, iwT } from './lang';
import {
  CANVAS_MAX, COLOR_DEFAULT, FONT_SCALE_DEFAULT, FONT_SCALE_MAX, FONT_SCALE_MIN, GAP_DEFAULT, GAP_MAX, GAP_MIN,
  LOGO_SCALE_DEFAULT, LOGO_SCALE_MAX, LOGO_SCALE_MIN, MARGIN_DEFAULT, MARGIN_MAX, OPACITY_DEFAULT, OPACITY_MAX,
  OPACITY_MIN, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN, ROTATE_DEFAULT, ROTATE_MAX, ROTATE_MIN, ROTATE_STEP,
  TEXT_PRESETS, TEXT_SAMPLE, TILE_ROTATE_DEFAULT,
} from './data';
import {
  FONT_KEYS, LAYOUT_MODES, OUTPUT_FORMATS, POSITIONS, WATERMARK_KINDS, baseName, buildPlan, dataUrlToBytes, drawPlan,
  formatBytes, isLossy, mimeOf, outputFileName, supportsWebp,
  type FontKey, type LayoutMode, type OutputFormat, type Size, type WatermarkKind, type WatermarkPosition,
} from './lib';
import ImageWatermarkIntro from './intro';

const { Text } = Typography;
const { TextArea } = Input;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 水印结果 */
interface MarkResult { url: string; bytes: number; width: number; height: number; }

/** 九宫格按钮上的方位符号 (与 POSITIONS 顺序一一对应) */
const ARROWS = [ '↖', '↑', '↗', '←', '●', '→', '↙', '↓', '↘' ];
/** 九宫格方位词条 key (zh 原文, 交给语言包翻译) */
const POS_LABEL: Record<WatermarkPosition, string> = {
  tl: '左上', tc: '上', tr: '右上', ml: '左', mc: '正中', mr: '右', bl: '左下', bc: '下', br: '右下',
};
/** 字体选项文案 */
const FONT_LABEL: Record<FontKey, string> = { sans: '默认', serif: '衬线', mono: '等宽', kai: '楷体' };

const ImageWatermark = () => {
  const { locale } = useLocale();
  const t = (zh: string) => iw(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => iwT(locale, zh, v);
  const { token } = theme.useToken();

  const imgRef = useRef<HTMLImageElement | null>(null); // 已解码的原图
  const logoRef = useRef<HTMLImageElement | null>(null); // 已解码的水印图片
  const [ src, setSrc ] = useState(''); // 原图 dataURL (预览)
  const [ orig, setOrig ] = useState<Size>({ width: 0, height: 0 }); // 原图尺寸
  const [ fileBytes, setFileBytes ] = useState(0); // 原图字节数
  const [ base, setBase ] = useState('image'); // 文件名主体

  // 水印参数
  const [ kind, setKind ] = useState<WatermarkKind>('text'); // 水印类型
  const [ text, setText ] = useState(''); // 文字内容
  const [ font, setFont ] = useState<FontKey>('sans'); // 字体
  const [ fontScale, setFontScale ] = useState(FONT_SCALE_DEFAULT); // 字号 (占图片宽度 %)
  const [ bold, setBold ] = useState(false); // 加粗
  const [ italic, setItalic ] = useState(false); // 斜体
  const [ color, setColor ] = useState(COLOR_DEFAULT); // 文字颜色
  const [ stroke, setStroke ] = useState(true); // 描边
  const [ fit, setFit ] = useState(true); // 自动缩小以适应宽度
  const [ logoSrc, setLogoSrc ] = useState(''); // 水印图片 dataURL
  const [ logoSize, setLogoSize ] = useState<Size>({ width: 0, height: 0 }); // 水印图片原始尺寸
  const [ logoScale, setLogoScale ] = useState(LOGO_SCALE_DEFAULT); // 水印图片宽度 (占图片宽度 %)
  const [ layout, setLayout ] = useState<LayoutMode>('single'); // 排布方式
  const [ position, setPosition ] = useState<WatermarkPosition>('br'); // 九宫格位置
  const [ margin, setMargin ] = useState(MARGIN_DEFAULT); // 边距
  const [ gap, setGap ] = useState(GAP_DEFAULT); // 平铺间距
  const [ rotate, setRotate ] = useState(ROTATE_DEFAULT); // 旋转角度
  const [ opacity, setOpacity ] = useState(OPACITY_DEFAULT); // 透明度

  // 输出参数
  const [ webpOk ] = useState(() => supportsWebp());
  const [ format, setFormat ] = useState<OutputFormat>('PNG');
  const [ quality, setQuality ] = useState(QUALITY_DEFAULT);

  const [ result, setResult ] = useState<MarkResult | null>(null);
  const [ busy, setBusy ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ err, setErr ] = useState('');

  /** 读取原图 (记下文件名与原始字节数) */
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
        setOrig({ width: img.naturalWidth, height: img.naturalHeight });
        setFileBytes(file.size);
        setBase(baseName(file.name));
        setErr('');
        setSrc(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    return false;
  };

  /** 读取水印图片 (logo) */
  const onLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) { message.error(t('请选择图片文件')); return false; }
    const reader = new FileReader();
    reader.onerror = () => setErr(t('图片读取失败'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const img = new Image();
      img.onerror = () => setErr(t('水印图片解析失败'));
      img.onload = () => {
        logoRef.current = img;
        setLogoSize({ width: img.naturalWidth, height: img.naturalHeight });
        setLogoSrc(dataUrl);
        setErr('');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    return false;
  };

  /** 在原图上绘制水印 -> dataURL */
  const mark = () => {
    const img = imgRef.current;
    if (!img) return;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (width < 1 || height < 1) { setResult(null); setErr(t('图片解析失败')); return; }
    if (width > CANVAS_MAX || height > CANVAS_MAX) {
      setResult(null);
      setErr(tT('图片过大, 单边不能超过 {n} px', { n: CANVAS_MAX }));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setResult(null); setErr(t('当前环境不支持 Canvas, 无法添加水印')); return; }

    // JPEG / WebP 无透明通道, 先铺白底避免透明区域变黑
    if (isLossy(format)) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0);

    const plan = buildPlan({ width, height }, {
      kind, text, font, fontScale, bold, italic, color, stroke, fit,
      logoSize, logoScale, layout, position, margin, gap, rotate, opacity,
      measure: (line, fontText) => { ctx.font = fontText; return ctx.measureText(line).width; },
    });
    drawPlan(ctx, plan, { logo: logoRef.current ?? undefined });

    const url = isLossy(format) ? canvas.toDataURL(mimeOf(format), quality) : canvas.toDataURL(mimeOf(format));
    setResult({
      url,
      // base64 长度 -> 大致字节数 (4 字符表示 3 字节)
      bytes: Math.round((url.length - url.indexOf(',') - 1) * 0.75),
      width,
      height,
    });
    setErr('');
  };

  // 原图或参数变化后重绘 (先渲染再计算, 避免界面卡住没有反馈)
  useEffect(() => {
    if (!src) return;
    setBusy(true);
    const timer = window.setTimeout(() => {
      try {
        mark();
      } catch (e) {
        setResult(null);
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ src, kind, text, font, fontScale, bold, italic, color, stroke, fit, logoSize, logoScale, layout, position, margin, gap, rotate, opacity, format, quality ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    imgRef.current = null;
    setSrc('');
    setOrig({ width: 0, height: 0 });
    setFileBytes(0);
    setResult(null);
    setErr('');
  };

  /** 切换排布方式: 进入平铺时给一个斜向默认角, 回到单个时复位 */
  const onLayoutChange = (v: LayoutMode) => {
    setLayout(v);
    if (v === 'tile' && rotate === 0) setRotate(TILE_ROTATE_DEFAULT);
    if (v === 'single' && rotate === TILE_ROTATE_DEFAULT) setRotate(ROTATE_DEFAULT);
  };

  /** 保存结果 (PNG 走图片保存, JPEG / WebP 走字节保存) */
  const onSave = async () => {
    if (!result || saving) return;
    setSaving(true);
    const name = outputFileName(base, format);
    try {
      const ok = format === 'PNG'
        ? await savePngFile(name, result.url)
        : await saveBytesFile(name, dataUrlToBytes(result.url), {
          title: t('保存'),
          filterName: format === 'WebP' ? 'WebP' : 'JPEG',
          extensions: format === 'WebP' ? [ 'webp' ] : [ 'jpg', 'jpeg' ],
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

  /** 参数行: 固定宽度标签 + 内容 (与「图片调整」保持一致的排版) */
  const row = (label: string, children: React.ReactNode, hint?: string) => (
    <div style={ { display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' } }>
      <Text style={ { width: 96, flex: '0 0 auto', paddingTop: 6 } }>{ label }</Text>
      <div style={ { flex: 1, minWidth: 0 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>{ children }</div>
        { hint ? <Text type="secondary" style={ { fontSize: 12 } }>{ hint }</Text> : null }
      </div>
    </div>
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
            { statTag(t('原图体积'), fileBytes > 0 ? formatBytes(fileBytes) : '—') }
            { statTag(t('结果体积'), result ? formatBytes(result.bytes) : '—') }
            { statTag(t('输出格式'), isLossy(format) ? `${format} · ${quality}` : 'PNG') }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('水印参数') }</Divider>
      <Text type="secondary" style={ { fontSize: 12, display: 'block', marginBottom: 8 } }>
        { t('参数改动会实时重绘, 预览即最终效果') }
      </Text>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 } }>
        { row(t('水印类型'), (
          <Segmented
            value={ kind }
            onChange={ (v) => setKind(v as WatermarkKind) }
            options={ WATERMARK_KINDS.map((k) => ({ value: k, label: t(k === 'text' ? '文字水印' : '图片水印') })) }
          />
        )) }

        { kind === 'text' ? (
          <>
            { row(t('文字内容'), (
              <TextArea
                value={ text }
                onChange={ (e) => setText(e.target.value) }
                placeholder={ t('输入水印文字, 支持多行 (回车换行)') }
                autoSize={ { minRows: 1, maxRows: 4 } }
                style={ { maxWidth: 420 } }
              />
            )) }
            { row(t('快捷预设'), (
              <>
                { TEXT_PRESETS.map((p) => (
                  <Tag
                    key={ p }
                    color={ text === p ? 'blue' : undefined }
                    style={ { cursor: 'pointer', marginInlineEnd: 0 } }
                    onClick={ () => setText(p) }
                  >
                    { p }
                  </Tag>
                )) }
                <Button size="small" onClick={ () => setText(TEXT_SAMPLE) }>{ t('载入示例文字') }</Button>
              </>
            )) }
            { row(t('字体'), (
              <Segmented
                value={ font }
                onChange={ (v) => setFont(v as FontKey) }
                options={ FONT_KEYS.map((f) => ({ value: f, label: t(FONT_LABEL[f]) })) }
              />
            )) }
            { row(t('字号'), (
              <>
                <Slider
                  style={ { flex: 1, minWidth: 160, maxWidth: 300 } }
                  min={ FONT_SCALE_MIN }
                  max={ FONT_SCALE_MAX }
                  step={ 0.5 }
                  value={ fontScale }
                  onChange={ setFontScale }
                  tooltip={ { formatter: (v) => `${v}%` } }
                />
                <Text type="secondary" style={ { fontSize: 12, fontFamily: MONO } }>
                  { `${fontScale}%${orig.width > 0 ? ` ≈ ${Math.round(orig.width * fontScale / 100)} px` : ''}` }
                </Text>
              </>
            ), t('占图片宽度的百分比')) }
            { row(t('颜色'), (
              <>
                <ColorPicker
                  size="small"
                  value={ color }
                  onChange={ (c) => setColor(c.toHexString().slice(0, 7)) }
                />
                <Text style={ { fontFamily: MONO, fontSize: 12 } }>{ color }</Text>
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('加粗') }</Text>
                <Switch size="small" checked={ bold } onChange={ setBold } />
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('斜体') }</Text>
                <Switch size="small" checked={ italic } onChange={ setItalic } />
              </>
            )) }
            { row(t('描边'), (
              <>
                <Switch size="small" checked={ stroke } onChange={ setStroke } />
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('描边颜色随文字颜色自动配对 (亮字黑边 / 暗字白边), 提升复杂背景上的可读性') }</Text>
              </>
            )) }
            { row(t('自动缩小以适应宽度'), (
              <>
                <Switch size="small" checked={ fit } onChange={ setFit } />
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('文字过长时自动缩小字号, 保证不超出左右边距') }</Text>
              </>
            )) }
          </>
        ) : (
          <>
            { row(t('水印图片'), (
              <>
                <Upload accept="image/*" showUploadList={ false } beforeUpload={ (f) => { onLogoFile(f as File); return false; } }>
                  <Button size="small" icon={ <UploadOutlined /> }>
                    { logoSrc ? t('重新选择') : t('选择水印图片') }
                  </Button>
                </Upload>
                { logoSrc
                  ? <img src={ logoSrc } alt="" style={ { maxHeight: 40, maxWidth: 140, objectFit: 'contain', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, background: token.colorFillQuaternary } } />
                  : <Text type="secondary" style={ { fontSize: 12 } }>{ t('未选择水印图片, 结果将不会变化') }</Text> }
              </>
            ), t('建议使用透明背景的 PNG, 叠加效果最干净 (JPG 会带上白底)')) }
            { row(t('缩放'), (
              <>
                <Slider
                  style={ { flex: 1, minWidth: 160, maxWidth: 300 } }
                  min={ LOGO_SCALE_MIN }
                  max={ LOGO_SCALE_MAX }
                  step={ 1 }
                  value={ logoScale }
                  onChange={ setLogoScale }
                  tooltip={ { formatter: (v) => `${v}%` } }
                />
                <Text type="secondary" style={ { fontSize: 12, fontFamily: MONO } }>
                  { `${logoScale}%${orig.width > 0 ? ` ≈ ${Math.round(orig.width * logoScale / 100)} px` : ''}` }
                </Text>
              </>
            ), t('占图片宽度的百分比')) }
          </>
        ) }

        { row(t('排布方式'), (
          <>
            <Segmented
              value={ layout }
              onChange={ (v) => onLayoutChange(v as LayoutMode) }
              options={ LAYOUT_MODES.map((m) => ({ value: m, label: t(m === 'single' ? '单个' : '平铺') })) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { layout === 'tile' ? t('平铺模式下「位置」与「边距」不生效, 整体观感由间距与旋转角度决定') : ' ' }
            </Text>
          </>
        )) }

        { layout === 'single' ? row(t('位置'), (
          <>
            <div style={ { display: 'grid', gridTemplateColumns: 'repeat(3, 30px)', gap: 4 } }>
              { POSITIONS.map((p, i) => (
                <Button
                  key={ p }
                  size="small"
                  type={ position === p ? 'primary' : 'default' }
                  title={ t(POS_LABEL[p]) }
                  aria-label={ t(POS_LABEL[p]) }
                  onClick={ () => setPosition(p) }
                  style={ { width: 30, height: 26, padding: 0, fontSize: 13, lineHeight: '24px' } }
                >
                  { ARROWS[i] }
                </Button>
              )) }
            </div>
            <Slider
              style={ { flex: 1, minWidth: 160, maxWidth: 300 } }
              min={ 0 }
              max={ MARGIN_MAX }
              step={ 1 }
              value={ margin }
              onChange={ setMargin }
              tooltip={ { formatter: (v) => `${v} px` } }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { `${t('边距')} ${margin} px${orig.width > 0 ? ` (${(margin / Math.min(orig.width, orig.height) * 100).toFixed(1)}%)` : ''}` }
            </Text>
          </>
        ), t('水印尺寸与边距都按旋转后的外接矩形计算, 因此旋转后依然不会越界')) : row(t('平铺间距'), (
          <>
            <Slider
              style={ { flex: 1, minWidth: 160, maxWidth: 300 } }
              min={ GAP_MIN }
              max={ GAP_MAX }
              step={ 1 }
              value={ gap }
              onChange={ setGap }
              tooltip={ { formatter: (v) => `${v} px` } }
            />
            <Text type="secondary" style={ { fontSize: 12, fontFamily: MONO } }>{ `${gap} px` }</Text>
          </>
        )) }

        { row(t('旋转角度'), (
          <>
            <Slider
              style={ { flex: 1, minWidth: 160, maxWidth: 300 } }
              min={ ROTATE_MIN }
              max={ ROTATE_MAX }
              step={ ROTATE_STEP }
              value={ rotate }
              onChange={ setRotate }
              tooltip={ { formatter: (v) => `${v}°` } }
              marks={ { [ROTATE_MIN]: `${ROTATE_MIN}°`, 0: '0°', [ROTATE_MAX]: `${ROTATE_MAX}°` } }
            />
            <Text type="secondary" style={ { fontSize: 12, fontFamily: MONO } }>{ `${rotate}°` }</Text>
          </>
        ), t('「旋转角度」为顺时针; 斜向平铺常用 -30°')) }

        { row(t('透明度'), (
          <>
            <Slider
              style={ { flex: 1, minWidth: 160, maxWidth: 300 } }
              min={ OPACITY_MIN }
              max={ OPACITY_MAX }
              step={ 0.01 }
              value={ opacity }
              onChange={ setOpacity }
              tooltip={ { formatter: (v) => `${Math.round(Number(v) * 100)}%` } }
            />
            <Text type="secondary" style={ { fontSize: 12, fontFamily: MONO } }>{ `${Math.round(opacity * 100)}%` }</Text>
          </>
        )) }

        { row(t('输出格式'), (
          <>
            <Segmented
              value={ format }
              onChange={ (v) => setFormat(v as OutputFormat) }
              options={ OUTPUT_FORMATS.map((f) => ({ value: f, label: f, disabled: f === 'WebP' && !webpOk })) }
            />
            { isLossy(format) ? (
              <>
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('输出质量') }</Text>
                <Slider
                  style={ { flex: 1, minWidth: 160, maxWidth: 260 } }
                  min={ QUALITY_MIN }
                  max={ QUALITY_MAX }
                  step={ 0.01 }
                  value={ quality }
                  onChange={ setQuality }
                  tooltip={ { formatter: (v) => `${Number(v).toFixed(2)}` } }
                />
              </>
            ) : (
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('PNG 无损且保留透明; JPEG / WebP 体积更小, 质量可调') }</Text>
            ) }
            { !webpOk ? <Text type="secondary" style={ { fontSize: 12 } }>{ t('当前环境不支持 WebP 导出, 该项已禁用') }</Text> : null }
          </>
        )) }
      </div>

      <Divider style={ { margin: '12px 0' } }>{ t('图片水印说明') }</Divider>
      <ImageWatermarkIntro />
    </>
  );
};

export default ImageWatermark;
