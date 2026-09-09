import { Alert, Button, Card, Input, Segmented, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { formatXml, getXmlIndent, setXmlIndent } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';

const { Text, Paragraph } = Typography;

const SAMPLE_XML = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<catalog>',
  '  <!-- 图书目录示例 -->',
  '  <book id="bk101">',
  '    <author>赵 工</author>',
  '    <title>XML 开发实战</title>',
  '    <price>59.00</price>',
  '    <tags><tag>xml</tag><tag>入门</tag></tags>',
  '    <summary>',
  '      一本介绍 XML 格式化与解析的入门书。',
  '    </summary>',
  '    <metadata>',
  '      <![CDATA[',
  '      <raw>内容原样保留 & 无需转义</raw>',
  '      ]]>',
  '    </metadata>',
  '  </book>',
  '  <book id="bk102">',
  '    <author>李 工</author>',
  '    <title>数据交换格式</title>',
  '    <price>49.00</price>',
  '    <enabled>true</enabled>',
  '  </book>',
  '</catalog>',
].join('\n');

const XmlFormatter: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [raw, setRaw] = useState('');
  const [indent, setIndent] = useState<number>(() => getXmlIndent());
  const [error, setError] = useState('');

  const result = useMemo(() => {
    if (!raw.trim()) { setError(''); return ''; }
    try {
      const out = formatXml(raw, { indentSize: indent });
      setError('');
      return out;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return '';
    }
  }, [raw, indent]);

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(result);
      message.success(t('已复制格式化结果'));
    } catch {
      message.error(t('复制失败, 请手动全选复制'));
    }
  };

  const downloadOut = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.xml';
    a.click();
    URL.revokeObjectURL(url);
    message.success(t('已下载 formatted.xml'));
  };

  const rawLines = raw ? raw.split('\n').length : 0;
  const outLines = result ? result.split('\n').length : 0;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('XML 格式化')}
        description={t('XML / XAML / SVG / plist / 配置文件美化缩进，支持 XML 声明、注释、CDATA 与处理指令的保留。标签未闭合、交叉嵌套或多余闭合会给出带行号的错误提示。')}
      />
      <Card size="small" title={<Space><FileTextOutlined /> {t('原始 XML')}</Space>} extra={
        <Space size={8}>
          <Segmented
            size="small"
            value={indent}
            onChange={(v) => { setIndent(v as number); setXmlIndent(v as number); }}
            options={[{ label: t('2 空格'), value: 2 }, { label: t('4 空格'), value: 4 }]}
          />
          <Button size="small" onClick={() => { setRaw(SAMPLE_XML); message.info(t('已载入示例 XML')); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
        </Space>
      }>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t('在此粘贴 XML 源码…') + '\n\n' + t('例如: <config><server host="127.0.0.1"/></config>')}
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12 }}
          />
          {raw && !error && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {tt('原始 {c} 字符 / {n} 行', { c: raw.length.toLocaleString(), n: rawLines })}
            </Text>
          )}
        </Space>
      </Card>

      {error ? (
        <Alert type="error" showIcon message={t('XML 语法错误')} description={error} />
      ) : (
        <Card size="small" title={t('格式化结果')} extra={
          <Space size={8}>
            <Button size="small" icon={<CopyOutlined />} disabled={!result} onClick={copyOut}>{t('复制')}</Button>
            <Button size="small" icon={<DownloadOutlined />} disabled={!result} onClick={downloadOut}>{t('下载 .xml')}</Button>
          </Space>
        }>
          {result ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Input.TextArea
                value={result}
                readOnly
                autoSize={{ minRows: 8, maxRows: 18 }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12 }}
              />
              <Space size={8} wrap>
                <Tag color="green">{tt('格式化后 {c} 字符', { c: result.length.toLocaleString() })}</Tag>
                <Tag>{tt('{n} 行', { n: outLines })}</Tag>
              </Space>
            </Space>
          ) : (
            <Paragraph type="secondary" style={{ margin: 0 }}>{t('暂无结果 — 在上方粘贴 XML 后自动格式化。')}</Paragraph>
          )}
        </Card>
      )}
    </Space>
  );
};

export default XmlFormatter;
