// 图片分割: 把一张图片按 2/3/4/6/9 份切开, 按编号命名保存到指定目录
import { Alert, Button, Divider, Input, InputNumber, Radio, Segmented, Slider, Space, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { FolderOpenOutlined, UploadOutlined } from '@ant-design/icons';
import { savePngBatch } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { is, isT } from './lang';
import {
  DEFAULT_PREFIX, GAP_DEFAULT, GAP_MAX, GAP_MIN, LAYOUT_LABEL, PART_OPTIONS, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN,
  WIDTH_AUTO, WIDTH_MAX, WIDTH_MIN, type PartCount,
} from './data';
import {
  NUMBER_MODES, OUTPUT_FORMATS,
  findLayout, formatBytes, getDefaultFormat, getDefaultParts, getDefaultQuality,
  layoutKeyForParts, layoutsFor, normalizeGap, sanitizePrefix, scaleTileSize, tileFileName, tileRects,
  type NumberMode, type OutputFormat, type TileRect,
} from './lib';
import ImageSplitIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 单个分块的渲染结果 (文件名由前缀/编号方式在渲染与保存时实时生成, 改前缀无需重新切图) */
interface TileItem { rect: TileRect; url: string; bytes: number; width: number; height: number; }

const ImageSplit = () => {
  const { locale } = useLocale();
  const t = (zh: string) => is(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => isT(locale, zh, v);
  const { token } = theme.useToken();

  const imgRef = useRef<HTMLImageElement | null>(null); // 已解码的原图
  const [ src, setSrc ] = useState(''); // 原图 dataURL (预览)
  const [ size, setSize ] = useState({ width: 0, height: 0 }); // 原图尺寸
  const [ parts, setParts ] = useState<PartCount>(() => getDefaultParts()); // 分割份数
  const [ layoutKey, setLayoutKey ] = useState<string>(() => layoutKeyForParts(getDefaultParts())); // 布局 key
  const [ format, setFormat ] = useState<OutputFormat>(() => getDefaultFormat()); // 输出格式
  const [ quality, setQuality ] = useState<number>(() => getDefaultQuality()); // JPEG 质量
  const [ maxWidth, setMaxWidth ] = useState<number>(WIDTH_AUTO);
  const [ gap, setGap ] = useState<number>(GAP_DEFAULT); // 每块输出宽度; 0 = 原尺寸
  const [ prefix, setPrefix ] = useState<string>(DEFAULT_PREFIX); // 文件名前缀
  const [ mode, setMode ] = useState<NumberMode>('seq'); // 编号方式
  const [ tiles, setTiles ] = useState<TileItem[]>([]); // 分块结果
  const [ busy, setBusy ] = useState(false); // 生成中
  const [ saving, setSaving ] = useState(false); // 保存中
  const [ err, setErr ] = useState('');

  const layout = findLayout(layoutKey, parts);

  /** 读取文件 -> 解码图片 (文件名作为默认前缀) */
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
        setSize({ width: img.naturalWidth, height: img.naturalHeight });
        setPrefix(sanitizePrefix(file.name));
        setErr('');
        setSrc(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    return false;
  };

  /** 切换份数: 尽量保留当前方向 (新份数不支持时回退其第一个布局) */
  const onPartsChange = (v: PartCount) => {
    setParts(v);
    setLayoutKey(layoutKeyForParts(v, layoutKey));
  };

  /** 按当前参数切图 (canvas -> dataURL) */
  const split = () => {
    const img = imgRef.current;
    if (!img) return;
    const rects = tileRects(img.naturalWidth, img.naturalHeight, layout);
    if (rects.some((r) => r.width < 1 || r.height < 1)) {
      setTiles([]);
      setErr(t('尺寸过小, 无法按当前份数分割 (每块不足 1 像素)'));
      return;
    }
    const out: TileItem[] = [];
    for (const rect of rects) {
      const target = scaleTileSize(rect.width, rect.height, maxWidth);
      const canvas = document.createElement('canvas');
      canvas.width = target.width;
      canvas.height = target.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setErr(t('当前环境不支持 Canvas, 无法分割图片')); return; }
      // JPEG 无透明通道, 先铺白底避免透明区域变黑
      if (format === 'JPEG') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, target.width, target.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, target.width, target.height);
      const url = format === 'JPEG' ? canvas.toDataURL('image/jpeg', quality) : canvas.toDataURL('image/png');
      out.push({
        rect,
        url,
        // base64 长度 -> 大致字节数 (4 字符表示 3 字节)
        bytes: Math.round((url.length - url.indexOf(',') - 1) * 0.75),
        width: target.width,
        height: target.height,
      });
    }
    setTiles(out);
    setErr('');
  };

  // 图片或参数变化后重新切图 (先渲染再计算, 避免界面卡住没有反馈)
  useEffect(() => {
    if (!src) return;
    setBusy(true);
    const timer = window.setTimeout(() => {
      try {
        split();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ src, parts, layoutKey, format, quality, maxWidth ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    imgRef.current = null;
    setSrc('');
    setSize({ width: 0, height: 0 });
    setTiles([]);
    setErr('');
  };

  /** 保存全部: 桌面版选择目录一次写入; 浏览器逐个触发下载 */
  const onSaveAll = async () => {
    if (tiles.length === 0 || saving) return;
    setSaving(true);
    try {
      const names = tiles.map((i) => tileFileName(prefix, i.rect, mode, format, tiles.length));
      const n = await savePngBatch(names, tiles.map((i) => i.url));
      if (n === 0) message.info(t('已取消保存'));
      else message.success(tT('已保存 {n} 个文件', { n: n }));
    } catch {
      message.error(t('保存失败, 请重试'));
    } finally {
      setSaving(false);
    }
  };

  const tileSize = tiles.length > 0 ? `${tiles[0].rect.width} × ${tiles[0].rect.height} px` : '—';
  const outSize = tiles.length > 0 ? `${tiles[0].width} × ${tiles[0].height} px` : '—';
  const totalBytes = tiles.reduce((s, i) => s + i.bytes, 0);

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0, fontFamily: MONO } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6 } }>{ value }</span>
    </Tag>
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
            icon={ <FolderOpenOutlined /> }
            onClick={ onSaveAll }
            loading={ saving }
            disabled={ tiles.length === 0 }
          >
            { t('保存全部到文件夹') }
          </Button>
          <Button size="small" onClick={ onClear } disabled={ !src }>{ t('清空') }</Button>
        </Space>
        { busy ? <Tag color="processing">{ t('正在生成…') }</Tag> : null }
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
            { statTag(t('原图尺寸'), tT('{a} × {b} px', { a: size.width, b: size.height })) }
            { statTag(t('输出份数'), String(tiles.length)) }
            { statTag(t('每块尺寸'), tileSize) }
            { statTag(t('输出尺寸'), outSize) }
            { statTag(t('输出格式'), format === 'JPEG' ? `JPEG · ${quality}` : 'PNG') }
            { statTag(t('总体积'), formatBytes(totalBytes)) }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('分割参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('分割份数') }</Text>
          <Radio.Group
            value={ parts }
            onChange={ (e) => onPartsChange(e.target.value as PartCount) }
            options={ PART_OPTIONS.map((p) => ({ value: p, label: tT('{n} 份', { n: p }) })) }
          />
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('分割方向') }</Text>
          <Radio.Group
            value={ layout.key }
            onChange={ (e) => setLayoutKey(String(e.target.value)) }
            options={ layoutsFor(parts).map((l) => ({ value: l.key, label: t(LAYOUT_LABEL[l.key] ?? l.key) })) }
          />
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

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('每块输出宽度') }</Text>
          <InputNumber
            min={ WIDTH_MIN }
            max={ WIDTH_MAX }
            value={ maxWidth }
            onChange={ (v) => setMaxWidth(Number(v ?? WIDTH_AUTO)) }
            style={ { width: 140 } }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('0 = 保持原尺寸') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('图块间隔') }</Text>
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ GAP_MIN }
            max={ GAP_MAX }
            step={ 1 }
            value={ gap }
            onChange={ setGap }
            marks={ { [GAP_MIN]: String(GAP_MIN), [GAP_MAX]: String(GAP_MAX) } }
          />
          <InputNumber
            min={ GAP_MIN }
            max={ GAP_MAX }
            step={ 1 }
            value={ gap }
            onChange={ (v) => setGap(normalizeGap(v)) }
            style={ { width: 80 } }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('0 = 无分割线; 仅影响预览显示, 不影响导出的图片') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('文件名前缀') }</Text>
          <Input
            value={ prefix }
            onChange={ (e) => setPrefix(e.target.value) }
            style={ { width: 200 } }
            placeholder={ DEFAULT_PREFIX }
          />
          <Text style={ { flex: '0 0 auto' } }>{ t('编号方式') }</Text>
          <Segmented
            value={ mode }
            onChange={ (v) => setMode(v as NumberMode) }
            options={ NUMBER_MODES.map((m) => ({ value: m, label: m === 'seq' ? t('顺序编号 (1, 2, 3 …)') : t('行列编号 (r1c1, r1c2 …)') })) }
          />
        </div>
      </div>

      {/* 结果: 未选择图片时不展示 */}
      { src === '' ? null : (
        <>
          <Divider style={ { margin: '12px 0' } }>
            { t('分割预览') }{ tiles.length > 0 ? ` · ${tT('共 {n} 份', { n: tiles.length })}` : '' }
          </Divider>
          { tiles.length === 0 ? (
            <Text type="secondary">{ t('没有可保存的分块') }</Text>
          ) : (
            <div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('每张小图左上角为序号, 点「保存全部到文件夹」一次导出全部') }</Text>
              {/* 缩略图紧密拼合 + 用线分隔各块 (间隔即分割线粗细); 左上角叠序号 */}
              <div
                style={ {
                  display: 'grid',
                  gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
                  gap: gap,
                  padding: gap,
                  width: '100%',
                  maxWidth: 720,
                  lineHeight: 0,
                  borderRadius: token.borderRadius,
                  overflow: 'hidden',
                  // 背景色透过 gap / padding 显示, 形成包住每块的分割线
                  background: token.colorBorderSecondary,
                } }
              >
                { tiles.map((item) => (
                  <div
                    key={ item.rect.index }
                    style={ {
                      position: 'relative',
                      lineHeight: 0,
                      // 用真实宽高比占位, 各块尺寸一致不出现错位
                      aspectRatio: `${item.width} / ${item.height}`,
                      background: token.colorBgContainer,
                    } }
                  >
                    <img
                      src={ item.url }
                      alt=""
                      style={ { width: '100%', height: '100%', display: 'block', objectFit: 'fill' } }
                    />
                    <span
                      style={ {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        padding: '0 6px',
                        fontSize: 11,
                        lineHeight: '16px',
                        fontFamily: MONO,
                        color: '#fff',
                        background: 'rgba(0, 0, 0, 0.55)',
                        borderBottomRightRadius: 6,
                        pointerEvents: 'none',
                      } }
                    >
                      { mode === 'rc' ? `r${item.rect.row + 1}c${item.rect.col + 1}` : item.rect.index }
                    </span>
                  </div>
                )) }
              </div>
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('桌面版 (Tauri) 可选择保存目录, 一次写入全部文件; 浏览器演示版会逐个触发下载') }
              </Text>
            </div>
          ) }
        </>
      ) }

      <Divider>{ t('图片分割说明') }</Divider>
      <ImageSplitIntro />
    </>
  );
};

export default ImageSplit;
