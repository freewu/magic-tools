import { Alert, Button, Card, Input, Radio, Space, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { formatHtml, getHtmlIndent } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';

const { Text } = Typography;

const SAMPLE = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>示例</title></head>
<body><header><h1>标题</h1><nav><ul><li><a href="/">首页</a></li><li><a href="/about">关于</a></li></ul></nav></header>
<main><section><h2>简介</h2><p>这是<b>加粗</b>与<i>斜体</i>混排的<em>段落</em>内容，长度随意。</p></section>
<div class="card"><img src="a.png" alt="图片"><span>说明文字</span><!-- 注释保留 --></div></main>
<footer><p>© 2024 MagicTools</p></footer></body></html>`;

const HtmlFormat: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);

  const [raw, setRaw] = useState('');
  const [indent, setIndent] = useState<number>(() => getHtmlIndent());
  const result = useMemo(() => {
    try {
      return formatHtml(raw, { indentSize: indent });
    } catch {
      return '';
    }
  }, [raw, indent]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
    } catch { /* ignore */ }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('HTML 格式化')}
        description={t('美化格式化 HTML 代码: 块级元素缩进换行、行内元素保留在一行、文本空白自动折叠。script / style / pre / textarea 内容原样保留。缩进空格数可在右侧或「设置 → 格式化」中切换 2 / 4 空格。')}
      />
      <Card size="small" title={t('HTML 源码')} extra={
        <Space size={8}>
          <Radio.Group
            size="small"
            value={indent}
            onChange={(e) => setIndent(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[{ label: t('2 空格'), value: 2 }, { label: t('4 空格'), value: 4 }]}
          />
          <Button size="small" onClick={() => { setRaw(SAMPLE); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
        </Space>
      }>
        <Input.TextArea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t('粘贴 HTML 代码…') + '\n' + t('如: <div><p>你好</p></div>')}
          autoSize={{ minRows: 8, maxRows: 16 }}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
        />
      </Card>
      <Card size="small" title={t('格式化结果')} extra={
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>{tt('{n} 字符', { n: result.length })}</Text>
          <Button size="small" icon={<CopyOutlined />} disabled={!result} onClick={copy}>{t('复制')}</Button>
        </Space>
      }>
        {result ? (
          <Input.TextArea
            value={result}
            readOnly
            autoSize={{ minRows: 8, maxRows: 20 }}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
          />
        ) : (
          t('暂无结果 — 输入 HTML 后自动格式化。')
        )}
      </Card>
    </Space>
  );
};

export default HtmlFormat;
