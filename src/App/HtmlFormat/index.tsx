import { Button, Card, Input, Radio, Space, Tree, Typography, message } from 'antd';
import { ApartmentOutlined, CopyOutlined, DownloadOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HTML_ACCEPT, formatHtml, getHtmlIndent, htmlFileNameOf, htmlTree } from './lib';
import { useLocale } from '../../hook/locale-context';
import { readTextFile } from '../../lib/file';
import { saveTextFile } from '../../lib/tauri';
import { treeKeys, treeNodeCount } from '../../lib/tree';
import { u, uT } from './lang';

const { Text } = Typography;

const SAMPLE = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>示例</title></head>
<body><header><h1>标题</h1><nav><ul><li><a href="/">首页</a></li><li><a href="/about">关于</a></li></ul></nav></header>
<main><section><h2>简介</h2><p>这是<b>加粗</b>与<i>斜体</i>混排的<em>段落</em>内容，长度随意。</p></section>
<div class="card"><img src="a.png" alt="图片"><span>说明文字</span><!-- 注释保留 --></div></main>
<footer><p>© 2024 MagicTools</p></footer></body></html>`;

/** 拖拽高亮: 把 .html / .htm 文件拖到页面上即可打开 */
const STAGE_CSS =
  '.html-stage.html-dragging::after { content: ""; position: absolute; inset: 6px; border-radius: 8px; pointer-events: none; border: 2px dashed var(--app-divider-text, #4c6cb3); }';

const HtmlFormat: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);

  const [raw, setRaw] = useState('');
  const [indent, setIndent] = useState<number>(() => getHtmlIndent());
  // 打开过的本地文件名 (空表示没打开过): 保存时沿用它的名字与后缀
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const result = useMemo(() => {
    try {
      return formatHtml(raw, { indentSize: indent });
    } catch {
      return '';
    }
  }, [raw, indent]);
  // 结构树 (树状折叠视图)
  const tree = useMemo(() => {
    try {
      return htmlTree(raw);
    } catch {
      return { items: [], truncated: false };
    }
  }, [raw]);
  const allKeys = useMemo(() => treeKeys(tree.items), [tree]);
  const [expanded, setExpanded] = useState<React.Key[]>(allKeys);
  // 内容变化后默认全部展开
  useEffect(() => { setExpanded(allKeys); }, [allKeys]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      message.success(t('已复制格式化结果'));
    } catch { /* ignore */ }
  };

  // ---- 打开本地 .html / .htm 文件 (一律按文本读入) ----
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

  /** 保存格式化后的 HTML: 弹系统保存对话框选目录/文件名 (纯网页版回退浏览器下载) */
  const saveResult = async () => {
    if (!result) return;
    const name = htmlFileNameOf(fileName);
    try {
      const ok = await saveTextFile(name, result, t('保存 HTML 文件'), {
        filterName: t('HTML 文件'),
        extensions: ['html', 'htm', 'xhtml', 'txt'],
      });
      if (ok) message.success(tt('已保存 {file}', { file: name }));
    } catch {
      message.error(t('保存失败'));
    }
  };

  return (
    <div
      ref={stageRef}
      className={dragging ? 'html-stage html-dragging' : 'html-stage'}
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
      <Card size="small" title={t('HTML 源码')} extra={
        <Space size={8}>
          <input ref={fileRef} type="file" accept={HTML_ACCEPT} style={{ display: 'none' }} onChange={onPickFile} />
          <Button size="small" icon={<FolderOpenOutlined />} onClick={() => fileRef.current?.click()}>{t('打开文件')}</Button>
          <Radio.Group
            size="small"
            value={indent}
            onChange={(e) => setIndent(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[{ label: t('2 空格'), value: 2 }, { label: t('4 空格'), value: 4 }]}
          />
          <Button size="small" onClick={() => { setRaw(SAMPLE); setFileName(''); }}>{t('载入示例')}</Button>
          <Button size="small" danger disabled={!raw} onClick={() => { setRaw(''); setFileName(''); }}>{t('清空')}</Button>
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
      <Card size="small" title={<Space><ApartmentOutlined /> {t('树状结构')}</Space>} extra={
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>{tt('{n} 个节点', { n: treeNodeCount(tree.items).toLocaleString() })}</Text>
          <Button size="small" disabled={!tree.items.length} onClick={() => setExpanded(allKeys)}>{t('展开全部')}</Button>
          <Button size="small" disabled={!tree.items.length} onClick={() => setExpanded([])}>{t('折叠全部')}</Button>
        </Space>
      }>
        {tree.items.length ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Tree
              treeData={tree.items}
              expandedKeys={expanded}
              onExpand={(keys) => setExpanded([...keys])}
              selectable={false}
              height={320}
            />
            {tree.truncated && (
              <Text type="secondary" style={{ fontSize: 12 }}>{t('节点过多, 结构树只展示前面的节点。')}</Text>
            )}
          </Space>
        ) : (
          t('暂无结构 — 输入 HTML 后自动解析。')
        )}
      </Card>
      <Card size="small" title={t('格式化结果')} extra={
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>{tt('{n} 字符', { n: result.length })}</Text>
          <Button size="small" icon={<CopyOutlined />} disabled={!result} onClick={copy}>{t('复制')}</Button>
          <Button size="small" icon={<DownloadOutlined />} disabled={!result} onClick={saveResult}>{t('保存 .html')}</Button>
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
    </div>
  );
};

export default HtmlFormat;
