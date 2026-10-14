import { Button, Card, Input, Segmented, Space, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, EyeInvisibleOutlined, EyeOutlined, FolderOpenOutlined, FullscreenExitOutlined, FullscreenOutlined, SaveOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderMarkdown, wrapExportHtml, htmlFileName, readTextFile, mdFileName, MD_ACCEPT, MD_DARK_CSS, MD_EXPORT_CSS } from './lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { useTheme } from '../../hook/theme-context';
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


// 全屏: 优先原生 Fullscreen API, 不可用 (内嵌 webview / 非用户手势) 时用窗口内全屏兜底 (与白板 / 思维导图同一套做法)
const EDITOR_CSS = `
.md-editor { position: relative; }
.md-editor-dragging::after {
  content: ''; position: absolute; inset: 6px; border-radius: 8px; pointer-events: none;
  border: 2px dashed var(--app-divider-text, #4c6cb3);
}
.md-editor-full {
  position: fixed; inset: 0; z-index: 1000; box-sizing: border-box;
  display: flex; flex-direction: column;
  padding: 12px; overflow: auto;
  background: var(--app-bg, #f0f2f5);
}
/* 全屏时: 工具栏保持原高, 源码 / 预览两栏平分并占满剩余高度 (各自内部滚动) */
.md-editor-full > .ant-space { flex: 1 1 auto; min-height: 0; }
.md-editor-full > .ant-space > .ant-space-item:last-child { flex: 1 1 auto; min-height: 0; display: flex; }
.md-editor-full .md-editor-main { flex: 1 1 auto; min-width: 0; min-height: 0; }
.md-editor-full .md-editor-main > .ant-card { display: flex; flex-direction: column; min-height: 0; }
.md-editor-full .md-editor-main > .ant-card > .ant-card-body {
  flex: 1 1 auto; min-height: 0; display: flex; overflow: hidden;
}
.md-editor-full .md-editor-main > .ant-card > .ant-card-body > * {
  flex: 1 1 auto; min-width: 0; min-height: 0;
}
`;

/** 全屏 API 在内嵌 webview / 老浏览器上可能不存在, 统一按可选处理 */
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** 退出原生全屏 (无原生全屏时什么也不做) */
const exitNativeFullscreen = () => {
  const doc = document as FullscreenDocument;
  if (!(doc.fullscreenElement ?? doc.webkitFullscreenElement)) return;
  try {
    const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
    void Promise.resolve(exit?.()).catch(() => undefined);
  } catch {
    /* 忽略 */
  }
};

const MarkdownEditor: React.FC = () => {
  const { locale } = useLocale();
  const { isDark } = useTheme();
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
  /** 保存到文件: 桌面端弹系统保存对话框 (可选目录与文件名), 纯网页回退为浏览器下载 */
  const saveAs = async (name: string, content: string, title: string, filterName: string, extensions: string[]) => {
    try {
      const ok = await saveTextFile(name, content, title, { filterName, extensions });
      if (ok) message.success(tt('已保存 {file}', { file: name }));
    } catch {
      message.error(t('保存失败'));
    }
  };
  /** 保存 Markdown 源文件 (.md) */
  const saveMd = () => void saveAs(fileName, md, t('保存 Markdown'), t('Markdown 文件'), [ 'md', 'markdown', 'txt' ]);
  /** 导出带样式的独立 HTML 文档 (文件名跟随当前 .md 文件) */
  const exportHtml = () => void saveAs(htmlFileName(fileName), wrapExportHtml(html, `Markdown ${t('预览')}`), t('导出 HTML'), t('HTML 文件'), [ 'html', 'htm' ]);
  const [md, setMd] = useState(SAMPLE);
  const [view, setView] = useState<'preview' | 'html'>('preview');
  const [showPreview, setShowPreview] = useState(true); // 是否显示右侧预览/HTML 面板
  const taRef = useRef<{ textArea: HTMLTextAreaElement }>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // 当前编辑的文件名 (打开文件后作为保存的默认名)
  const [fileName, setFileName] = useState('markdown.md');
  const [dragging, setDragging] = useState(false); // 拖拽文件悬停中

  /** 打开本地 .md 文件: 点击「打开文件」选择, 或直接把文件拖到编辑区 */
  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readTextFile(file);
      setMd(text);
      setFileName(mdFileName(file.name));
      message.success(tt('已打开 {file}', { file: file.name }));
    } catch {
      message.error(t('打开文件失败'));
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 清空 value, 允许连续打开同一个文件
    void loadFile(file);
  };

  // ---- 全屏 ----
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const enterFull = useCallback(() => {
    setFull(true);
    const el = rootRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try {
      void Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略: 已有 CSS 全屏兜底 */
    }
  }, []);
  const exitFull = useCallback(() => {
    setFull(false);
    exitNativeFullscreen();
  }, []);
  // 浏览器 (含 Esc / F11) 退出原生全屏时同步状态, 避免按钮卡在「退出全屏」
  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDocument;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) setFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);
  // 窗口内全屏 (兜底) 时按 Esc 退出 (原生全屏由浏览器自己处理)
  useEffect(() => {
    if (!full) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) exitFull();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ full, exitFull ]);
  // 卸载时退出原生全屏, 避免切到别的工具后还停在全屏层
  useEffect(() => () => exitNativeFullscreen(), []);

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
    <div
      ref={rootRef}
      className={`md-editor${full ? ' md-editor-full' : ''}${dragging ? ' md-editor-dragging' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); void loadFile(e.dataTransfer?.files?.[0]); }}
    >
      <style>{EDITOR_CSS}</style>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          size="small"
          extra={
            <Space size={8}>
              <input ref={fileRef} type="file" accept={MD_ACCEPT} style={{ display: 'none' }} onChange={onPickFile} />
              <Tooltip title={t('打开 .md 文件编辑 (也可直接把文件拖到编辑区)')}>
                <Button size="small" icon={<FolderOpenOutlined />} onClick={() => fileRef.current?.click()}>{t('打开文件')}</Button>
              </Tooltip>
              <Tooltip title={t('保存为 .md 文件')}>
                <Button size="small" icon={<SaveOutlined />} disabled={!md} onClick={saveMd}>{t('保存')}</Button>
              </Tooltip>
              <Button size="small" onClick={() => { setMd(SAMPLE); message.info(t('已载入示例')); }}>{t('载入示例')}</Button>
              <Button size="small" danger disabled={!md} onClick={() => setMd('')}>{t('清空')}</Button>
              <Tooltip title={t(full ? '退出全屏' : '全屏')}>
                <Button
                  size="small"
                  icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={full ? exitFull : enterFull}
                >{t(full ? '退出全屏' : '全屏')}</Button>
              </Tooltip>
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
        <div className="md-editor-main" style={{ display: 'flex', flexWrap: full ? 'nowrap' : 'wrap', gap: 12 }}>
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
              style={{ minHeight: full ? 0 : 460, height: full ? '100%' : undefined, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13, lineHeight: 1.7, resize: full ? 'none' : 'vertical' }}
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
                  <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={exportHtml}>{t('导出 HTML')}</Button>
                </Space>
              }
            >
              {view === 'preview' ? (
                <div style={{ maxHeight: full ? undefined : 520, overflow: 'auto' }}>
                  <style>{MD_EXPORT_CSS}</style>
                  {isDark ? <style>{MD_DARK_CSS}</style> : null}
                  <div className="md-preview" dangerouslySetInnerHTML={{ __html: html || `<p style="color:#999">${t('(空内容)')}</p>` }} />
                </div>
              ) : (
                <Input.TextArea
                  value={html}
                  readOnly
                  autoSize={false}
                  style={{ minHeight: full ? 0 : 460, height: full ? '100%' : undefined, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12, lineHeight: 1.6, resize: full ? 'none' : 'vertical' }}
                />
              )}
            </Card>
          )}
        </div>
      </Space>
    </div>
  );
};

export default MarkdownEditor;
