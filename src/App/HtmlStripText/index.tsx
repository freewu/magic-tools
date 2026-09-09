import { Alert, Button, Card, Checkbox, Input, Space, Tag, Typography, Upload, message } from 'antd';
import { CopyOutlined, DownloadOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import { useLocale } from "../../hook/locale-context";
import { wm, wmT } from './lang';
import { htmlToPlainText } from './lib';

const { Text, Paragraph } = Typography;

const SAMPLE_HTML = [
  '<!DOCTYPE html>',
  '<html lang="zh"><head><meta charset="utf-8"><title>示例页面</title>',
  '<style>p{color:#333}</style></head>',
  '<body>',
  '  <h1>活动报名表单说明</h1>',
  '  <p>请阅读以下<strong>注意事项</strong>, 然后选择<em>参与城市</em>。</p>',
  '  <ul>',
  '    <li>报名截止时间为本周五 18:00</li>',
  '    <li>每人限报一场</li>',
  '  </ul>',
  '  <div>所在城市: <select>',
  '    <option value="beijing">北京</option>',
  '    <option value="shanghai" selected>上海</option>',
  '    <option value="guangzhou">广州</option>',
  '  </select></div>',
  '  <p>联系邮箱: <a href="mailto:hi@example.com">hi@example.com</a> &amp; 客服电话 400-123-4567</p>',
  '  <textarea rows="2">补充说明: 请自带水杯&#10;现场提供茶歇</textarea>',
  '  <!-- 统计脚本 -->',
  '  <script>window._gaq = []; /* 页面统计 */</script>',
  '</body>',
  '</html>',
].join('\n');

const HtmlStripText: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => wm(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => wmT(locale, zh, v);
  const [raw, setRaw] = useState('');
  const [selectValue, setSelectValue] = useState(true);
  const outRef = useRef<HTMLTextAreaElement>(null);

  const result = useMemo(() => htmlToPlainText(raw, { selectValue }), [raw, selectValue]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      setRaw(content);
      message.success(tt('已载入文件 {name} ({c} 字符)', { name: file.name, c: content.length }));
    };
    reader.onerror = () => message.error(t('文件读取失败'));
    reader.readAsText(file);
    return false;
  };

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(result);
      message.success(t('已复制提取结果'));
    } catch {
      message.error(t('复制失败, 请手动全选复制'));
    }
  };

  const downloadOut = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
    message.success(t('已下载 extracted-text.txt'));
  };

  const rawLines = raw ? raw.split('\n').length : 0;
  const outLines = result ? result.split('\n').length : 0;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('HTML 标签去除')}
        description={
          <>
            {t('去掉 HTML 标签只保留文本内容, 并按段落 / 列表 / 表格结构保留换行。')}<br />
            <Text strong>{t('select 下拉框')}</Text>{t(': 默认把每个 ')}{'<option>'}{t(' 提取为')}
            <Text code>{t('value: 文本')}</Text>{t(' 一行(如 ')}<Text code>cn: 中国</Text>
            {t('), 避免下拉选项文本粘连丢失。')}{t('script / style / 注释等内容自动剔除。')}
          </>
        }
      />

      <Card size="small" title={
        <Space><FileTextOutlined /> {t('原始 HTML')}</Space>
      } extra={
        <Space size={8}>
          <Upload accept=".html,.htm,.txt,.xml" showUploadList={false} beforeUpload={(f) => handleFile(f)}>
            <Button size="small" icon={<UploadOutlined />}>{t('读取文件')}</Button>
          </Upload>
          <Button size="small" onClick={() => { setRaw(SAMPLE_HTML); message.info(t('已载入示例 HTML')); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
        </Space>
      }>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t('在此粘贴 HTML 源码…\n\n例如: <p>Hello <b>World</b></p>')}
            autoSize={{ minRows: 8, maxRows: 18 }}
          />
          <Checkbox checked={selectValue} onChange={(e) => setSelectValue(e.target.checked)}>
            {t('select 下拉框选项提取为')} <Text code>{t('value: 文本')}</Text>{t(' 行')}
          </Checkbox>
          {raw && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {tt('原始 {c} 字符 / {n} 行', { c: raw.length.toLocaleString(), n: rawLines })}
            </Text>
          )}
        </Space>
      </Card>

      <Card size="small" title={t('提取结果 (纯文本)')} extra={
        <Space size={8}>
          <Button size="small" icon={<CopyOutlined />} disabled={!result} onClick={copyOut}>{t('复制')}</Button>
          <Button size="small" icon={<DownloadOutlined />} disabled={!result} onClick={downloadOut}>{t('下载 .txt')}</Button>
        </Space>
      }>
        {result ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Input.TextArea
              ref={outRef}
              value={result}
              readOnly
              autoSize={{ minRows: 8, maxRows: 18 }}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
            />
            <Space size={8} wrap>
              <Tag color="green">{tt('提取后 {c} 字符', { c: result.length.toLocaleString() })}</Tag>
              <Tag>{tt('{n} 行', { n: outLines })}</Tag>
            </Space>
          </Space>
        ) : (
          <Paragraph type="secondary" style={{ margin: 0 }}>{t('暂无结果 — 在上方粘贴 HTML 后会自动提取。')}</Paragraph>
        )}
      </Card>
    </Space>
  );
};

export default HtmlStripText;
