// 像素图: 把上传的图片转成像素风格 (像素块平均 -> 灰度 -> 调色板量化 + 有序抖动)
import { Alert, Button, Divider, InputNumber, Radio, Segmented, Select, Slider, Space, Switch, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useState } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { PALETTE_GROUP_TEXT, PALETTE_TEXT, PRESET_HINTS, PRESET_TEXT, pa, paT } from './lang';
import {
  BLOCK_MAX, BLOCK_MIN, FILE_SUFFIX, PALETTE_DEFS, PALETTE_GROUPS, PRESET_DEFS, PRESETS,
  PREVIEW_MAX_H, PREVIEW_MAX_W, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN,
  isAutoPalette, paletteColorCount,
  type PaletteKey, type Preset, type PresetDef,
} from './data';
import { gridSize, initialSettings, normalizeBlock, normalizePalette, pixelArt } from './lib';
import {
  CANVAS_MAX, ImageError, OUTPUT_FORMATS, extOf, filterImage, formatBytes, isLossy, loadImageFile, saveDataUrl,
  supportsWebp,
  type ImageFile, type OutputFormat, type Size,
} from '../../lib/image';
import PixelArtIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 参数状态: 快捷配置 + 四项可调参数 */
interface Cfg extends PresetDef { preset: Preset; }

/** 参数行 (标签固定 96px 宽, 与其它图片工具保持一致) */
const Line: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
    <Text style={ { width: 96, flex: '0 0 auto' } }>{ label }</Text>
    { children }
    { hint ? <Text type="secondary" style={ { fontSize: 12 } }>{ hint }</Text> : null }
  </div>
);

const PixelArt = () => {
  const { locale } = useLocale();
  const t = (zh: string) => pa(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => paT(locale, zh, v);
  const { token } = theme.useToken();

  const [ file, setFile ] = useState<ImageFile | null>(null); // 已解码的原图
  const [ cfg, setCfg ] = useState<Cfg>(() => {
    const init = initialSettings();
    return { preset: init.preset, ...init.settings };
  });
  const [ format, setFormat ] = useState<OutputFormat>('PNG');
  const [ quality, setQuality ] = useState<number>(QUALITY_DEFAULT);
  const [ result, setResult ] = useState<{ url: string; bytes: number } | null>(null);
  const [ busy, setBusy ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ err, setErr ] = useState('');

  /** 手动改参数 -> 快捷配置切到「自定义」 */
  const patch = (p: Partial<Cfg>) => setCfg((c) => ({ ...c, ...p, preset: 'custom' }));

  /** 套用快捷配置 */
  const applyPreset = (p: Preset) => {
    if (p === 'custom') {
      setCfg((c) => ({ ...c, preset: 'custom' }));
      return;
    }
    setCfg({ preset: p, ...PRESET_DEFS[p] });
  };

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

  /** 像素化 + 灰度 + 调色板量化 */
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
      transform: (data) => pixelArt(data, size.width, size.height, {
        block: cfg.block,
        grayscale: cfg.grayscale,
        palette: cfg.palette,
        dither: cfg.dither,
      }),
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
  }, [ file, cfg, format, quality ]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /** 调色板下拉项文案: 固定色表带上色数, 自适应 / 关闭已自带色数 */
  const paletteLabel = (k: PaletteKey) => (k === 'off' || isAutoPalette(k)
    ? t(PALETTE_TEXT[k])
    : `${t(PALETTE_TEXT[k])} (${paletteColorCount(k)} ${t('色')})`);

  const presetHint = cfg.preset === 'custom'
    ? t('当前为自定义参数, 可点上方快捷配置一键套用推荐值')
    : `${t(PRESET_HINTS[cfg.preset])} · ${tT('已应用 像素大小 {n} · 灰度 {g} · 抖动 {d} · 调色板 {p}', {
      n: cfg.block,
      g: t(cfg.grayscale ? '开' : '关'),
      d: t(cfg.dither ? '开' : '关'),
      p: paletteLabel(cfg.palette),
    })}`;

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
        imageRendering: 'pixelated',
      } }
    />
  );

  const grid = file ? gridSize(file.size.width, file.size.height, cfg.block) : null;

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
            { statTag(t('像素块'), `${cfg.block} px`) }
            { grid ? statTag(t('色块'), tT('{a} × {b} 块', { a: grid.gw, b: grid.gh })) : null }
            { statTag(t('调色板'), paletteLabel(cfg.palette)) }
            { statTag(t('原图体积'), formatBytes(file.bytes)) }
            { statTag(t('结果体积'), result ? formatBytes(result.bytes) : '—') }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('调整参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 } }>
        {/* 快捷配置 */}
        <div style={ { display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto', lineHeight: '24px' } }>{ t('快捷配置') }</Text>
          <div style={ { flex: 1, minWidth: 260 } }>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={ cfg.preset }
              onChange={ (e) => applyPreset(e.target.value as Preset) }
              options={ PRESETS.map((p) => ({ value: p, label: t(PRESET_TEXT[p]) })) }
            />
            <div style={ { marginTop: 6 } }>
              <Text type="secondary" style={ { fontSize: 12 } }>{ presetHint }</Text>
            </div>
          </div>
        </div>

        {/* 像素大小 */}
        <Line
          label={ t('像素大小') }
          hint={ t('像素块边长越小越接近原图, 越大越"粗"; 6~12 适合头像与游戏素材, 15~25 适合抽象图形与封面图') }
        >
          <Slider
            style={ { flex: 1, minWidth: 180, maxWidth: 320 } }
            min={ BLOCK_MIN }
            max={ BLOCK_MAX }
            step={ 1 }
            value={ cfg.block }
            disabled={ !file }
            marks={ { 6: '6', 12: '12', 24: '24', 48: '48' } }
            onChange={ (v) => patch({ block: v }) }
          />
          <InputNumber
            min={ BLOCK_MIN }
            max={ BLOCK_MAX }
            step={ 1 }
            addonAfter="px"
            value={ cfg.block }
            disabled={ !file }
            onChange={ (v) => patch({ block: normalizeBlock(v) }) }
          />
        </Line>

        {/* 灰度 */}
        <Line label={ t('灰度') } hint={ t('灰度只保留明暗, 配合小色数调色板更有"老式掌机"的味道') }>
          <Switch checked={ cfg.grayscale } disabled={ !file } onChange={ (v) => patch({ grayscale: v }) } />
        </Line>

        {/* 调色板 */}
        <Line label={ t('调色板') } hint={ t('按所选调色板把每个色块换成最接近的颜色; 选「关闭」则保留原图颜色') }>
          <Select<PaletteKey>
            style={ { width: 300 } }
            value={ cfg.palette }
            disabled={ !file }
            onChange={ (v) => patch({ palette: normalizePalette(v) }) }
            options={ PALETTE_GROUPS.map((g) => ({
              label: t(PALETTE_GROUP_TEXT[g]),
              options: (Object.keys(PALETTE_DEFS) as PaletteKey[])
                .filter((k) => PALETTE_DEFS[k].group === g)
                .map((k) => ({ value: k, label: paletteLabel(k) })),
            })) }
          />
        </Line>

        {/* 抖动 */}
        <Line label={ t('抖动') } hint={ t('色数少时打开抖动, 会用有序抖动的花纹补出中间层次 (调色板关闭时不生效)') }>
          <Switch
            checked={ cfg.dither }
            disabled={ !file || cfg.palette === 'off' }
            onChange={ (v) => patch({ dither: v }) }
          />
        </Line>

        {/* 输出格式 / 质量 */}
        <Line label={ t('输出格式') } hint={ t('PNG 无损且保留透明; JPEG / WebP 体积更小, 质量可调') }>
          <Segmented
            value={ format }
            onChange={ (v) => setFormat(v as OutputFormat) }
            options={ OUTPUT_FORMATS.map((v) => ({
              value: v,
              label: v,
              disabled: v === 'WebP' && !supportsWebp(),
            })) }
          />
          { supportsWebp()
            ? null
            : <Text type="secondary" style={ { fontSize: 12 } }>{ t('当前环境不支持 WebP 导出') }</Text> }
        </Line>

        <Line label={ t('输出质量') } hint={ t('仅 JPEG / WebP 输出时生效') }>
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
        </Line>

        <Text type="secondary" style={ { fontSize: 12 } }>{ t('每个色块的颜色 = 块内像素按透明度加权平均') }</Text>
        <Text type="secondary" style={ { fontSize: 12 } }>{ t('导出尺寸与原图完全一致 (只是把画面切成大色块); 需要更小的图片请再用「图片调整」工具缩小') }</Text>
        <Text type="secondary" style={ { fontSize: 12 } }>{ t('α (透明度) 通道保持不变; 输出 JPEG / WebP 时会先铺白底') }</Text>
      </div>

      <Divider>{ t('像素图说明') }</Divider>
      <PixelArtIntro />
    </>
  );
};

export default PixelArt;
