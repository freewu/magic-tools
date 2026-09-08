import { Alert, Button, Card, Divider, InputNumber, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import { InboxOutlined, DownloadOutlined, CopyOutlined, SwapOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { SUB_FORMATS, parseSubtitle, toSubtitle, detectSubtitleFormat, fmtDuration, DEFAULT_FPS } from './lib';
import type { SubFormat, SubCue } from './lib';
import { copyTextToClipboard } from '../../lib';

const { Text, Paragraph } = Typography;

interface PreviewRow {
  key: number;
  idx: number;
  time: string;
  text: string;
}

const previewColumns: ColumnsType<PreviewRow> = [
  { title: '#', dataIndex: 'idx', width: 48 },
  { title: '开始', dataIndex: 'time', width: 210 },
  { title: '文本', dataIndex: 'text', ellipsis: true },
];

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,500
大家好，欢迎使用字幕格式转换
2
00:00:05,200 --> 00:00:08,000
本工具在浏览器本地完成九种字幕格式互转

文件不会上传到任何服务器
`;

const SubtitleConvert :React.FC = () => {
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
      message.warning('请先粘贴或上传字幕文本');
      return;
    }
    let srcFmt: SubFormat;
    if (inFormat === 'auto') {
      const detected = detectSubtitleFormat(rawText);
      if (!detected) {
        setConvertError('未能自动识别输入格式，请手动选择');
        message.error('未能自动识别输入格式，请手动选择');
        return;
      }
      srcFmt = detected;
    } else {
      srcFmt = inFormat;
    }
    try {
      const parsed = parseSubtitle(rawText, srcFmt, { fps });
      if (parsed.length === 0) {
        message.warning('未解析到任何字幕条目，请检查内容');
        return;
      }
      const out = toSubtitle(parsed, target, { fps });
      setCues(parsed);
      setOutText(out);
      message.success(`已转换 ${parsed.length} 条字幕 (${srcFmt} → ${target})`);
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : String(err));
      message.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(String(reader.result ?? ''));
      setFileName(file.name);
    };
    reader.onerror = () => message.error('文件读取失败');
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
    message.success(`已下载 ${a.download}`);
  };

  const totalMs = (cues ?? []).reduce((s, c) => s + Math.max(0, (c.end ?? 0) - (c.start ?? 0)), 0);
  const rows: PreviewRow[] = (cues ?? []).slice(0, 200).map((c, i) => ({
    key: i,
    idx: i + 1,
    time: c.start + ' → ' + c.end,
    text: c.text.replace(/\n/gu, ' ⏎ '),
  }));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="字幕格式转换"
        description="在浏览器本地完成 SRT / VTT / SBV / SUB / SSA / ASS / SMI / LRC / JSON 九种字幕格式互相转换，内容不会上传到任何服务器。各格式的样式指令（如 ASS {\pos}、SRT <i>、MicroDVD {y:..}）在转换时会剥除，仅保留文本与时间轴。"
      />

      <Card title="输入" size="small">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <span style={{ color: 'rgba(0,0,0,0.55)' }}>输入格式</span>
            <Select
              style={{ width: 220 }}
              value={inFormat}
              onChange={(v) => setInFormat(v)}
              options={[
                { value: 'auto', label: '自动检测' },
                ...SUB_FORMATS.map((f) => ({ value: f.value, label: f.label })),
              ]}
            />
            {useFps && (
              <>
                <span style={{ color: 'rgba(0,0,0,0.55)' }}>帧率 (fps)</span>
                <InputNumber min={1} max={120} value={fps} onChange={(v) => setFps(v ?? DEFAULT_FPS)} style={{ width: 110 }} />
              </>
            )}
            <Upload accept=".srt,.vtt,.sbv,.sub,.ssa,.ass,.smi,.lrc,.json,.txt" beforeUpload={(f) => { handleFile(f); return false; }} showUploadList={false}>
              <Button icon={<InboxOutlined />}>上传字幕文件</Button>
            </Upload>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => { setRawText(SAMPLE_SRT); setInFormat('auto'); setFileName(''); }}
            >
              载入示例
            </Button>
          </Space>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={'粘贴字幕文本…（也可点击上方按钮上传文件）\n\n示例:\n1\n00:00:01,000 --> 00:00:03,000\n你好'}
            spellCheck={false}
            style={{ width: '100%', minHeight: 160, resize: 'vertical' }}
          />
          {fileName && <Text type="secondary">已载入文件: {fileName}</Text>}
        </Space>
      </Card>

      <Card size="small">
        <Space wrap>
          <span style={{ color: 'rgba(0,0,0,0.55)' }}>输出格式</span>
          <Select
            style={{ width: 220 }}
            value={outFormat}
            onChange={(v: SubFormat) => { setOutFormat(v); if (cues && outText) doConvert(v); }}
            options={SUB_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
          />
          <Button type="primary" icon={<SwapOutlined />} onClick={() => doConvert()}>
            转换
          </Button>
          {convertError && <Text type="danger">{convertError}</Text>}
        </Space>
      </Card>

      <Card
        title="输出"
        size="small"
        extra={cues && (
          <Space>
            <Tag color="blue">{cues.length} 条字幕</Tag>
            <Tag>总时长 {fmtDuration(totalMs)}</Tag>
          </Space>
        )}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <Button icon={<DownloadOutlined />} disabled={!outText} onClick={download}>
              下载 {SUB_FORMATS.find((f) => f.value === outFormat)?.ext} 文件
            </Button>
            <Button
              icon={<CopyOutlined />}
              disabled={!outText}
              onClick={() => { copyTextToClipboard(outText); message.success('已复制'); }}
            >
              复制结果
            </Button>
            {outFormat === 'json' && (
              <Text type="secondary" style={{ fontSize: 12 }}>{'JSON 结构: [{"start":毫秒,"end":毫秒,"text":"文本"}]'}</Text>
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
              <Paragraph type="secondary" style={{ marginBottom: 4 }}>内容预览 (前 {Math.min(rows.length, 200)} 条)</Paragraph>
              <Table<PreviewRow>
                size="small"
                columns={previewColumns}
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
