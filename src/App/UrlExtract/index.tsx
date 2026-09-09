import { Alert, Button, Card, Checkbox, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from "../../hook/locale-context";
import { wm, wmT } from "../webmaster-lang";
import { extractUrls, urlsToText, getUrlDedupeDefault, setUrlDedupeDefault, URL_DEDUPE_CHANGED } from './lib';

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
  const { locale } = useLocale();
  const t = (zh: string) => wm(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => wmT(locale, zh, v);
  const [raw, setRaw] = useState('');
  const [dedupe, setDedupe] = useState<boolean>(() => getUrlDedupeDefault()); // 默认取设置 (默认开启)
  const [httpOnly, setHttpOnly] = useState(false);

  // 设置页修改默认值后, 已打开的工具页即时同步勾选状态
  useEffect(() => {
    const onChanged = () => setDedupe(getUrlDedupeDefault());
    window.addEventListener(URL_DEDUPE_CHANGED, onChanged);
    return () => window.removeEventListener(URL_DEDUPE_CHANGED, onChanged);
  }, []);

  const urls = useMemo(() => extractUrls(raw, { dedupe, httpOnly }), [raw, dedupe, httpOnly]);
  const resultText = useMemo(() => urlsToText(urls), [urls]);

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      message.success(tt('已复制 {n} 个 URL', { n: urls.length }));
    } catch {
      message.error(t('复制失败, 请手动全选复制'));
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
    message.success(t('已下载 urls.txt'));
  };

  const rawCount = useMemo(() => extractUrls(raw, { dedupe: false }).length, [raw]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('URL 提取')}
        description={t('从任意文本（日志、邮件、页面源码…）中批量提取链接。自动清理行尾句读标点与不成对括号；「去重」默认开启，可在 设置 → 站长工具 中调整默认值。')}
      />
      <Card size="small" title={<Space><LinkOutlined /> {t('原始文本')}</Space>} extra={
        <Space size={8}>
          <Button size="small" onClick={() => { setRaw(SAMPLE); message.info(t('已载入示例文本')); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
        </Space>
      }>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t('在此粘贴文本…\n\n支持任意协议链接 (http/https/ftp 等), 自动清除句尾标点与不成对括号。')}
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
          />
          <Space size={16} wrap>
            <Checkbox
              checked={dedupe}
              onChange={(e) => {
                const v = e.target.checked;
                setDedupe(v);
                setUrlDedupeDefault(v); // 工具页内切换同时写入默认设置
              }}
            >{t('去重')}</Checkbox>
            <Checkbox checked={httpOnly} onChange={(e) => setHttpOnly(e.target.checked)}>{t('仅 http/https')}</Checkbox>
            {raw && <Text type="secondary" style={{ fontSize: 12 }}>{tt('原文 {c} 字符, 检出 {n} 条 (去重前)', { c: raw.length.toLocaleString(), n: rawCount.toLocaleString() })}</Text>}
          </Space>
        </Space>
      </Card>

      <Card size="small" title={t('提取结果')} extra={
        <Space size={8}>
          <Button size="small" icon={<CopyOutlined />} disabled={!urls.length} onClick={copyOut}>{t('复制')}</Button>
          <Button size="small" icon={<DownloadOutlined />} disabled={!urls.length} onClick={downloadOut}>{t('下载 .txt')}</Button>
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
              <Tag color="green">{tt('提取 {n} 个 URL', { n: urls.length })}</Tag>
              {dedupe && rawCount > urls.length && <Tag>{tt('已去重 {n} 条', { n: rawCount - urls.length })}</Tag>}
            </Space>
          </Space>
        ) : (
          <Paragraph type="secondary" style={{ margin: 0 }}>{t('暂无结果 — 在上方粘贴包含链接的文本后自动提取。')}</Paragraph>
        )}
      </Card>
    </Space>
  );
};

export default UrlExtract;
