import { Alert, Button, Card, Input, Radio, Space, Spin, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, FileImageOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { optimizeSvgXml } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from '../ui-lang';
import type { SvgMode } from './lib';

const { Text } = Typography;

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- 示例: 含注释、多余分组与冗余属性 -->
  <g id="wrapper">
    <rect width="120" height="120" fill="#1677ff" id="bg"/>
    <circle cx="60" cy="60" r="36" fill="#fff"/>
    <path d="M44 60 l12 12 l22 -26" fill="none" stroke="#1677ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="extra"><text x="60" y="104" font-size="12" text-anchor="middle" fill="#fff">MagicTools</text></g>
  </g>
</svg>`;

const SvgFormat: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [raw, setRaw] = useState('');
  const [mode, setMode] = useState<SvgMode>('min');
  const [result, setResult] = useState<{ data: string; beforeBytes: number; afterBytes: number } | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!raw.trim()) { setResult(null); setErr(''); return; }
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await optimizeSvgXml(raw, mode);
      setLoading(false);
      if (r.ok) { setResult({ data: r.data, beforeBytes: r.beforeBytes ?? 0, afterBytes: r.afterBytes ?? 0 }); setErr(''); }
      else { setResult(null); setErr(r.error || '优化失败'); }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [raw, mode]);

  const previewUrl = useMemo(() => {
    if (!result?.data) return '';
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.data)}`;
  }, [result]);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setRaw(text);
      message.success(tt('已读取 {name} ({c} 字符)', { name: file.name, c: text.length }));
    };
    reader.readAsText(file);
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.data); message.success(t('已复制')); } catch { /* ignore */ }
  };

  const saved = result ? result.beforeBytes - result.afterBytes : 0;
  const savedPct = result && result.beforeBytes > 0 ? Math.round((saved / result.beforeBytes) * 100) : 0;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('SVG 格式化 / 压缩')}
        description={t('基于 SVGO 引擎处理 SVG: 去除注释、冗余属性、多余分组并优化路径等。可「美化」为多行缩进或「压缩」为单行最小体积, 适合发布到网页前瘦身。')}
      />
      <Card size="small" title={t('SVG 源码')} extra={
        <Space size={8}>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
          />
          <Button size="small" icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>{t('读取 .svg 文件')}</Button>
          <Button size="small" onClick={() => setRaw(SAMPLE_SVG)}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => setRaw('')}>{t('清空')}</Button>
        </Space>
      }>
        <Input.TextArea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t('粘贴 SVG 代码, 或读取本地 .svg 文件…')}
          autoSize={{ minRows: 9, maxRows: 18 }}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
        />
      </Card>

      <Card size="small" title={t('优化选项与结果')} extra={
        <Radio.Group
          size="small"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: t('压缩 (单行)'), value: 'min' },
            { label: t('美化 (多行)'), value: 'pretty' },
          ]}
        />
      }>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin tip={t('优化中…')}><FileImageOutlined style={{ fontSize: 32 }} /></Spin></div>
        ) : err ? (
          <Alert type="error" showIcon message={t('处理失败')} description={err} />
        ) : result ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap size={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {result.beforeBytes.toLocaleString()} B → <Text strong style={{ color: saved >= 0 ? '#52c41a' : undefined }}>{result.afterBytes.toLocaleString()} B</Text>
              </Text>
              {saved > 0 && <Tag color="green">{tt('节省 {a} B ({p}%)', { a: saved.toLocaleString(), p: savedPct })}</Tag>}
              {saved <= 0 && <Tag>{t('体积无变化')}</Tag>}
              <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t('复制')}</Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={download}>{t('下载 .svg')}</Button>
            </Space>
            <Input.TextArea
              value={result.data}
              readOnly
              autoSize={{ minRows: 7, maxRows: 16 }}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
            />
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{t('预览:')}</Text>
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 12, display: 'inline-block', background: '#fff' }}>
                <img src={previewUrl} alt={t('SVG 预览')} style={{ maxWidth: 220, maxHeight: 220 }} />
              </div>
            </div>
          </Space>
        ) : (
          <Text type="secondary">{t('输入 SVG 后自动优化。文件 → 网络: 平均可缩小 30%~60%。')}</Text>
        )}
      </Card>
    </Space>
  );
};

export default SvgFormat;
