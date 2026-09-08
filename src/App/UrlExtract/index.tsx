import { Alert, Button, Card, Checkbox, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import { extractUrls, urlsToText } from './lib';

const { Text, Paragraph } = Typography;

const SAMPLE = `【公告】新版下载地址已迁移:
- 主站: https://www.example.com/download
- 文档: https://docs.example.com/api/v2  (点击直达)
- 备用镜像: http://mirror.example.com/soft.zip,
- GitHub: https://github.com/freewu/magic-tools
论坛里贴子还提到 https://en.wikipedia.org/wiki/JSON_(file_format) 和
https://example.com/search?q=magic+tools&lang=zh (同上一条重复也去重)
ftp 老地址: ftp://files.example.com/pub/readme.txt`;

const UrlExtract: React.FC = () => {
  const [raw, setRaw] = useState('');
  const [dedupe, setDedupe] = useState(true);
  const [httpOnly, setHttpOnly] = useState(false);

  const urls = useMemo(() => extractUrls(raw, { dedupe, httpOnly }), [raw, dedupe, httpOnly]);
  const resultText = useMemo(() => urlsToText(urls), [urls]);

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      message.success(`已复制 ${urls.length} 个 URL`);
    } catch {
      message.error('复制失败, 请手动全选复制');
    }
  };

  const downloadOut = () => {
    if (!urls.length) return;
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urls.txt';
    a.click();
    URL.revokeObjectURL(url);
    message.success('已下载 urls.txt');
  };

  const rawCount = useMemo(() => extractUrls(raw, { dedupe: false }).length, [raw]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="URL 提取"
        description="从任意文本（日志、邮件、页面源码…）中批量提取链接。自动清理行尾句读标点与不成对括号，勾选「去重」可去掉重复 URL（按出现顺序保留首个）。"
      />
      <Card size="small" title={<Space><LinkOutlined /> 原始文本</Space>} extra={
        <Space size={8}>
          <Button size="small" onClick={() => { setRaw(SAMPLE); message.info('已载入示例文本'); }}>载入示例</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>清空</Button>
        </Space>
      }>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'在此粘贴文本…\n\n支持任意协议链接 (http/https/ftp 等), 自动清除句尾标点与不成对括号。'}
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
          />
          <Space size={16} wrap>
            <Checkbox checked={dedupe} onChange={(e) => setDedupe(e.target.checked)}>去重</Checkbox>
            <Checkbox checked={httpOnly} onChange={(e) => setHttpOnly(e.target.checked)}>仅 http/https</Checkbox>
            {raw && <Text type="secondary" style={{ fontSize: 12 }}>原文 {raw.length.toLocaleString()} 字符, 检出 {rawCount.toLocaleString()} 条 (去重前)</Text>}
          </Space>
        </Space>
      </Card>

      <Card size="small" title="提取结果" extra={
        <Space size={8}>
          <Button size="small" icon={<CopyOutlined />} disabled={!urls.length} onClick={copyOut}>复制</Button>
          <Button size="small" icon={<DownloadOutlined />} disabled={!urls.length} onClick={downloadOut}>下载 .txt</Button>
        </Space>
      }>
        {urls.length ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Input.TextArea
              value={resultText}
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
            />
            <Space size={8} wrap>
              <Tag color="green">提取 {urls.length} 个 URL</Tag>
              {dedupe && rawCount > urls.length && <Tag>已去重 {rawCount - urls.length} 条</Tag>}
            </Space>
          </Space>
        ) : (
          <Paragraph type="secondary" style={{ margin: 0 }}>暂无结果 — 在上方粘贴包含链接的文本后自动提取。</Paragraph>
        )}
      </Card>
    </Space>
  );
};

export default UrlExtract;
