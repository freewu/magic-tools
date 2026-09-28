// 二维码解析: 上传 / 拖拽 / 粘贴二维码图片, 用 jsQR 读出内容并拆解结构化字段
import { Alert, Button, Card, Descriptions, Divider, Empty, Input, Select, Space, Spin, Tag, Typography, Upload, message, theme } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClearOutlined, CopyOutlined, DownloadOutlined, LinkOutlined, QrcodeOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import {
  CHUNK_LABELS, FIELD_LABELS, INVERSION_OPTIONS, KIND_LABELS, MAX_EDGE_OPTIONS, PREVIEW_MAX_HEIGHT,
} from './data';
import {
  decodePixels, decodeSizeOf, getSettings, hexOf, historyTitle, isOpenableUrl, parsePayload,
  polygonPoints, pushHistory, resultFileName, textBytes,
  type DecodedQr, type HistoryEntry, type PayloadInfo, type Size,
} from './lib';
import {
  CANVAS_MAX, ImageError, drawToCanvas, formatBytes, loadImageFile, readPixels, type ImageFile,
} from '../../lib/image';
import { openUrl, saveTextFile } from '../../lib/tauri';
import QrDecodeIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** HEX 预览最多显示的字节数 */
const HEX_PREVIEW = 64;

const QrDecode = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();

  const [ file, setFile ] = useState<ImageFile | null>(null);
  const [ result, setResult ] = useState<DecodedQr | null>(null);
  const [ target, setTarget ] = useState<Size | null>(null); // 实际用于解析的位图尺寸 (即框选坐标所在坐标系)
  const [ busy, setBusy ] = useState(false);
  const [ ms, setMs ] = useState(0);
  const [ err, setErr ] = useState('');
  const [ history, setHistory ] = useState<HistoryEntry[]>([]);
  const [ settings ] = useState(() => getSettings());

  // 参数: 初始值来自设置中心 (工具页可临时改, 不回写)
  const [ inversion, setInversion ] = useState(() => settings.inversion);
  const [ maxEdge, setMaxEdge ] = useState(() => settings.maxEdge);

  const copySeq = useRef(0);

  /** 复制到剪贴板 (桌面端 WebView 可能没有权限, 失败时给出提示) */
  const copy = useCallback(async (text: string, okMsg: string) => {
    const seq = ++copySeq.current;
    try {
      await navigator?.clipboard?.writeText(text);
      if (seq === copySeq.current) message.success(okMsg);
    } catch {
      if (seq === copySeq.current) message.warning(t('复制失败, 请手动选择复制'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ locale ]);

  /** 读取文件 -> 解码图片 */
  const onFile = useCallback((f: File) => {
    loadImageFile(f)
      .then((loaded) => {
        setFile(loaded);
        setResult(null);
        setTarget(null);
        setErr('');
        setMs(0);
      })
      .catch((e) => {
        setFile(null);
        setResult(null);
        const code = e instanceof ImageError ? e.code : 'decode-failed';
        setErr(code === 'not-image'
          ? t('请选择图片文件')
          : code === 'read-failed' ? t('图片读取失败') : t('图片解析失败'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ locale ]);

  // 粘贴截图 (剪贴板里带图片时才接管, 不影响输入框里的文本粘贴)
  useEffect(() => {
    const onPaste = (e: Event) => {
      const files = (e as ClipboardEvent).clipboardData?.files;
      if (!files || files.length === 0) return;
      e.preventDefault();
      onFile(files[0]);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [ onFile ]);

  // 解析: 图片 / 参数变化时重跑 (让出一个宏任务, 界面先显示「解析中」)
  useEffect(() => {
    if (!file) {
      setResult(null);
      setTarget(null);
      setErr('');
      setBusy(false);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setResult(null);
    setErr('');
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const size = decodeSizeOf(file.size, maxEdge);
      if (size.width > CANVAS_MAX || size.height > CANVAS_MAX) {
        setErr(tT('图片尺寸过大, 单边不能超过 {n} px', { n: CANVAS_MAX }));
        setBusy(false);
        return;
      }
      const canvas = drawToCanvas(file.img, size);
      const pixels = canvas ? readPixels(canvas) : null;
      if (!pixels) {
        setErr(t('当前环境不支持 Canvas, 无法解析二维码'));
        setBusy(false);
        return;
      }
      const startedAt = Date.now();
      const decoded = decodePixels(pixels.data, size, inversion);
      if (cancelled) return;
      setMs(Math.max(0, Date.now() - startedAt));
      setTarget(size);
      setResult(decoded);
      setBusy(false);
      if (decoded) {
        const payload = parsePayload(decoded.text);
        setHistory((prev) => pushHistory(prev, { text: decoded.text, at: Date.now(), kind: payload.kind }, settings.historyMax));
        if (settings.autoCopy && decoded.text !== '') void copy(decoded.text, t('已复制解析结果'));
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ file, inversion, maxEdge, settings.historyMax, settings.autoCopy ]);

  const payload: PayloadInfo | null = useMemo(
    () => (result ? parsePayload(result.text) : null),
    [ result ]
  );

  const onSave = async () => {
    if (!result) return;
    const name = resultFileName();
    try {
      const ok = await saveTextFile(name, result.text, t('保存为 TXT'), { filterName: 'Text', extensions: [ 'txt' ] });
      if (ok) message.success(tT('已保存 {file}', { file: name }));
    } catch (e) {
      message.error(tT('保存失败: {msg}', { msg: e instanceof Error ? e.message : String(e) }));
    }
  };

  const onClear = () => {
    setFile(null);
    setResult(null);
    setTarget(null);
    setErr('');
    setMs(0);
  };

  const restore = (h: HistoryEntry) => {
    setResult({ text: h.text, bytes: [], version: 0, chunks: [], corners: null });
    setTarget(null);
    message.info(t('已从历史记录恢复'));
  };

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0, fontFamily: MONO } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6 } }>{ value }</span>
    </Tag>
  );

  const boxSize: Size | null = target ?? file?.size ?? null;
  const points = polygonPoints(result?.corners ?? null);
  const kindLabel = payload ? t(KIND_LABELS[payload.kind]) : '';
  const hex = result ? hexOf(result.bytes, HEX_PREVIEW) : '';
  const hexMore = result && result.bytes.length > HEX_PREVIEW;

  return (
    <>
      {/* 顶部操作栏 */}
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 } }>
        <Space wrap>
          <Upload accept="image/*" showUploadList={ false } beforeUpload={ (f) => { onFile(f as File); return false; } }>
            <Button size="small" icon={ <UploadOutlined /> }>{ file ? t('重新选择') : t('选择二维码图片') }</Button>
          </Upload>
          <Button size="small" icon={ <ClearOutlined /> } onClick={ onClear } disabled={ !file }>{ t('清空') }</Button>
          <Button size="small" onClick={ () => setHistory([]) } disabled={ history.length === 0 }>{ t('清空历史') }</Button>
        </Space>
        <Space wrap>
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('反色策略') }</Text>
          <Select
            size="small"
            style={ { width: 190 } }
            value={ inversion }
            onChange={ (v) => setInversion(v) }
            options={ INVERSION_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('图片最大边长') }</Text>
          <Select
            size="small"
            style={ { width: 130 } }
            value={ maxEdge }
            onChange={ (v) => setMaxEdge(v) }
            options={ MAX_EDGE_OPTIONS.map((n) => ({ value: n, label: n === 0 ? t('不缩放') : `${n} px` })) }
          />
        </Space>
      </div>

      { err ? <Alert type="error" showIcon style={ { marginBottom: 8 } } message={ t('解析失败') } description={ err } /> : null }

      { !file ? (
        <div
          onDragOver={ (e) => e.preventDefault() }
          onDrop={ (e) => { e.preventDefault(); const f = e.dataTransfer?.files; if (f && f.length > 0) onFile(f[0]); } }
          style={ {
            border: `1px dashed ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorFillQuaternary,
            padding: '48px 16px',
            textAlign: 'center',
          } }
        >
          <QrcodeOutlined style={ { fontSize: 32, color: token.colorTextSecondary } } />
          <div style={ { marginTop: 12 } }>{ t('拖拽二维码图片到此处, 或点击「选择二维码图片」') }</div>
          <div style={ { marginTop: 4 } }>{ t('也可以直接把截图粘贴进来 (Ctrl / ⌘ + V)') }</div>
          <Text type="secondary" style={ { fontSize: 12 } }>
            { t('支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片; 解析全在本地完成, 图片不会上传') }
          </Text>
        </div>
      ) : (
        <div style={ { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' } }>
          {/* 图片预览: 命中时框出二维码位置 */}
          <Card
            size="small"
            title={ t('二维码位置') }
            style={ { flex: '1 1 320px', minWidth: 280 } }
            styles={ { body: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 } } }
          >
            <div style={ { position: 'relative', display: 'inline-block', maxWidth: '100%' } }>
              <img
                src={ file.url }
                alt={ t('二维码位置') }
                style={ { display: 'block', maxWidth: '100%', maxHeight: PREVIEW_MAX_HEIGHT } }
              />
              { points && boxSize && boxSize.width > 0 && boxSize.height > 0 ? (
                <svg
                  className="qr-locate"
                  viewBox={ `0 0 ${boxSize.width} ${boxSize.height}` }
                  preserveAspectRatio="none"
                  style={ { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' } }
                >
                  <polygon
                    points={ points }
                    fill="rgba(255, 77, 79, 0.18)"
                    stroke="#ff4d4f"
                    strokeWidth={ Math.max(2, boxSize.width / 240) }
                  />
                </svg>
              ) : null }
            </div>
          </Card>

          {/* 结果区 */}
          <Card size="small" title={ t('解析结果') } style={ { flex: '1 1 460px', minWidth: 320 } }>
            { busy ? (
              <div style={ { padding: '24px 0', textAlign: 'center' } }>
                <Spin />
                <div style={ { marginTop: 8 } }>{ t('解析中…') }</div>
              </div>
            ) : result ? (
              <Space direction="vertical" size={12} style={ { width: '100%' } }>
                <Space wrap size={8}>
                  <Tag color="blue" style={ { marginInlineEnd: 0 } }>{ kindLabel }</Tag>
                  { result.version > 0 ? <Tag style={ { marginInlineEnd: 0 } }>{ tT('版本 V{v}', { v: result.version }) }</Tag> : null }
                  { statTag(t('图片尺寸'), `${file.size.width} × ${file.size.height} px`) }
                  { target ? statTag(t('解析尺寸'), `${target.width} × ${target.height} px`) : null }
                  { statTag(t('解码用时'), tT('{n} ms', { n: ms })) }
                </Space>

                <Input.TextArea
                  className="qr-text"
                  readOnly
                  value={ result.text }
                  autoSize={ { minRows: 3, maxRows: 8 } }
                  style={ { fontFamily: MONO, fontSize: 13 } }
                />

                <Space wrap>
                  <Button size="small" icon={ <CopyOutlined /> } onClick={ () => { void copy(result.text, t('已复制解析结果')); } }>{ t('复制') }</Button>
                  <Button size="small" icon={ <DownloadOutlined /> } onClick={ () => { void onSave(); } }>{ t('保存为 TXT') }</Button>
                  { isOpenableUrl(result.text)
                    ? <Button size="small" icon={ <LinkOutlined /> } onClick={ () => { void openUrl(result.text.trim()); } }>{ t('打开链接') }</Button>
                    : null }
                </Space>

                { payload && payload.fields.length > 0 ? (
                  <>
                    <Divider orientation="left" plain style={ { margin: 0 } }>{ t('结构化信息') }</Divider>
                    <Descriptions
                      className="qr-fields"
                      size="small"
                      column={ 1 }
                      bordered
                      items={ payload.fields.map((f, i) => ({
                        key: `${f.key}-${i}`,
                        label: t(FIELD_LABELS[f.key] ?? f.key),
                        children: <Text style={ { fontFamily: MONO, wordBreak: 'break-all' } }>{ f.value }</Text>,
                      })) }
                    />
                  </>
                ) : null }

                { result.chunks.length > 0 ? (
                  <>
                    <Divider orientation="left" plain style={ { margin: 0 } }>{ t('编码信息') }</Divider>
                    <Space wrap size={6}>
                      { result.chunks.map((c, i) => (
                        <Tag key={ `${c.kind}-${i}` } style={ { marginInlineEnd: 0 } }>
                          { `${t(CHUNK_LABELS[c.kind])} · ${c.length}` }
                        </Tag>
                      ))}
                    </Space>
                    <Text type="secondary" style={ { fontSize: 12 } }>{ tT('{n} 字节', { n: textBytes(result.text) }) }</Text>
                  </>
                ) : null }

                { result.bytes.length > 0 ? (
                  <>
                    <Divider orientation="left" plain style={ { margin: 0 } }>
                      { tT('原始字节 ({n} 字节)', { n: result.bytes.length }) }
                    </Divider>
                    <pre className="qr-hex" style={ { margin: 0, fontFamily: MONO, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 160, overflow: 'auto' } }>
                      { hexMore ? `${hex} …` : hex }
                    </pre>
                  </>
                ) : null }
              </Space>
            ) : (
              <Empty
                image={ Empty.PRESENTED_IMAGE_SIMPLE }
                description={
                  <Space direction="vertical" size={4}>
                    <Text>{ t('未识别到二维码') }</Text>
                    <Text type="secondary" style={ { fontSize: 12 } }>
                      { t('可尝试: 换一张更清晰 / 更完整的图; 把「反色策略」改成「自动尝试反色」; 截图时四周多留一点白边; 二维码太小可先放大图片再截一次') }
                    </Text>
                  </Space>
                }
              />
            ) }
          </Card>
        </div>
      ) }

      {/* 历史记录 */}
      <Card size="small" title={ t('历史记录') } style={ { marginTop: 16 } }>
        { history.length === 0 ? (
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('暂无记录') }</Text>
        ) : (
          <Space direction="vertical" size={6} style={ { width: '100%' } }>
            <Space wrap size={6}>
              { history.map((h) => (
                <Button key={ `${h.at}-${h.text}` } size="small" onClick={ () => restore(h) } title={ historyTitle(h.text, 200) }>
                  <Tag color="blue" style={ { marginInlineEnd: 4, marginInlineStart: 0 } }>{ t(KIND_LABELS[h.kind]) }</Tag>
                  { historyTitle(h.text, 40) }
                </Button>
              ))}
            </Space>
            <Text type="secondary" style={ { fontSize: 12 } }>
              { `${t('点击可重新查看')} · ${tT('最多保留 {n} 条', { n: settings.historyMax })}` }
            </Text>
          </Space>
        ) }
      </Card>

      <Divider>{ t(' 二维码解析说明 ') }</Divider>
      <QrDecodeIntro />
    </>
  );
};

export default QrDecode;
