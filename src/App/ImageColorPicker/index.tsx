// 图片取色: 悬停放大镜 + 点击取色 (hex / rgb / hsl 复制)
import { Alert, Button, Divider, Segmented, Space, Tag, Tooltip, Typography, Upload, message, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { ClearOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { cp, cpT } from './lang';
import { LOUPE_SPAN, RECENT_MAX, ZOOM_DEFAULT, ZOOM_OPTIONS } from './data';
import {
  colorAt, cropPixels, formatHsl, formatRgb, loupeRegion, pushRecent, rgbToHex, toImagePoint,
  type Point, type Rgb,
} from './lib';
import {
  CANVAS_MAX, ImageError, formatBytes, get2d, loadImageFile, readPixels,
  type ImageFile, type Size,
} from '../../lib/image';
import ImageColorPickerIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const ImageColorPicker = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cp(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => cpT(locale, zh, v);
  const { token } = theme.useToken();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeRef = useRef<HTMLCanvasElement | null>(null);
  const [ file, setFile ] = useState<ImageFile | null>(null); // 已解码的原图
  const [ pixels, setPixels ] = useState<{ data: Uint8ClampedArray; size: Size } | null>(null); // 缓存的整图像素
  const [ hover, setHover ] = useState<Point | null>(null); // 悬停像素坐标
  const [ current, setCurrent ] = useState<string>(''); // 当前选中的颜色 (#rrggbb)
  const [ recent, setRecent ] = useState<string[]>([]); // 最近取色
  const [ zoom, setZoom ] = useState<number>(ZOOM_DEFAULT);
  const [ err, setErr ] = useState('');

  /** 读取文件 -> 解码图片 */
  const onFile = (f: File) => {
    loadImageFile(f)
      .then((loaded) => {
        setFile(loaded);
        setPixels(null);
        setHover(null);
        setErr('');
      })
      .catch((e) => {
        setFile(null);
        setPixels(null);
        const code = e instanceof ImageError ? e.code : 'decode-failed';
        setErr(code === 'not-image'
          ? t('请选择图片文件')
          : code === 'read-failed' ? t('图片读取失败') : t('图片解析失败'));
      });
  };

  // 载入图片后画到画布 (原始尺寸) 并缓存像素, 供取色与放大镜使用
  useEffect(() => {
    const f = file;
    const canvas = canvasRef.current;
    if (!f || !canvas) return;
    const size = f.size;
    if (size.width > CANVAS_MAX || size.height > CANVAS_MAX) {
      setPixels(null);
      setErr(tT('图片尺寸过大, 单边不能超过 {n} px', { n: CANVAS_MAX }));
      return;
    }
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = get2d(canvas);
    if (!ctx) {
      setPixels(null);
      setErr(t('当前环境不支持 Canvas, 无法取色'));
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(f.img, 0, 0, size.width, size.height);
    const data = readPixels(canvas);
    if (!data) {
      setPixels(null);
      setErr(t('当前环境不支持 Canvas, 无法取色'));
      return;
    }
    setPixels({ data: data.data, size });
    setErr('');
  }, [ file ]); // eslint-disable-line react-hooks/exhaustive-deps

  const hoverColor: Rgb | null = hover && pixels ? colorAt(pixels.data, pixels.size, hover.x, hover.y) : null;

  // 悬停位置 / 放大倍数变化时重绘放大镜 (中心像素加红框)
  useEffect(() => {
    const canvas = loupeRef.current;
    if (!canvas || !hover || !pixels) return;
    const ctx = get2d(canvas);
    if (!ctx) return;
    const region = loupeRegion(pixels.size, hover.x, hover.y, LOUPE_SPAN);
    canvas.width = region.w;
    canvas.height = region.h;
    if (typeof ctx.createImageData !== 'function') return;
    const image = ctx.createImageData(region.w, region.h);
    image.data.set(cropPixels(pixels.data, pixels.size, region));
    ctx.putImageData(image, 0, 0);
    // 标出正在取色的那一个像素
    ctx.strokeStyle = '#ff4d4f';
    ctx.lineWidth = 1;
    try {
      ctx.strokeRect(hover.x - region.x + 0.5, hover.y - region.y + 0.5, 0, 0);
    } catch {
      /* 极少数环境的 strokeRect 不支持 0 边长, 忽略即可 */
    }
  }, [ hover, pixels ]);

  /** 鼠标位置 -> 图片像素坐标 */
  const pointOf = (e: { clientX: number; clientY: number }): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas || !pixels) return null;
    return toImagePoint(canvas.getBoundingClientRect(), pixels.size, e.clientX, e.clientY);
  };

  /** 取色: 点击画布 */
  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = pointOf(e);
    if (!p || !pixels) return;
    const c = colorAt(pixels.data, pixels.size, p.x, p.y);
    if (!c) return;
    const hex = rgbToHex(c);
    setCurrent(hex);
    setRecent((prev) => pushRecent(prev, hex, RECENT_MAX));
    copy(hex);
  };

  /** 复制到剪贴板 (桌面端 WebView 可能没有权限, 失败静默忽略) */
  const copy = (text: string) => {
    try {
      const r = navigator?.clipboard?.writeText?.(text);
      if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  };

  const onClear = () => {
    setFile(null);
    setPixels(null);
    setHover(null);
    setErr('');
  };

  const onClearRecent = () => setRecent([]);

  const fmtSize = (s: Size) => tT('{a} × {b} px', { a: s.width, b: s.height });

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0, fontFamily: MONO } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6 } }>{ value }</span>
    </Tag>
  );

  /** 一行「写法 + 复制」 */
  const valueRow = (label: string, value: string) => (
    <div style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
      <Text type="secondary" style={ { fontSize: 12, width: 40, flex: '0 0 auto' } }>{ label }</Text>
      { value
        ? <Text code copyable={ { text: value, onCopy: () => message.success(tT('已复制 {v}', { v: value })) } } style={ { fontFamily: MONO } }>{ value }</Text>
        : <Text type="secondary" style={ { fontFamily: MONO } }>—</Text> }
    </div>
  );

  return (
    <>
      {/* 顶部操作栏 */}
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 } }>
        <Space wrap>
          <Upload accept="image/*" showUploadList={ false } beforeUpload={ (f) => { onFile(f as File); return false; } }>
            <Button size="small" icon={ <UploadOutlined /> }>{ file ? t('重新选择') : t('选择图片') }</Button>
          </Upload>
          <Button size="small" onClick={ onClearRecent } disabled={ recent.length === 0 }>{ t('清空历史') }</Button>
          <Button size="small" icon={ <ClearOutlined /> } onClick={ onClear } disabled={ !file }>{ t('清空') }</Button>
        </Space>
        { file
          ? (
            <Space wrap>
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('放大倍数') }</Text>
              <Segmented
                size="small"
                value={ zoom }
                onChange={ (v) => setZoom(Number(v)) }
                options={ ZOOM_OPTIONS.map((z) => ({ value: z, label: `${z}×` })) }
              />
            </Space>
          )
          : null }
      </div>

      { err ? <Alert type="error" showIcon style={ { marginBottom: 8 } } message={ err } /> : null }

      {/* 选择 / 取色 */}
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
          {/* 图片本体: 原尺寸, 超宽时出现滚动条, 保证坐标与像素一一对应 */}
          <div
            style={ {
              flex: '1 1 320px',
              minWidth: 260,
              maxHeight: 420,
              overflow: 'auto',
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              background: token.colorFillQuaternary,
            } }
          >
            <canvas
              ref={ canvasRef }
              onMouseMove={ (e) => setHover(pointOf(e)) }
              onMouseLeave={ () => setHover(null) }
              onClick={ pick }
              style={ { display: 'block', maxWidth: '100%', cursor: 'crosshair' } }
            />
          </div>

          {/* 取色面板 */}
          <div style={ { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280, maxWidth: 360 } }>
            <div style={ { display: 'flex', gap: 12, alignItems: 'flex-start' } }>
              <div style={ { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' } }>
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('悬停预览') }</Text>
                <canvas
                  ref={ loupeRef }
                  width={ LOUPE_SPAN }
                  height={ LOUPE_SPAN }
                  style={ {
                    width: LOUPE_SPAN * zoom,
                    height: LOUPE_SPAN * zoom,
                    imageRendering: 'pixelated',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusSM,
                    background: token.colorFillQuaternary,
                  } }
                />
              </div>
              <div style={ { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 } }>
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('坐标') }</Text>
                <Text style={ { fontFamily: MONO } }>
                  { hover ? `x ${hover.x}, y ${hover.y}` : '—' }
                </Text>
                <div style={ { display: 'flex', alignItems: 'center', gap: 6 } }>
                  <span
                    style={ {
                      width: 16,
                      height: 16,
                      flex: '0 0 auto',
                      borderRadius: 3,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: hoverColor ? rgbToHex(hoverColor) : 'transparent',
                    } }
                  />
                  <Text style={ { fontFamily: MONO } }>{ hoverColor ? rgbToHex(hoverColor) : '—' }</Text>
                </div>
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('把鼠标移到图片上查看放大镜与像素坐标, 点击即可取色') }</Text>
              </div>
            </div>

            <div style={ { display: 'flex', gap: 8, flexWrap: 'wrap' } }>
              { statTag(t('图像尺寸'), fmtSize(file.size)) }
              { statTag(t('图像体积'), formatBytes(file.bytes)) }
            </div>

            {/* 当前颜色 */}
            <div
              style={ {
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              } }
            >
              <div style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
                <Text strong>{ t('当前颜色') }</Text>
                <span
                  style={ {
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: current || 'transparent',
                  } }
                />
                { current ? null : <Text type="secondary" style={ { fontSize: 12 } }>{ t('点击图片上的任意位置取色') }</Text> }
              </div>
              { valueRow('HEX', current ? current.toUpperCase() : '') }
              { valueRow('RGB', current ? formatRgb(parseHex(current)) : '') }
              { valueRow('HSL', current ? formatHsl(parseHex(current)) : '') }
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('点击右侧图标可复制对应写法') }</Text>
            </div>

            {/* 最近取色 */}
            <div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
              <Text strong>{ t('最近取色') }</Text>
              <div style={ { display: 'flex', gap: 6, flexWrap: 'wrap' } }>
                { recent.length === 0
                  ? <Text type="secondary" style={ { fontSize: 12 } }>{ t('无色块') }</Text>
                  : recent.map((hex) => (
                    <Tooltip key={ hex } title={ hex }>
                      <span
                        title={ hex }
                        onClick={ () => { setCurrent(hex); copy(hex); } }
                        style={ {
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          cursor: 'pointer',
                          border: hex === current ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
                          background: hex,
                        } }
                      />
                    </Tooltip>
                  )) }
              </div>
              <Text type="secondary" style={ { fontSize: 12 } }>{ tT('点击色块可再次选色, 最多保留 {n} 条', { n: RECENT_MAX }) }</Text>
            </div>
          </div>
        </div>
      ) }

      <Divider>{ t('图片取色说明') }</Divider>
      <ImageColorPickerIntro />
    </>
  );
};

/** #rrggbb -> RGB 分量 (非法值按黑色处理) */
const parseHex = (hex: string): Rgb => {
  const v = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!v) return { r: 0, g: 0, b: 0, a: 255 };
  const n = parseInt(v[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 };
};

export default ImageColorPicker;
