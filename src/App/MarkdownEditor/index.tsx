import { Alert, Button, Card, Input, Segmented, Space, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import { renderMarkdown, wrapExportHtml, MD_EXPORT_CSS } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';

const { Text } = Typography;

const SAMPLE = `# Markdown 编辑器示例

支持 **加粗**、*斜体*、~~删除线~~ 与 \`行内代码\`。

## 公式支持 (LaTeX 子集)

行内公式: 勾股定理 $a^2 + b^2 = c^2$, 欧拉公式 $e^{i\\pi} + 1 = 0$。

块级公式:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## 列表与嵌套

- 前端
  - React / Vue
  - TypeScript
- 后端
  1. Node.js
  2. Rust

## 表格

| 工具 | 类型 | 说明 |
| --- | --- | --- |
| Hash | 计算 | 哈希摘要 |
| JsonFormatter | 格式化 | JSON 美化 |

## 代码与引用

\`\`\`ts
// 类型安全的示例
interface Tool { name: string; type: 'formatter' | 'crypto'; }
\`\`\`

> 引用: 好记性不如烂笔头。

[magic-tools 文档](https://github.com) 与图片 ![logo](https://picsum.photos/seed/x/320/120)

---

由右侧 **导出 HTML** 可得到自带样式的完整文档。
`;

type Tool = { label: string; title: string; before?: string; after?: string; block?: string; type?: 'wrap' | 'block' };

const TOOLS: Tool[] = [
  { label: 'H1', title: '一级标题', block: '# ' },
  { label: 'H2', title: '二级标题', block: '## ' },
  { label: 'H3', title: '三级标题', block: '### ' },
  { label: 'B', title: '加粗', before: '**', after: '**' },
  { label: 'I', title: '斜体', before: '*', after: '*' },
  { label: 'S', title: '删除线', before: '~~', after: '~~' },
  { label: '`c`', title: '行内代码', before: '`', after: '`' },
  { label: '🔗', title: '链接 [文字](url)', before: '[', after: '](https://)' },
  { label: '🖼', title: '图片 ![alt](url)', before: '![', after: '](https://)' },
  { label: '• 列表', title: '无序列表', block: '- ' },
  { label: '1. 列表', title: '有序列表', block: '1. ' },
  { label: '▦ 表格', title: '插入表格', type: 'block', block: '| 列1 | 列2 |\n| --- | --- |\n| 值 | 值 |\n' },
  { label: '❝ 引用', title: '引用块', block: '> ' },
  { label: '</>', title: '代码块', type: 'block', block: '```ts\n// 代码\n```\n' },
  { label: '÷', title: '分隔线', block: '\n---\n' },
  { label: '$x$', title: '行内公式', before: '$', after: '$' },
  { label: '$$', title: '块级公式', type: 'block', block: '$$\n\\frac{}{}\n$$\n' },
];

const markdown = (text: string) => new Blob([text], { type: 'text/plain;charset=utf-8' });

const MarkdownEditor: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const copy = async (text: string, tip?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(tip ?? t('已复制'));
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };
  const download = (text: string, filename: string) => {
    const blob = markdown(text);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    message.success(tt('已下载 {file}', { file: filename }));
  };
  const [md, setMd] = useState(SAMPLE);
  const [view, setView] = useState<'preview' | 'html'>('preview');
  const [showPreview, setShowPreview] = useState(true); // 是否显示右侧预览/HTML 面板
  const taRef = useRef<{ textArea: HTMLTextAreaElement }>(null);

  const html = useMemo(() => renderMarkdown(md), [md]);

  const applyTool = (tool: Tool) => {
    const el = taRef.current?.textArea;
    const start = el ? el.selectionStart : md.length;
    const end = el ? el.selectionEnd : md.length;
    const sel = md.slice(start, end);
    const isLineStart = start === 0 || md[start - 1] === '\n';
    let next: string;
    if (tool.type === 'block' || (tool.block && !tool.before)) {
      // 块级插入: 自带换行, 避免与行内内容粘连
      const body = tool.block ?? '';
      const blockTxt = sel.trim() ? `\n${body}${sel}\n` : body;
      const prefix = isLineStart || /^\n/.test(body) ? '' : '\n';
      next = md.slice(0, start) + prefix + blockTxt + md.slice(end);
    } else {
      const before = tool.before ?? '';
      const after = tool.after ?? '';
      next = md.slice(0, start) + before + sel + after + md.slice(end);
    }
    setMd(next);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        const cursor = start + (tool.before ?? tool.block ?? '').length;
        el.setSelectionRange(cursor, cursor);
      }
    });
  };

  const statLines = md.length ? md.split('\n').length : 0;
  const statChars = md.length;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('Markdown 编辑器')}
        description={
          <>
            {t('左侧编写')} <Text code>Markdown</Text>{t(', 右侧实时预览(支持常用语法与行内 / 块级 LaTeX 公式子集); 可导出')} <Text code>.md</Text>{t(' 源文件或自带样式的独立 ')} <Text code>.html</Text>{t(' 文档。')}
          </>
        }
      />
      <Card
        size="small"
        title={t('工具栏 (光标处插入)')}
        extra={
          <Space size={8}>
            <Button size="small" onClick={() => { setMd(SAMPLE); message.info(t('已载入示例')); }}>{t('载入示例')}</Button>
            <Button size="small" danger disabled={!md} onClick={() => setMd('')}>{t('清空')}</Button>
          </Space>
        }
      >
        <Space size={4} wrap>
          {TOOLS.map((tool) => (
            <Tooltip key={tool.label + tool.title} title={t(tool.title)}>
              <Button size="small" type="text" style={{ fontSize: 13 }} onClick={() => applyTool(tool)}>{tool.label}</Button>
            </Tooltip>
          ))}
        </Space>
      </Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Card
          size="small"
          title={t('Markdown 源码')}
          style={{ flex: '1 1 360px', minWidth: 300 }}
          extra={
            <Space size={8}>
              <Tooltip title={t(showPreview ? '收起右侧预览, 专注编辑' : '恢复右侧预览面板')}>
                <Button
                  size="small"
                  icon={showPreview ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowPreview(!showPreview)}
                >{t(showPreview ? '隐藏预览' : '显示预览')}</Button>
              </Tooltip>
              <Text type="secondary" style={{ fontSize: 12 }}>{tt('{l} 行 / {c} 字符', { l: statLines, c: statChars })}</Text>
            </Space>
          }
        >
          <Input.TextArea
            ref={taRef as never}
            value={md}
            onChange={(e) => setMd(e.target.value)}
            autoSize={false}
            style={{ minHeight: 460, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
            placeholder={t('在此输入 Markdown…')}
          />
        </Card>
        {showPreview && (
          <Card
            size="small"
            title={t('预览')}
            style={{ flex: '1 1 380px', minWidth: 300 }}
            extra={
              <Space size={8}>
                <Segmented
                  size="small"
                  value={view}
                  onChange={(v) => setView(v as typeof view)}
                  options={[{ label: t('预览'), value: 'preview' }, { label: t('HTML 源码'), value: 'html' }]}
                />
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(view === 'preview' ? html : md, t('已复制预览 HTML'))}>{t('复制')}{view === 'preview' ? ' HTML' : ' ' + t('源文件')}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => download(md, 'markdown.md')}>.md</Button>
                <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => download(wrapExportHtml(html, `Markdown ${t('预览')}`), 'markdown.html')}>{t('导出 HTML')}</Button>
              </Space>
            }
          >
            {view === 'preview' ? (
              <div style={{ maxHeight: 520, overflow: 'auto' }}>
                <style>{MD_EXPORT_CSS}</style>
                <div className="md-preview" dangerouslySetInnerHTML={{ __html: html || '<p style="color:#999">(空内容)</p>' }} />
              </div>
            ) : (
              <Input.TextArea
                value={html}
                readOnly
                autoSize={false}
                style={{ minHeight: 460, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
              />
            )}
          </Card>
        )}
      </div>
    </Space>
  );
};

export default MarkdownEditor;
