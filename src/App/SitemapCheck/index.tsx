import { Alert, Button, Card, Input, Segmented, Space, Spin, Table, Tabs, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { isTauri } from '../../lib/tauri';
import { parseSitemap, entriesToCsv } from './lib';
import { useLocale } from '../../hook/locale-context';
import { wm, wmT } from '../webmaster-lang';
import type { SitemapEntry, SitemapReport } from './lib';

const { Text } = Typography;

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-01-10</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2025-01-08T09:30:00+08:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <!-- 缺少 lastmod / changefreq / priority 也可以 -->
  </url>
  <url>
    <loc>2025-02-30</loc>
  </url>
</urlset>`;

/** 抓取远程 sitemap 文本 (Tauri 桌面端走 Rust 命令) */
async function fetchXml(url: string): Promise<string> {
  if (/\.gz(?:$|\?)/i.test(url)) throw new Error('检测到 .gz 压缩包: 请先本地解压后粘贴内容');
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const page = await invoke<{ contentType: string | null; finalUrl: string; base64: string }>('fetch_url_body', { url });
    const bin = atob(page.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`服务器返回 HTTP ${resp.status}`);
  return resp.text();
}

const SitemapCheck: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => wm(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => wmT(locale, zh, v);
  const copyText = async (text: string, tip: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(tip);
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };
  const download = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    message.success(tt('已下载 {file}', { file: filename }));
  };
  const [mode, setMode] = useState<'paste' | 'url'>('paste');
  const [xmlText, setXmlText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);

  const report: SitemapReport = useMemo(() => (xmlText.trim() ? parseSitemap(xmlText) : {
    kind: null, entries: [], errors: [], warnings: [], duplicates: [], totalCount: 0, duplicateCount: 0,
  }), [xmlText]);

  const runFetch = async () => {
    const u = urlInput.trim();
    if (!u) { message.warning(t('请输入 sitemap 网址')); return; }
    if (!/^https?:\/\//i.test(u)) { message.warning(t('网址必须以 http:// 或 https:// 开头')); return; }
    setLoading(true);
    try {
      const text = await fetchXml(u);
      setXmlText(text);
      message.success(tt('已抓取 {c} 字符', { c: text.length.toLocaleString() }));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      const http = m.match(/^服务器返回 HTTP (\d+)$/);
      message.error(
        m.startsWith('检测到 .gz')
          ? t('检测到 .gz 压缩包: 请先本地解压后粘贴内容')
          : http
            ? tt('服务器返回 HTTP {code}', { code: http[1] })
            : m,
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<SitemapEntry> = [
    {
      title: 'loc (URL)', dataIndex: 'loc', key: 'loc', width: 460,
      render: (loc: string) => (loc.startsWith('http') ? (
        <a href={loc} target="_blank" rel="noopener noreferrer"><LinkOutlined /> {loc}</a>
      ) : <Text type="danger">{loc || t('(空)')}</Text>),
    },
    { title: 'lastmod', dataIndex: 'lastmod', key: 'lastmod', width: 200, render: (v?: string) => v || <Text type="secondary">—</Text> },
    { title: 'changefreq', dataIndex: 'changefreq', key: 'changefreq', width: 120, render: (v?: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'priority', dataIndex: 'priority', key: 'priority', width: 100,
      render: (v?: string) => {
        if (!v) return <Text type="secondary">—</Text>;
        const n = Number.parseFloat(v);
        return Number.isNaN(n) || n < 0 || n > 1 ? <Text type="danger">{v}</Text> : <Tag color="blue">{v}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('Sitemap 检查')}
        description={
          <>
            {t('校验 ')}<Text code>urlset</Text> / <Text code>sitemapindex</Text> {t('XML, 检查 URL 格式、')}<Text code>lastmod</Text>{t(' 日期、')}<Text code>changefreq</Text>{t(' 枚举、')}<Text code>priority</Text>{t(' 范围与重复 URL。')}
            {t('支持粘贴或直接抓取在线 sitemap (Tauri 桌面端无跨域限制)。')}
          </>
        }
      />
      <Card size="small" title={t('输入')}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as typeof mode)}
            options={[
              { label: t('粘贴 XML'), value: 'paste' },
              { label: t('抓取网址'), value: 'url' },
            ]}
          />
          {mode === 'paste' ? (
            <>
              <Input.TextArea
                value={xmlText}
                onChange={(e) => setXmlText(e.target.value)}
                placeholder={t('在此粘贴 sitemap.xml / sitemap index 的 XML 内容…')}
                autoSize={{ minRows: 8, maxRows: 16 }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
              />
              <Space size={8}>
                <Button size="small" onClick={() => setXmlText(SAMPLE)}>{t('载入示例')}</Button>
                <Button size="small" danger disabled={!xmlText} onClick={() => setXmlText('')}>{t('清空')}</Button>
              </Space>
            </>
          ) : (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<LinkOutlined />}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onPressEnter={runFetch}
                placeholder="https://example.com/sitemap.xml"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}
              />
              <Button type="primary" loading={loading} icon={<ReloadOutlined />} onClick={runFetch}>{t('抓取')}</Button>
            </Space.Compact>
          )}
        </Space>
      </Card>

      {xmlText.trim() && (
        <Spin spinning={loading}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small" title={t('检查结果')}>
              <Space size={12} wrap>
                <Tag color={report.kind ? 'green' : 'red'}>{report.kind === 'urlset' ? 'urlset' : report.kind === 'sitemapindex' ? 'sitemapindex' : t('无法识别')}</Tag>
                <Tag color="blue">{tt('条目 {n}', { n: report.totalCount })}</Tag>
                {report.duplicateCount > 0 && <Tag color="orange">{tt('重复 {n}', { n: report.duplicateCount })}</Tag>}
                {report.errors.length > 0 && <Tag color="red">{tt('错误 {n}', { n: report.errors.length })}</Tag>}
                {report.warnings.length > 0 && <Tag color="gold">{tt('告警 {n}', { n: report.warnings.length })}</Tag>}
                {report.entries.length > 0 && (
                  <>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(entriesToCsv(report.entries), t('已复制 CSV'))}>{t('复制 CSV')}</Button>
                    <Button size="small" icon={<DownloadOutlined />} onClick={() => download(entriesToCsv(report.entries), 'sitemap.csv')}>{t('下载 CSV')}</Button>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(JSON.stringify(report.entries, null, 2), t('已复制 JSON'))}>{t('复制 JSON')}</Button>
                  </>
                )}
              </Space>
              {report.errors.map((e) => <Alert key={e} style={{ marginTop: 8 }} type="error" showIcon message={e} />)}
              {report.warnings.slice(0, 20).map((w) => <Alert key={w} style={{ marginTop: 8 }} type="warning" showIcon message={w} />)}
              {report.warnings.length > 20 && <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>{tt('… 其余 {n} 条告警已省略', { n: report.warnings.length - 20 })}</Text>}
            </Card>
            {report.entries.length > 0 && (
              <Card size="small" title={tt('条目列表 ({n})', { n: report.entries.length })}>
                <Table<SitemapEntry>
                  rowKey={(r) => `${r.loc}-${r.lastmod ?? ''}`}
                  columns={columns}
                  dataSource={report.entries}
                  size="small"
                  pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => tt('共 {n} 条', { n: total }) }}
                  scroll={{ x: 900 }}
                />
              </Card>
            )}
          </Space>
        </Spin>
      )}
    </Space>
  );
};

export default SitemapCheck;
