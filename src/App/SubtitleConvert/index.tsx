import { Alert, Button, Card, Divider, InputNumber, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import { InboxOutlined, DownloadOutlined, CopyOutlined, SwapOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { SUB_FORMATS, parseSubtitle, toSubtitle, detectSubtitleFormat, fmtDuration, DEFAULT_FPS } from './lib';
import type { SubFormat, SubCue } from './lib';
import { copyTextToClipboard } from '../../lib';
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import subLang from "./lang";

const { Text, Paragraph } = Typography;

interface PreviewRow {
  key: number;
  idx: number;
  time: string;
  text: string;
}

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,500
大家好，欢迎使用字幕格式转换
2
00:00:05,200 --> 00:00:08,000
本工具在浏览器本地完成九种字幕格式互转

文件不会上传到任何服务器
`;

const SubtitleConvert :React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(subLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(subLang, locale, key, vars, fallback);
  // 把 lib 抛出的 zh 错误文案按当前 locale 翻译 (动态部分用模板/正则还原)
  const subErrText = (raw :string) :string => {
    const P = '时间格式无法识别: ';
    if (raw.startsWith(P)) return tpl('e_timeFmt', { v: raw.slice(P.length) }, raw);
    const mItem = /^JSON 第 (\d+) 项不是对象$/.exec(raw);
    if (mItem) return tpl('e_jsonItem', { n: Number(mItem[1]) }, raw);
    const mMiss = /^JSON 第 (\d+) 项缺 start\/end 时间 \(毫秒\)$/.exec(raw);
    if (mMiss) return tpl('e_jsonMiss', { n: Number(mMiss[1]) }, raw);
    const map :Record<string, string> = {
      '不是有效的 WebVTT 文件 (缺少 WEBVTT 头)': 'e_webvtt',
      '不是有效的 SAMI 文件': 'e_sami',
      '不是有效的 JSON': 'e_json',
      'JSON 顶层需为数组: [{"start":ms,"end":ms,"text":"..."}] (毫秒)': 'e_jsonArr',
      'JSON 顶层需为数组 (毫秒)': 'e_jsonArrMs',
    };
    const k = map[raw];
    return k ? t(k, raw) : raw;
  };

  const [ rawText, setRawText ] = useState('');
  const [ inFormat, setInFormat ] = useState<'auto' | SubFormat>('auto');
  const [ outFormat, setOutFormat ] = useState<SubFormat>('srt');
  const [ fps, setFps ] = useState<number>(DEFAULT_FPS);
  const [ cues, setCues ] = useState<SubCue[] | null>(null);
  const [ outText, setOutText ] = useState('');
  const [ fileName, setFileName ] = useState('');
  const [ convertError, setConvertError ] = useState('');

  const useFps = inFormat === 'sub' || outFormat === 'sub';

  const doConvert = (format?: SubFormat) => {
    const target = format ?? outFormat;
    setConvertError('');
    if (!rawText.trim()) {
      message.warning(t('warnNeedText', '请先粘贴或上传字幕文本'));
      return;
    }
    let srcFmt: SubFormat;
    if (inFormat === 'auto') {
      const detected = detectSubtitleFormat(rawText);
      if (!detected) {
        const em = t('errAuto', '未能自动识别输入格式，请手动选择');
        setConvertError(em);
        message.error(em);
        return;
      }
      srcFmt = detected;
    } else {
      srcFmt = inFormat;
    }
    try {
      const parsed = parseSubtitle(rawText, srcFmt, { fps });
      if (parsed.length === 0) {
        message.warning(t('warnNoCue', '未解析到任何字幕条目，请检查内容'));
        return;
      }
      const out = toSubtitle(parsed, target, { fps });
      setCues(parsed);
      setOutText(out);
      message.success(tpl('convertedTpl', { n: parsed.length, src: srcFmt, target }, `已转换 ${parsed.length} 条字幕 (${srcFmt} → ${target})`));
    } catch (err) {
      const em = subErrText(err instanceof Error ? err.message : String(err));
      setConvertError(em);
      message.error(em);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(String(reader.result ?? ''));
      setFileName(file.name);
    };
    reader.onerror = () => message.error(t('fileReadFail', '文件读取失败'));
    reader.readAsText(file);
    return false;
  };

  const download = () => {
    if (!outText) return;
    const meta = SUB_FORMATS.find((f) => f.value === outFormat)!;
    const base = fileName ? fileName.replace(/\.[^/.]+$/u, '') : 'subtitle';
    const blob = new Blob([ outText ], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}.${meta.ext}`;
    // 先挂到文档再触发、延时回收 Blob URL: 部分环境 (如桌面 WebView) 要求 a 在文档中且
    // URL 稍晚释放, 否则会出现“点击下载无反应/不弹保存框”的现象
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    message.success(tpl('downloadedTpl', { file: a.download }, `已下载 ${a.download}`));
  };

  const totalMs = (cues ?? []).reduce((s, c) => s + Math.max(0, (c.end ?? 0) - (c.start ?? 0)), 0);
  const rows: PreviewRow[] = (cues ?? []).slice(0, 200).map((c, i) => ({
    key: i,
    idx: i + 1,
    time: c.start + ' → ' + c.end,
    text: c.text.replace(/\n/gu, ' ⏎ '),
  }));

  const columns: ColumnsType<PreviewRow> = [
    { title: '#', dataIndex: 'idx', width: 48 },
    { title: t('colStart', '开始'), dataIndex: 'time', width: 210 },
    { title: t('colText', '文本'), dataIndex: 'text', ellipsis: true },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('alertTitle', '字幕格式转换')}
        description={t('alertDesc', '在浏览器本地完成 SRT / VTT / SBV / SUB / SSA / ASS / SMI / LRC / JSON 九种字幕格式互相转换，内容不会上传到任何服务器。各格式的样式指令（如 ASS {\\pos}、SRT <i>、MicroDVD {y:..}）在转换时会剥除，仅保留文本与时间轴。')}
      />

      <Card title={t('cardIn', '输入')} size="small">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <span style={{ color: 'rgba(0,0,0,0.55)' }}>{t('lbInFmt', '输入格式')}</span>
            <Select
              style={{ width: 220 }}
              value={inFormat}
              onChange={(v) => setInFormat(v)}
              options={[
                { value: 'auto', label: t('optAuto', '自动检测') },
                ...SUB_FORMATS.map((f) => ({ value: f.value, label: f.value === 'lrc' ? t('fmt_lrc', f.label) : f.label })),
              ]}
            />
            {useFps && (
              <>
                <span style={{ color: 'rgba(0,0,0,0.55)' }}>{t('lbFps', '帧率 (fps)')}</span>
                <InputNumber min={1} max={120} value={fps} onChange={(v) => setFps(v ?? DEFAULT_FPS)} style={{ width: 110 }} />
              </>
            )}
            <Upload accept=".srt,.vtt,.sbv,.sub,.ssa,.ass,.smi,.lrc,.json,.txt" beforeUpload={(f) => { handleFile(f); return false; }} showUploadList={false}>
              <Button icon={<InboxOutlined />}>{t('uploadBtn', '上传字幕文件')}</Button>
            </Upload>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => { setRawText(SAMPLE_SRT); setInFormat('auto'); setFileName(''); }}
            >
              {t('loadBtn', '载入示例')}
            </Button>
          </Space>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t('ph', '粘贴字幕文本…（也可点击上方按钮上传文件）\n\n示例:\n1\n00:00:01,000 --> 00:00:03,000\n你好')}
            spellCheck={false}
            style={{ width: '100%', minHeight: 160, resize: 'vertical' }}
          />
          {fileName && <Text type="secondary">{ tpl('loadedFile', { name: fileName }, `已载入文件: ${fileName}`) }</Text>}
        </Space>
      </Card>

      <Card size="small">
        <Space wrap>
          <span style={{ color: 'rgba(0,0,0,0.55)' }}>{t('lbOutFmt', '输出格式')}</span>
          <Select
            style={{ width: 220 }}
            value={outFormat}
            onChange={(v: SubFormat) => { setOutFormat(v); if (cues && outText) doConvert(v); }}
            options={SUB_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
          />
          <Button type="primary" icon={<SwapOutlined />} onClick={() => doConvert()}>
            {t('convertBtn', '转换')}
          </Button>
          {convertError && <Text type="danger">{convertError}</Text>}
        </Space>
      </Card>

      <Card
        title={t('cardOut', '输出')}
        size="small"
        extra={cues && (
          <Space>
            <Tag color="blue">{ tpl('tagCues', { n: cues.length }, `${cues.length} 条字幕`) }</Tag>
            <Tag>{ tpl('tagDur', { dur: fmtDuration(totalMs) }, `总时长 ${fmtDuration(totalMs)}`) }</Tag>
          </Space>
        )}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <Button icon={<DownloadOutlined />} disabled={!outText} onClick={download}>
              { tpl('dlFile', { ext: SUB_FORMATS.find((f) => f.value === outFormat)?.ext ?? '' }, `下载 ${SUB_FORMATS.find((f) => f.value === outFormat)?.ext} 文件`) }
            </Button>
            <Button
              icon={<CopyOutlined />}
              disabled={!outText}
              onClick={() => { copyTextToClipboard(outText); message.success(t('copiedOk', '已复制')); }}
            >
              {t('copyBtn', '复制结果')}
            </Button>
            {outFormat === 'json' && (
              <Text type="secondary" style={{ fontSize: 12 }}>{t('jsonNote', 'JSON 结构: [{"start":毫秒,"end":毫秒,"text":"文本"}]')}</Text>
            )}
          </Space>
          <textarea
            readOnly
            value={outText}
            spellCheck={false}
            style={{ width: '100%', minHeight: 160, resize: 'vertical', background: 'rgba(0,0,0,0.03)' }}
          />
          {cues && (
            <>
              <Divider style={{ margin: '4px 0' }} />
              <Paragraph type="secondary" style={{ marginBottom: 4 }}>{ tpl('previewTitle', { n: Math.min(rows.length, 200) }, `内容预览 (前 ${Math.min(rows.length, 200)} 条)`) }</Paragraph>
              <Table<PreviewRow>
                size="small"
                columns={columns}
                dataSource={rows}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ y: 260 }}
              />
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
};

export default SubtitleConvert;
