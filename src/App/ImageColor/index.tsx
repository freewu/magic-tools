// 图片主题色: 提取图片中的颜色 -> 合并相近色 -> 按占比排序
import { Alert, Button, Checkbox, Divider, InputNumber, Progress, Select, Slider, Space, Tag, Tooltip, Typography, Upload, message, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { CopyOutlined, DownloadOutlined, FileImageOutlined, UploadOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { savePngFile, saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { im, imT } from './lang';
import {
  ALPHA_DEFAULT, ALPHA_MAX, ALPHA_MIN, COLORS_DEFAULT, COLORS_MAX, COLORS_MIN, COLOR_FORMATS,
  LEVEL_DEFAULT, LEVEL_MAX, LEVEL_MIN, MAX_EDGE,
  contrastColor, coverage, extractPalette, fitSize, formatColor, formatRatio, formatRgb, getDefaultFormat,
  paletteToCsv, paletteToText,
  type ColorFormat, type ExtractResult, type PaletteColor,
} from './lib';
import ImageColorIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 色卡 PNG: 每格宽高 */
const CARD_CELL_W = 220;
const CARD_CELL_H = 170;
const CARD_COLS_MAX = 6;

const ImageColor = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => imT(locale, zh, v);
  const { token } = theme.useToken();

  const imgRef = useRef<HTMLImageElement | null>(null); // 已解码的原图 (用于重复分析)
  const [ src, setSrc ] = useState(''); // 图片 dataURL (预览)
  const [ size, setSize ] = useState({ width: 0, height: 0 }); // 原图尺寸
  const [ loading, setLoading ] = useState(false); // 分析中
  const [ err, setErr ] = useState(''); // 错误提示
  const [ result, setResult ] = useState<ExtractResult | null>(null); // 分析结果
  const [ merge, setMerge ] = useState(true); // 是否合并相似颜色
  const [ level, setLevel ] = useState<number>(LEVEL_DEFAULT); // 相似度级别
  const [ maxColors, setMaxColors ] = useState<number>(COLORS_DEFAULT); // 输出颜色数
  const [ ignoreTransparent, setIgnoreTransparent ] = useState(true); // 忽略透明像素
  const [ alphaThreshold, setAlphaThreshold ] = useState<number>(ALPHA_DEFAULT); // 透明度阈值
  const [ format, setFormat ] = useState<ColorFormat>(() => getDefaultFormat()); // 颜色格式 (默认值可在设置中修改)

  /** 读取文件 -> 解码图片 */
  const onFile = (file: File) => {
    if (!file.type.startsWith('image/')) { message.error(t('请选择图片文件')); return false; }
    const reader = new FileReader();
    reader.onerror = () => setErr(t('图片读取失败'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const img = new Image();
      img.onerror = () => { setErr(t('图片解析失败')); setLoading(false); };
      img.onload = () => {
        imgRef.current = img;
        setSize({ width: img.naturalWidth, height: img.naturalHeight });
        setErr('');
        setSrc(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    return false;
  };

  /** 分析当前图片 (参数变化时重新计算) */
  const analyze = () => {
    const img = imgRef.current;
    if (!img) return;
    const target = fitSize(img.naturalWidth, img.naturalHeight, MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setErr(t('当前环境不支持 Canvas, 无法分析图片')); return; }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, target.width, target.height);
    const data = ctx.getImageData(0, 0, target.width, target.height).data;
    setResult(extractPalette(data, { merge, level, maxColors, ignoreTransparent, alphaThreshold }));
    setErr('');
  };

  // 图片或参数变化后重新分析 (先渲染「分析中」再计算, 避免界面卡住没有反馈)
  useEffect(() => {
    if (!src) return;
    setLoading(true);
    const timer = window.setTimeout(() => {
      try {
        analyze();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ src, merge, level, maxColors, ignoreTransparent, alphaThreshold ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    imgRef.current = null;
    setSrc('');
    setSize({ width: 0, height: 0 });
    setResult(null);
    setErr('');
  };

  const onCopyColor = async (c: PaletteColor) => {
    const v = formatColor(c.rgb, format);
    await copyTextToClipboard(v);
    message.success(tT('已复制 {v}', { v: v }));
  };

  const onCopyAll = async () => {
    if (!result || result.palette.length === 0) return;
    await copyTextToClipboard(paletteToText(result.palette, 'detail', format));
    message.success(t('已复制到剪贴板'));
  };

  const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const onDownloadCsv = async () => {
    if (!result || result.palette.length === 0) return;
    const name = `image-colors-${stamp()}.csv`;
    const ok = await saveTextFile(name, paletteToCsv(result.palette), tT('保存 {n}', { n: name }), { filterName: 'CSV', extensions: [ 'csv' ] });
    if (ok) message.success(tT('已保存 {n}', { n: name }));
  };

  /** 生成色卡 PNG (顶部占比条 + 每格一个色块与文案) */
  const onDownloadPng = async () => {
    const palette = result?.palette ?? [];
    if (palette.length === 0) return;
    const cols = Math.min(CARD_COLS_MAX, palette.length);
    const rows = Math.ceil(palette.length / cols);
    const barH = 56;
    const width = cols * CARD_CELL_W;
    const height = barH + rows * CARD_CELL_H;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setErr(t('当前环境不支持 Canvas, 无法分析图片')); return; }
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    // 占比条
    let x = 0;
    palette.forEach((c) => {
      const w = Math.max(1, (c.ratio || 0) * width);
      ctx.fillStyle = c.hex;
      ctx.fillRect(x, 0, w, barH);
      x += w;
    });
    // 色块网格
    palette.forEach((c, i) => {
      const cx = (i % cols) * CARD_CELL_W;
      const cy = barH + Math.floor(i / cols) * CARD_CELL_H;
      const boxH = CARD_CELL_H - 56;
      ctx.fillStyle = c.hex;
      ctx.fillRect(cx, cy, CARD_CELL_W - 1, boxH);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.strokeRect(cx + 0.5, cy + 0.5, CARD_CELL_W - 2, boxH - 1);
      // 色块上的颜色值 (按当前格式)
      ctx.fillStyle = contrastColor(c.rgb);
      ctx.font = '600 16px ' + MONO;
      ctx.textBaseline = 'middle';
      ctx.fillText(formatColor(c.rgb, format), cx + 12, cy + boxH / 2);
      // 下方文案
      ctx.fillStyle = '#333333';
      ctx.font = '13px ' + MONO;
      ctx.fillText(`${c.hex}  ${formatRgb(c.rgb)}`, cx + 12, cy + boxH + 16);
      ctx.fillText(`${formatRatio(c.ratio, 2)}  ·  ${c.count} px`, cx + 12, cy + boxH + 34);
    });
    const name = `image-colors-${stamp()}.png`;
    const ok = await savePngFile(name, canvas.toDataURL('image/png'));
    if (ok) message.success(tT('已保存 {n}', { n: name }));
  };

  const palette = result?.palette ?? [];
  const coverPct = result ? formatRatio(coverage(palette), 2) : '0.00%';
  const scaled = size.width > 0 && size.height > 0
    ? fitSize(size.width, size.height, MAX_EDGE)
    : { width: 0, height: 0, scale: 1 };

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0, fontFamily: MONO } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6 } }>{ value }</span>
    </Tag>
  );

  /** 调色板结果区 */
  const paletteBody = palette.length === 0 ? (
    <Text type="secondary">{ t('图片中没有可统计的像素 (全透明或被透明阈值过滤)') }</Text>
  ) : (
    <div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
      {/* 占比条 (未合并时剩余部分用底色占位) */}
      <div style={ {
        display: 'flex', width: '100%', height: 28, overflow: 'hidden',
        borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}`,
      } }>
        { palette.map((c, i) => (
          <Tooltip key={ c.hex + i } title={ `${c.hex} · ${formatRatio(c.ratio, 2)}` }>
            <div style={ { flexGrow: Math.max(c.count, 1), flexBasis: 0, background: c.hex } } />
          </Tooltip>
        )) }
        { result && coverage(palette) < 0.9995 ? (
          <div style={ {
            flexGrow: Math.max(Math.round((1 - coverage(palette)) * result.total), 1),
            flexBasis: 0,
            background: token.colorFillSecondary,
          } } />
        ) : null }
      </div>

      { !merge ? (
        <Text type="secondary" style={ { fontSize: 12 } }>{ t('未合并相似颜色, 仅列出占比最高的颜色') }</Text>
      ) : null }
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('点击色块可复制对应色值') }</Text>

      {/* 颜色列表 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
        { palette.map((c, i) => (
          <div
            key={ c.hex + i }
            style={ {
              display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px',
              borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}`,
            } }
          >
            <button
              type="button"
              onClick={ () => onCopyColor(c) }
              title={ `${c.hex}  ${formatRgb(c.rgb)}` }
              style={ {
                flex: '0 0 auto', width: 56, height: 36, borderRadius: token.borderRadius,
                border: `1px solid ${token.colorBorderSecondary}`, background: c.hex,
                color: contrastColor(c.rgb), fontFamily: MONO, fontSize: 11, cursor: 'pointer',
              } }
            >
              { format === 'HEX' ? c.hex.replace('#', '') : '' }
            </button>
            <div style={ { flex: '1 1 160px', minWidth: 120 } }>
              <Text style={ { fontFamily: MONO, fontSize: 12 } } ellipsis={ { tooltip: formatColor(c.rgb, format) } }>{ formatColor(c.rgb, format) }</Text>
              <Progress
                percent={ Number((c.ratio * 100).toFixed(2)) }
                size="small"
                strokeColor={ c.hex }
                format={ (p) => `${p}%` }
                style={ { marginBottom: 0 } }
              />
            </div>
            <Text type="secondary" style={ { fontFamily: MONO, fontSize: 12, flex: '0 0 auto' } }>{ c.count } px</Text>
            <Button size="small" type="text" icon={ <CopyOutlined /> } onClick={ () => onCopyColor(c) }>{ t('复制') }</Button>
          </div>
        )) }
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
          <Button size="small" icon={ <CopyOutlined /> } onClick={ onCopyAll } disabled={ palette.length === 0 }>{ t('复制全部') }</Button>
          <Button size="small" icon={ <DownloadOutlined /> } onClick={ onDownloadCsv } disabled={ palette.length === 0 }>{ t('下载 CSV') }</Button>
          <Button size="small" icon={ <FileImageOutlined /> } onClick={ onDownloadPng } disabled={ palette.length === 0 }>{ t('下载色卡 PNG') }</Button>
          <Button size="small" onClick={ onClear } disabled={ !src }>{ t('清空') }</Button>
        </Space>
        { loading ? <Tag color="processing">{ t('正在分析…') }</Tag> : null }
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
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片') }</Text>
        </div>
      ) : (
        <div style={ { display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' } }>
          <img
            src={ src }
            alt=""
            style={ {
              maxWidth: 320,
              maxHeight: 240,
              objectFit: 'contain',
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              background: token.colorFillQuaternary,
            } }
          />
          <div style={ { display: 'flex', gap: 8, flexWrap: 'wrap' } }>
            { statTag(t('图片尺寸'), tT('{a} × {b} px', { a: size.width, b: size.height })) }
            { statTag(t('分析像素'), String(result?.total ?? 0)) }
            { statTag(t('原始颜色'), String(result?.unique ?? 0)) }
            { statTag(t('合并后颜色'), String(result?.palette.length ?? 0)) }
            { statTag(t('覆盖占比'), coverPct) }
            { statTag(t('相似度级别'), String(level)) }
          </div>
        </div>
      ) }

      { src !== '' && scaled.scale < 1 ? (
        <Text type="secondary" style={ { display: 'block', marginTop: 8, fontSize: 12 } }>
          { tT('原图 {w} × {h} px, 已等比缩小到 {aw} × {ah} px 分析 (最长边 {max} px)', {
            w: size.width, h: size.height, aw: scaled.width, ah: scaled.height, max: MAX_EDGE,
          }) }
        </Text>
      ) : null }

      <Divider style={ { margin: '12px 0' } }>{ t('分析参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <Checkbox checked={ merge } onChange={ (e) => setMerge(e.target.checked) }>{ t('合并相似颜色') }</Checkbox>
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('级别越高, 越相近的颜色会被合并') }</Text>
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('相似度级别') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180 } }
            min={ LEVEL_MIN }
            max={ LEVEL_MAX }
            step={ 1 }
            value={ level }
            disabled={ !merge }
            marks={ { [LEVEL_MIN]: String(LEVEL_MIN), [LEVEL_MAX]: String(LEVEL_MAX) } }
            onChange={ setLevel }
          />
          <InputNumber min={ LEVEL_MIN } max={ LEVEL_MAX } value={ level } disabled={ !merge } onChange={ (v) => setLevel(Number(v ?? LEVEL_DEFAULT)) } />
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('输出颜色数') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180 } }
            min={ COLORS_MIN }
            max={ COLORS_MAX }
            step={ 1 }
            value={ maxColors }
            marks={ { [COLORS_MIN]: String(COLORS_MIN), [COLORS_MAX]: String(COLORS_MAX) } }
            onChange={ setMaxColors }
          />
          <InputNumber min={ COLORS_MIN } max={ COLORS_MAX } value={ maxColors } onChange={ (v) => setMaxColors(Number(v ?? COLORS_DEFAULT)) } />
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('颜色格式') }</Text>
          <Select
            style={ { width: 160 } }
            value={ format }
            onChange={ (v: ColorFormat) => setFormat(v) }
            options={ COLOR_FORMATS.map((v) => ({ value: v, label: v })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('工具页可随时切换, 默认值在「设置 → 图片 → 图片主题色」中修改') }</Text>
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Checkbox checked={ ignoreTransparent } onChange={ (e) => setIgnoreTransparent(e.target.checked) }>{ t('忽略透明像素') }</Checkbox>
          <Text style={ { flex: '0 0 auto' } }>{ t('透明阈值 α ≤') }</Text>
          <InputNumber
            min={ ALPHA_MIN }
            max={ ALPHA_MAX }
            value={ alphaThreshold }
            disabled={ !ignoreTransparent }
            onChange={ (v) => setAlphaThreshold(Number(v ?? ALPHA_DEFAULT)) }
          />
        </div>
      </div>

      {/* 结果: 未选择图片时不展示 */}
      { src === '' ? null : (
        <>
          <Divider style={ { margin: '12px 0' } }>
            { t('调色板') }{ palette.length > 0 ? ` · ${tT('共 {n} 种颜色', { n: palette.length })}` : '' }
          </Divider>
          { paletteBody }
        </>
      ) }

      <Divider>{ t('图片主题色说明') }</Divider>
      <ImageColorIntro />
    </>
  );
};

export default ImageColor;
