import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { spaceCnEn } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u } from '../ui-lang';

const { Text } = Typography;

const SAMPLE = [
  '我们使用 HTML5 和 CSS3 开发了 100 个 Web 应用, 支持 Python3.12 与 Node.js 18。',
  '你好world这是一个测试123结束。',
  '报告显示 CPU 使用率 45%, 磁盘 500GB, 已运行 uptime 3 天 2 小时。',
  'API 文档位于 https://example.com, 请参阅 README.md 文件。',
  '第1章 介绍了 TypeScript 与 React 18 的新特性, 例如 useMemo 钩子。',
].join('\n');

const CnEnSpacing: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);

  const [raw, setRaw] = useState('');
  const result = useMemo(() => spaceCnEn(raw), [raw]);
  const inserted = result.length - raw.length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      // 空提示避免 message 噪音
    } catch { /* ignore */ }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('中英文自动排版')}
        description={t('自动在中文与英文字母、数字之间插入空格（如 “使用HTML” → “使用 HTML”）。仅处理紧邻的混排边界：已存在的空格不会重复添加；标点符号、换行与段落结构不会被修改。')}
      />
      <Card size="small" title={t('待排版文本')} extra={
        <Space size={8}>
          <Button size="small" onClick={() => { setRaw(SAMPLE); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
        </Space>
      }>
        <Input.TextArea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t('粘贴中英混排文本…')}
          autoSize={{ minRows: 6, maxRows: 14 }}
        />
      </Card>
      <Card size="small" title={t('排版结果')} extra={
        <Button size="small" icon={<CopyOutlined />} disabled={!result} onClick={copy}>{t('复制')}</Button>
      }>
        {result ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Input.TextArea
              value={result}
              readOnly
              autoSize={{ minRows: 6, maxRows: 14 }}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('已插入 ')}<Text strong>{inserted}</Text>{t(' 个空格')}{inserted > 0 && <SwapOutlined style={{ marginLeft: 8 }} />}
            </Text>
          </Space>
        ) : (
          t('暂无结果 — 输入文本后自动排版。')
        )}
      </Card>
    </Space>
  );
};

export default CnEnSpacing;
