import { Alert, Button, Card, Checkbox, Col, Input, Progress, Row, Space, Table, Tag, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import {
  analyzeText, buildTermTable, keywordsReport, levelLabel, LEVEL_COLOR,
} from './lib';
import type { KeywordReport, TermStat } from './lib';

const { Text } = Typography;

const SAMPLE = `关键词密度 Keyword Density 是 SEO 优化的基础指标, 用于衡量某个关键词在页面文本中的占比。

统计关键词密度 (Keyword Density) 时, 搜索引擎 (Search Engine) 会同时分析正文、标题与描述 (Meta Description)。
一般建议把核心关键词 (Keyword) 控制在 0.5% ~ 2.5% 之间, 过低难以让引擎识别主题, 过高则可能被判定为关键词堆砌 (Keyword Stuffing)。

提示 Tips: 中文文本无需空格分词, 可直接统计任意词组出现次数; 英文按单词边界匹配, 大小写不敏感。
建议在标题 (Title)、H1、首段与图片 Alt 中自然地使用目标关键词。`;

const copyText = async (text: string, tip = '已复制') => {
  try {
    await navigator.clipboard.writeText(text);
    message.success(tip);
  } catch {
    message.error('复制失败, 请手动选择复制');
  }
};

const KeywordDensity: React.FC = () => {
  const [text, setText] = useState(SAMPLE);
  const [kwInput, setKwInput] = useState('关键词密度, seo, keyword');
  const [stopwords, setStopwords] = useState(true);

  const stats = useMemo(() => analyzeText(text), [text]);
  const table = useMemo(() => buildTermTable(text, { stopwords, minLen: 2 }), [text, stopwords]);
  const kws: string[] = useMemo(() => kwInput.split(/[,，;；\n]+/).map((s) => s.trim()).filter(Boolean), [kwInput]);
  const reports: KeywordReport[] = useMemo(() => keywordsReport(text, kws), [text, kws]);

  const columns: ColumnsType<TermStat> = [
    { title: '单词', dataIndex: 'term', key: 'term' },
    { title: '次数', dataIndex: 'count', key: 'count', width: 90, sorter: (a, b) => a.count - b.count },
    {
      title: '密度 %', dataIndex: 'density', key: 'density', width: 110,
      sorter: (a, b) => a.density - b.density,
      render: (d: number) => d.toFixed(2),
    },
  ];
  const csv = ['term,count,density', ...table.map((r) => `${r.term},${r.count},${r.density.toFixed(2)}`)].join('\n');

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="关键词密度"
        description={
          <>
            密度 = 出现次数 × 关键词字符数 ÷ 有效字符总数 × 100% (有效字符不含空白与标点)。
            左侧输入文本, 下方可同时分析多个关键词(逗号分隔); 词频表按英文单词统计。
          </>
        }
      />
      <Card
        size="small"
        title="文本与关键词"
        extra={
          <Space size={8}>
            <Button size="small" onClick={() => setText(SAMPLE)}>载入示例</Button>
            <Button size="small" danger disabled={!text} onClick={() => setText('')}>清空</Button>
          </Space>
        }
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴要分析的页面文本 / 文章正文…"
            autoSize={{ minRows: 7, maxRows: 16 }}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13, lineHeight: 1.7 }}
          />
          <Space size={12} wrap>
            <Tag color="blue">有效字符 {stats.totalChars}</Tag>
            <Tag>英文词 {stats.latinWords}</Tag>
            <Tag>汉字 {stats.hanChars}</Tag>
            <Tag>段落 {stats.paragraphs}</Tag>
            <Tag>句子 {stats.sentences}</Tag>
          </Space>
          <Input
            addonBefore="关键词"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            placeholder="多个关键词用逗号分隔, 例如: seo, 关键词密度, 数据分析"
            allowClear
          />
        </Space>
      </Card>

      {reports.length > 0 && (
        <Card size="small" title="关键词密度报告">
          <Row gutter={[12, 12]}>
            {reports.map((r) => (
              <Col key={r.keyword} xs={24} sm={12} md={8} lg={6}>
                <Card size="small" style={{ height: '100%' }}>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong ellipsis style={{ maxWidth: 130 }}>{r.keyword}</Text>
                      <Tag color={LEVEL_COLOR[r.level]}>{levelLabel(r.level)}</Tag>
                    </Space>
                    <Space align="center" size={12}>
                      <Progress
                        type="circle"
                        percent={Math.min(100, Math.round((r.density / 6) * 100))}
                        size={52}
                        format={() => `${r.density}%`}
                        strokeColor={r.level === 'over' ? '#f5222d' : r.level === 'high' ? '#faad14' : r.level === 'normal' ? '#52c41a' : '#fa8c16'}
                      />
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: 12 }}>出现 {r.occurrences} 次</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>有效字符 {r.totalChars}</Text>
                      </Space>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>建议区间 0.5% ~ 3%</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card
        size="small"
        title={<Space>英文词频 Top 50 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>(词频按英文单词统计, 中文词组请用上方关键词密度)</Text></Space>}
        extra={
          <Space size={12}>
            <Checkbox checked={stopwords} onChange={(e) => setStopwords(e.target.checked)}>忽略停用词</Checkbox>
            <Button size="small" icon={<CopyOutlined />} disabled={!table.length} onClick={() => copyText(csv, '已复制词频 CSV')}>复制 CSV</Button>
          </Space>
        }
      >
        {table.length ? (
          <Table<TermStat>
            rowKey="term"
            columns={columns}
            dataSource={table.slice(0, 50)}
            size="small"
            pagination={false}
            scroll={{ y: 360 }}
          />
        ) : (
          <Text type="secondary">暂无英文单词 — 中文文本请使用上方关键词分析。</Text>
        )}
      </Card>
    </Space>
  );
};

export default KeywordDensity;
