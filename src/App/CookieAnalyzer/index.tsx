import { Alert, Button, Card, Segmented, Space, Table, Tag, Typography, message } from 'antd';
import { CopyOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { Input } from 'antd';
import {
  detectCookieInput, parseCookies, cookiesToMap, cookiesToArray, cookiesToHeader,
} from './lib';
import type { CookieItem } from './lib';
import { useLocale } from '../../hook/locale-context';
import { wm, wmT } from './lang';

const { Text, Paragraph } = Typography;

const SAMPLE_STRING = 'sessionid=abc123xyz; theme=dark; lang=zh-CN; csrftoken=Kq6v3XaB2yQpW1uR9mT0';

const SAMPLE_HEADERS = [
  'GET /api/user HTTP/1.1',
  'Host: www.example.com',
  'Cookie: sessionid=abc123xyz; theme=dark; lang=zh-CN',
  '',
  'HTTP/1.1 200 OK',
  'Content-Type: text/html; charset=utf-8',
  'Set-Cookie: sid=xyz789qwerty; Path=/; Domain=.example.com; HttpOnly; Secure; SameSite=Lax; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
  'Set-Cookie: lang=zh-CN; Path=/; Max-Age=31536000',
  'Set-Cookie: _ga=GA1.2.1234567890.1710000000; Path=/; Secure',
].join('\n');

const SAMPLE_DOCUMENT = [
  '// 登录成功后写入',
  'document.cookie = "sid=xyz789qwerty; Path=/; SameSite=Lax";',
  'document.cookie = "theme=dark; Max-Age=86400";',
].join('\n');

const KIND_LABEL: Record<string, string> = {
  string: 'Cookie 字符串',
  headers: 'HTTP Headers',
  document: 'document.cookie',
};

const BoolTag: React.FC<{ v: boolean | undefined; yes?: string }> = ({ v, yes = '是' }) =>
  v ? <Tag color="green">{yes}</Tag> : <Tag>—</Tag>;

const CookieAnalyzer: React.FC = () => {
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
  const [raw, setRaw] = useState('');
  const [format, setFormat] = useState<'map' | 'array' | 'table'>('table');

  const { kind, items } = useMemo(() => parseCookies(raw), [raw]);
  const mapJson = useMemo(() => (items.length ? JSON.stringify(cookiesToMap(items), null, 2) : ''), [items]);
  const arrayJson = useMemo(() => (items.length ? JSON.stringify(cookiesToArray(items), null, 2) : ''), [items]);
  const headerText = useMemo(() => cookiesToHeader(items), [items]);

  const loadSample = (kind: 'string' | 'headers' | 'document') => {
    setRaw(kind === 'string' ? SAMPLE_STRING : kind === 'headers' ? SAMPLE_HEADERS : SAMPLE_DOCUMENT);
    message.info(tt('已载入 {label} 示例', { label: t(KIND_LABEL[kind]) }));
  };

  const columns: ColumnsType<CookieItem> = [
    { title: t('名称'), dataIndex: 'name', key: 'name', ellipsis: true, width: 150 },
    { title: t('值'), dataIndex: 'value', key: 'value', ellipsis: true },
    {
      title: t('来源'), dataIndex: 'source', key: 'source', width: 90,
      render: (v: string) => (v === 'headers'
        ? <Tag color="blue">Headers</Tag>
        : <Tag color="purple">{t('字符串')}</Tag>),
    },
    { title: 'Domain', dataIndex: 'domain', key: 'domain', width: 140, ellipsis: true, render: (v?: string) => v || <Text type="secondary">—</Text> },
    { title: 'Path', dataIndex: 'path', key: 'path', width: 100, ellipsis: true, render: (v?: string) => v || <Text type="secondary">—</Text> },
    { title: 'Expires', dataIndex: 'expires', key: 'expires', width: 190, ellipsis: true, render: (v?: string) => v || <Text type="secondary">{t('会话')}</Text> },
    { title: 'Max-Age', dataIndex: 'maxAge', key: 'maxAge', width: 100, render: (v?: string) => v || <Text type="secondary">—</Text> },
    { title: 'SameSite', dataIndex: 'sameSite', key: 'sameSite', width: 100, render: (v?: string) => (v ? <Tag color="cyan">{v}</Tag> : <Text type="secondary">—</Text>) },
    {
      title: 'Secure', dataIndex: 'secure', key: 'secure', width: 84, align: 'center',
      render: (v: boolean) => <BoolTag v={v} yes={t('是')} />,
    },
    {
      title: 'HttpOnly', dataIndex: 'httpOnly', key: 'httpOnly', width: 96, align: 'center',
      render: (v: boolean) => <BoolTag v={v} yes={t('是')} />,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('Cookie 分析')}
        description={t('自动识别三种输入：Cookie 字符串、HTTP 请求/响应头（Cookie:/Set-Cookie: 行）、document.cookie 赋值语句。解析后可按 JSON 对象 / JSON 数组 / 表格三种视图查看，并一键拼回 Cookie 请求头。')}
      />
      <Card
        size="small"
        title={<Space><DatabaseOutlined /> {t('原始输入')}</Space>}
        extra={
          <Space size={8}>
            <Button size="small" onClick={() => loadSample('string')}>{t('Cookie 字符串')}</Button>
            <Button size="small" onClick={() => loadSample('headers')}>{t('HTTP Headers')}</Button>
            <Button size="small" onClick={() => loadSample('document')}>document.cookie</Button>
            <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
          </Space>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t('粘贴 Cookie 数据, 三种格式均可:\n\n1) sessionid=abc123; theme=dark; HttpOnly\n2) 含 Cookie: / Set-Cookie: 行的 HTTP 报文片段\n3) document.cookie = "a=1; b=2";')}
            autoSize={{ minRows: 7, maxRows: 16 }}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
          />
          {raw && (
            <Space size={8} wrap>
              <Tag color="blue">{tt('识别为 {k}', { k: t(KIND_LABEL[kind]) })}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {tt('{c} 字符', { c: raw.length.toLocaleString() })}
              </Text>
            </Space>
          )}
        </Space>
      </Card>

      <Card
        size="small"
        title={t('解析结果')}
        extra={
          <Space size={8}>
            <Button size="small" disabled={!items.length} icon={<CopyOutlined />} onClick={() => copyText(format === 'table' ? headerText : format === 'map' ? mapJson : arrayJson, t('已复制当前视图内容'))}>
              {format === 'table' ? t('复制 Cookie 串') : t('复制 JSON')}
            </Button>
            {format === 'table' && items.length > 0 && (
              <Button size="small" disabled={!items.length} icon={<CopyOutlined />} onClick={() => copyText(mapJson, t('已复制 name=value JSON'))}>{t('复制 JSON')}</Button>
            )}
          </Space>
        }
      >
        {items.length === 0 ? (
          <Paragraph type="secondary" style={{ margin: 0 }}>{t('暂无结果 — 粘贴 Cookie 数据后自动解析。若粘贴了 Cookie 头请确保带 Cookie: 前缀。')}</Paragraph>
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Segmented
              value={format}
              onChange={(v) => setFormat(v as typeof format)}
              options={[
                { label: tt('JSON 对象 ({n})', { n: items.length }), value: 'map' },
                { label: tt('JSON 数组 ({n})', { n: items.length }), value: 'array' },
                { label: tt('表格 ({n})', { n: items.length }), value: 'table' },
              ]}
            />
            {format === 'table' ? (
              <Table<CookieItem>
                size="small"
                rowKey={(r, i) => `${r.name}-${i}`}
                columns={columns}
                dataSource={items}
                pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
                scroll={{ x: 1100 }}
              />
            ) : (
              <Input.TextArea
                value={format === 'map' ? mapJson : arrayJson}
                readOnly
                autoSize={{ minRows: 8, maxRows: 20 }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12 }}
              />
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {tt('共解析 {n} 个 Cookie；拼接请求头: ', { n: items.length })}<Text code>{headerText || '—'}</Text>
            </Text>
          </Space>
        )}
      </Card>
    </Space>
  );
};

export default CookieAnalyzer;
