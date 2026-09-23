// 图片转 SVG: 用 VTracer (Rust/WASM) 把位图描线成矢量 SVG
// 支持彩色分层 (照片 / 插画) 与黑白二值 (线稿 / 印章) 两种模式, 13 项参数 + 7 组预设
import { Alert, Button, Divider, InputNumber, Segmented, Slider, Space, Tag, Typography, Upload, message, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { CopyOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { vs, vsT } from './lang';
import {
  DEFAULT_CONFIG, FILE_SUFFIX, HIERARCHICALS, MODES, PARAMS, PRESETS, PRESET_DEFAULT, PREVIEW_MAX_H,
  PREVIEW_MAX_W, SOURCE_MAX_CHARS, TRACE_SIZES, TRACE_SIZE_DEFAULT,
  type Hierarchical, type Mode, type ParamKey, type TraceConfig,
} from './data';
import {
  clampParam, countPaths, injectViewBox, normalizeConfig, sizeRatio, svgBytes, svgDataUrl, toGrayPixels,
  toRequest, traceSizeOf,
} from './lib';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import {
  ImageError, drawToCanvas, formatBytes, loadImageFile, readPixels,
  type ImageFile, type Size,
} from '../../lib/image';
import ImageToSvgIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const PRESET_LABEL: Record<string, string> = {
  default: '默认',
  photo: '照片',
  flat: '扁平插画',
  poster: '海报色块',
  line: '线稿手绘',
  stamp: '印章文字',
  pixel: '像素风',
};
const PRESET_HINT: Record<string, string> = {
  default: 'VTracer 官方默认值, 通用的起点',
  photo: '保留更多相近色与细节, 适合照片 / 风景',
  flat: '合并相近色成整块, 适合扁平插画 / 图标',
  poster: '色差阈值更大, 得到大块纯色的海报效果',
  line: '黑白二值 + 保留棱角, 适合铅笔线稿 / 手绘',
  stamp: '黑白二值 + 直线多边形, 边缘更硬 (印章 / 文字)',
  pixel: '不做曲线拟合, 直接输出像素方块 (像素画 / 复古游戏)',
};
const MODE_LABEL: Record<Mode, string> = { spline: '平滑曲线', polygon: '直线多边形', pixel: '像素方块' };
const HIERARCHICAL_LABEL: Record<Hierarchical, string> = { stacked: '叠加', cutout: '镂空' };
const PARAM_LABEL: Record<ParamKey, string> = {
  filterSpeckle: '斑点过滤',
  colorPrecision: '颜色精度',
  layerDifference: '层间色差',
  cornerThreshold: '棱角阈值',
  lengthThreshold: '曲线细分长度',
  maxIterations: '平滑迭代',
  spliceThreshold: '拼接阈值',
  pathPrecision: '坐标精度',
};
const PARAM_HINT: Record<ParamKey, string> = {
  filterSpeckle: '忽略面积小于该值的碎块 (噪点), 调大可去掉扫描噪点与 JPEG 杂色',
  colorPrecision: '越大保留的相近色越多、色块越细; 调小会让相近色合并成整块',
  layerDifference: '相邻两层的色差阈值, 越大越容易并层 (层数少、色带明显)',
  cornerThreshold: '夹角大于该值才当作角保留, 调小更圆润、调大更硬朗',
  lengthThreshold: '线段被细分到不长于该长度, 越大曲线越平滑 (细节更少)',
  maxIterations: '样条逼近的迭代次数, 越大越圆滑、越慢也越大',
  spliceThreshold: '角度位移大于该值才拼接两段曲线, 越大转折越圆',
  pathPrecision: '坐标保留的小数位数, 8 最精确、0 文件最小',
};
/** 参数面板顺序 */
const PARAM_ORDER: ParamKey[] = [
  'filterSpeckle', 'colorPrecision', 'layerDifference', 'cornerThreshold',
  'lengthThreshold', 'maxIterations', 'spliceThreshold', 'pathPrecision',
];
/** 黑白二值模式下不生效的参数 (VTracer 的二值分支不走颜色聚类) */
const BINARY_HIDDEN: ParamKey[] = [ 'colorPrecision', 'layerDifference' ];

interface Result {
  svg: string;
  url: string;
  bytes: number;
  paths: number;
  size: Size;
  scaled: boolean;
  ms: number;
}

const ImageToSvg = () => {
  const { locale } = useLocale();
  const t = (zh: string) => vs(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => vsT(locale, zh, v);
  const { token } = theme.useToken();

  const [ file, setFile ] = useState<ImageFile | null>(null); // 已解码的原图
  const [ cfg, setCfg ] = useState<TraceConfig>(DEFAULT_CONFIG); // 当前参数
  const [ preset, setPreset ] = useState<string>(PRESET_DEFAULT); // 当前预设 (手动改参数后回到"自定义")
  const [ maxSide, setMaxSide ] = useState<number>(TRACE_SIZE_DEFAULT); // 处理尺寸上限
  const [ result, setResult ] = useState<Result | null>(null);
  const [ busy, setBusy ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ showSource, setShowSource ] = useState(false);
  const [ err, setErr ] = useState('');
  // 参数变化很快时会连续触发矢量化, 用递增的请求号丢弃过期的结果
  const runId = useRef(0);

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

  /** 画布取像素 -> VTracer 描线 -> 注入 viewBox */
  const trace = async () => {
    const f = file;
    if (!f) return;
    const { size, scaled } = traceSizeOf(f.size, maxSide);
    // 画布取像素 (依赖 lib/image 的通用管道, 不支持的浏览器返回 null)
    const canvas = drawToCanvas(f.img, size, false);
    const imageData = canvas ? readPixels(canvas) : null;
    if (!imageData) {
      setResult(null);
      setErr(t('当前环境不支持 Canvas, 无法处理图片'));
      return;
    }
    // 黑白二值前先转灰度: VTracer 的二值分支按「红通道 < 128」判定前景
    const pixels = cfg.colorMode === 'binary'
      ? toGrayPixels(imageData.data)
      : new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.length);
    const started = Date.now();
    const { rasterToSvg } = await import('./tracer');
    const raw = await rasterToSvg(pixels, size.width, size.height, toRequest(cfg));
    const svg = injectViewBox(raw, size.width, size.height);
    setResult({
      svg,
      url: svgDataUrl(svg),
      bytes: svgBytes(svg),
      paths: countPaths(svg),
      size,
      scaled,
      ms: Date.now() - started,
    });
    setErr('');
  };

  // 图片或参数变化后重新矢量化 (延迟一拍, 让「正在处理…」先绘制出来)
  useEffect(() => {
    if (!file) return;
    const id = ++runId.current;
    setBusy(true);
    const timer = window.setTimeout(() => {
      trace()
        .catch((e) => {
          if (runId.current !== id) return;
          setResult(null);
          const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
          // WebAssembly 被 CSP 拦住时给明确指向（否则用户只会看到「处理尺寸调小」这类误导提示）
          const msg = e instanceof Error ? e.message : '';
          const blocked = /webassembly|content security policy|unsafe-eval|wasm-unsafe-eval/i.test(msg);
          setErr(blocked
            ? t('当前环境禁止运行 WebAssembly (CSP 限制), 无法矢量化; 请更新应用或改用浏览器版') + detail
            : t('矢量化失败, 请重试或把「处理尺寸」调小') + detail);
        })
        .finally(() => {
          if (runId.current === id) setBusy(false);
        });
    }, 240);
    return () => window.clearTimeout(timer);
  }, [ file, cfg, maxSide ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    runId.current++;
    setFile(null);
    setResult(null);
    setShowSource(false);
    setErr('');
    setBusy(false);
  };

  /** 保存 SVG */
  const onSave = async () => {
    if (!result || !file || saving) return;
    setSaving(true);
    const name = `${file.base}_${FILE_SUFFIX}.svg`;
    try {
      const ok = await saveTextFile(name, result.svg, t('保存 SVG'), { filterName: 'SVG', extensions: [ 'svg' ] });
      if (ok) message.success(tT('已保存 {n}', { n: name }));
      else message.info(t('已取消保存'));
    } catch {
      message.error(t('保存失败, 请重试'));
    } finally {
      setSaving(false);
    }
  };

  /** 复制 SVG 源码 */
  const onCopy = async () => {
    if (!result) return;
    try {
      await copyTextToClipboard(result.svg);
      message.success(t('已复制 SVG 源码'));
    } catch {
      setShowSource(true);
      message.warning(t('复制失败, 请展开源码手动复制'));
    }
  };

  /** 切换预设: 在默认值基础上覆盖预设项 */
  const applyPreset = (key: string) => {
    const hit = PRESETS.find((p) => p.key === key);
    setPreset(key);
    if (hit) setCfg(normalizeConfig({ ...DEFAULT_CONFIG, ...hit.config }));
  };

  /** 手动改参数 (或改枚举): 与预设不再一致, 预设名置空 */
  const setParam = (key: ParamKey, v: number) => {
    setCfg((c) => ({ ...c, [key]: clampParam(key, v) }) as TraceConfig);
    setPreset('');
  };

  /** 手动改枚举参数 */
  const setEnum = (patch: Partial<TraceConfig>) => {
    setCfg((c) => ({ ...c, ...patch }));
    setPreset('');
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

  const pickerBox = (label: string, node: React.ReactNode) => (
    <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
      <Text style={ { width: 96, flex: '0 0 auto' } }>{ t(label) }</Text>
      { node }
    </div>
  );

  /** 一条数值参数 (标签 + 滑块 + 数字框 + 说明) */
  const numRow = (key: ParamKey) => {
    const p = PARAMS[key];
    const disabled = !file;
    return (
      <div key={ key } style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
        <Text style={ { width: 96, flex: '0 0 auto' } }>{ t(PARAM_LABEL[key]) }</Text>
        <Slider
          style={ { flex: 1, minWidth: 160, maxWidth: 260 } }
          min={ p.min }
          max={ p.max }
          step={ p.step }
          value={ cfg[key] }
          disabled={ disabled }
          marks={ { [p.min]: String(p.min), [p.max]: String(p.max) } }
          onChange={ (v) => setParam(key, v) }
        />
        <InputNumber
          min={ p.min }
          max={ p.max }
          step={ p.step }
          value={ cfg[key] }
          disabled={ disabled }
          onChange={ (v) => setParam(key, Number(v ?? PARAMS[key].def)) }
        />
        <Text type="secondary" style={ { fontSize: 12, maxWidth: 380 } }>{ t(PARAM_HINT[key]) }</Text>
      </div>
    );
  };

  const source = result ? (result.svg.length > SOURCE_MAX_CHARS ? result.svg.slice(0, SOURCE_MAX_CHARS) : result.svg) : '';

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
            { t('保存 SVG') }
          </Button>
          <Button
            size="small"
            icon={ <CopyOutlined /> }
            onClick={ onCopy }
            disabled={ !result }
          >
            { t('复制 SVG') }
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
              ? preview(result.url, { background: '#fff' })
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
                  { t('正在矢量化…') }
                </div>
              ) }
          </div>
          <div style={ { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: 460 } }>
            { statTag(t('原图尺寸'), fmtSize(file.size)) }
            { statTag(t('处理尺寸'), result ? fmtSize(result.size) : '—') }
            { statTag(t('路径数量'), result ? tT('{n} 条', { n: result.paths }) : '—') }
            { statTag(t('原图体积'), formatBytes(file.bytes)) }
            { statTag(t('SVG 体积'), result ? formatBytes(result.bytes) : '—') }
            { statTag(t('体积对比'), result ? tT('{n}%', { n: sizeRatio(result.bytes, file.bytes).toFixed(0) }) : '—') }
            { statTag(t('处理耗时'), result ? tT('{n} ms', { n: result.ms }) : '—') }
            { result?.scaled
              ? <Text type="secondary" style={ { fontSize: 12 } }>{ t('已按上限缩小后再描线 (矢量图与分辨率无关)') }</Text>
              : null }
          </div>
        </div>
      ) }

      <Divider style={ { margin: '12px 0' } }>{ t('调整参数') }</Divider>

      {/* 参数 */}
      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 980 } }>
        { pickerBox('预设', (
          <>
            <Segmented
              value={ preset }
              onChange={ (v) => applyPreset(String(v)) }
              options={ PRESETS.map((p) => ({ value: p.key, label: t(PRESET_LABEL[p.key]) })) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { preset ? t(PRESET_HINT[preset]) : t('已手动调整参数, 选一个预设可回到推荐组合') }
            </Text>
          </>
        )) }

        { pickerBox('处理尺寸', (
          <>
            <Segmented
              value={ maxSide }
              onChange={ (v) => setMaxSide(Number(v)) }
              disabled={ !file }
              options={ TRACE_SIZES.map((n) => ({
                value: n,
                label: n === 0 ? t('原尺寸') : tT('最长边不超过 {n} px', { n }),
              })) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('先缩小再描线, 速度更快; 矢量图放大不糊, 一般 1024 px 足够') }
            </Text>
          </>
        )) }

        { pickerBox('颜色模式', (
          <>
            <Segmented
              value={ cfg.colorMode }
              onChange={ (v) => setEnum({ colorMode: v as TraceConfig['colorMode'] }) }
              disabled={ !file }
              options={ [
                { value: 'color', label: t('彩色') },
                { value: 'binary', label: t('黑白二值') },
              ] }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('彩色会按相近色分层输出; 黑白二值只输出纯黑块 (线稿 / 印章 / 扫描件)') }
            </Text>
          </>
        )) }

        { pickerBox('曲线拟合', (
          <>
            <Segmented
              value={ cfg.mode }
              onChange={ (v) => setEnum({ mode: v as Mode }) }
              disabled={ !file }
              options={ MODES.map((m) => ({ value: m, label: t(MODE_LABEL[m]) })) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('样条曲线最贴合原图; 多边形 / 像素方块输出更规整、体积更小') }
            </Text>
          </>
        )) }

        { cfg.colorMode === 'color'
          ? pickerBox('层叠策略', (
            <>
              <Segmented
                value={ cfg.hierarchical }
                onChange={ (v) => setEnum({ hierarchical: v as Hierarchical }) }
                disabled={ !file }
                options={ HIERARCHICALS.map((h) => ({ value: h, label: t(HIERARCHICAL_LABEL[h]) })) }
              />
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('叠加层层覆盖、文件更小; 镂空每块互不重叠, 便于逐块编辑') }
              </Text>
            </>
          ))
          : null }

        { PARAM_ORDER.filter((key) => cfg.colorMode === 'color' || !BINARY_HIDDEN.includes(key)).map((key) => numRow(key)) }
      </div>

      <Divider>{ t('SVG 源码') }</Divider>
      <div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }>
          <Button size="small" onClick={ () => setShowSource((v) => !v) } disabled={ !result }>
            { t(showSource ? '收起源码' : '显示源码') }
          </Button>
          { result && result.svg.length > SOURCE_MAX_CHARS
            ? <Text type="secondary" style={ { fontSize: 12 } }>{ tT('已截断, 仅显示前 {n} 字符', { n: SOURCE_MAX_CHARS }) }</Text>
            : null }
        </div>
        { showSource && result
          ? (
            <pre
              style={ {
                margin: 0,
                maxHeight: 280,
                overflow: 'auto',
                padding: 8,
                fontFamily: MONO,
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                background: token.colorFillQuaternary,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
              } }
            >
              { source }
            </pre>
          )
          : null }
      </div>

      <Divider>{ t('图片转 SVG 说明') }</Divider>
      <ImageToSvgIntro />
    </>
  );
};

export default ImageToSvg;
