import { Alert, Button, Card, Input, Segmented, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import { XML_ACCEPT, formatXml, getXmlIndent, setXmlIndent, xmlFileNameOf } from './lib';
import { useLocale } from '../../hook/locale-context';
import { readTextFile } from '../../lib/file';
import { saveTextFile } from '../../lib/tauri';
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

/** 拖拽高亮: 把文件拖到页面上即可打开 */
const STAGE_CSS =
  '.xml-stage.xml-dragging::after { content: ""; position: absolute; inset: 6px; border-radius: 8px; pointer-events: none; border: 2px dashed var(--app-divider-text, #4c6cb3); }';

const XmlFormatter: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [raw, setRaw] = useState('');
  const [indent, setIndent] = useState<number>(() => getXmlIndent());
  const [error, setError] = useState('');
  // 打开过的本地文件名 (空表示没打开过): 保存时沿用它的名字与后缀
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  // ---- 打开本地文件: XML 一律按文本读入 ----
  const loadFile = async (file?: File | null) => {
    if (!file) return;
    try {
      setRaw(await readTextFile(file));
      setFileName(file.name);
      message.success(tt('已打开 {file}', { file: file.name }));
    } catch {
      message.error(t('打开文件失败'));
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    void loadFile(e.target.files?.[0]);
    // 清空 value: 同一个文件再选一次也能触发 change
    e.target.value = '';
  };

  /** 下载 = 弹系统保存对话框选目录/文件名 (纯网页版回退浏览器下载) */
  const downloadOut = async () => {
    if (!result) return;
    const name = xmlFileNameOf(fileName);
    try {
      const ok = await saveTextFile(name, result, t('保存 XML 文件'), {
        filterName: t('XML 文件'),
        extensions: ['xml', 'xaml', 'svg', 'plist', 'txt'],
      });
      if (ok) message.success(tt('已保存 {file}', { file: name }));
    } catch {
      message.error(t('保存失败'));
    }
  };

  const rawLines = raw ? raw.split('\n').length : 0;
  const outLines = result ? result.split('\n').length : 0;

  return (
    <div
      ref={stageRef}
      className={dragging ? 'xml-stage xml-dragging' : 'xml-stage'}
      style={{ position: 'relative' }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setDragging(true)}
      onDragLeave={(e) => {
        // 只有真正离开整块区域时才取消高亮 (子元素之间移动也会触发 dragleave)
        if (!stageRef.current?.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void loadFile(e.dataTransfer?.files?.[0]);
      }}
    >
    <style>{STAGE_CSS}</style>
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title={<Space><FileTextOutlined /> {t('原始 XML')}</Space>} extra={
        <Space size={8}>
          <input ref={fileRef} type="file" accept={XML_ACCEPT} style={{ display: 'none' }} onChange={onPickFile} />
          <Button size="small" icon={<FolderOpenOutlined />} onClick={() => fileRef.current?.click()}>{t('打开文件')}</Button>
          <Segmented
            size="small"
            value={indent}
            onChange={(v) => { setIndent(v as number); setXmlIndent(v as number); }}
            options={[{ label: t('2 空格'), value: 2 }, { label: t('4 空格'), value: 4 }]}
          />
          <Button size="small" onClick={() => { setRaw(SAMPLE_XML); setFileName(''); message.info(t('已载入示例 XML')); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => { setRaw(''); setFileName(''); }}>{t('清空')}</Button>
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
    </div>
  );
};

export default XmlFormatter;
