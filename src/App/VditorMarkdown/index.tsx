import { Alert, Button, Card, Segmented, Select, Space, Spin, Typography, message } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'vditor/dist/index.css';
import { useLocale } from '../../hook/locale-context';
import { useTheme } from '../../hook/theme-context';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { DEFAULT_SAMPLE_ID, MODE_OPTIONS, SAMPLES, findSample } from './data';
import {
  EDITOR_HEIGHT,
  MARKDOWN_OPTIONS,
  TOOLBAR,
  buildToc,
  contentTheme,
  docTitle,
  exportFileName,
  hljsStyle,
  markdownStats,
  vditorCdn,
  vditorLang,
  wrapExportHtml,
  type EditorMode,
} from './lib';
import { vm, vmT } from './lang';

const { Text } = Typography;

// Vditor 的体积主要来自运行时资源 (lute 引擎 3.7MB / katex 1.5MB), 这些文件由
// vite.config.mts 的 vditorAssets 插件按需拷到 dist/vditor 并通过 cdn 选项在运行时拉取,
// 仓库里不提交这些大文件; 这里的 JS 只做动态 import 懒加载。
interface VditorInstance {
  destroy(): void;
  getValue(): string;
  setValue(markdown: string): void;
  insertValue(markdown: string, render?: boolean): void;
  setTheme(theme: 'dark' | 'classic', contentTheme?: string, codeTheme?: string, contentThemePath?: string): void;
  focus(): void;
}

type VditorCtor = new (element: HTMLElement | string, options: Record<string, unknown>) => VditorInstance;

interface VditorStatic extends VditorCtor {
  md2html(markdown: string, options?: Record<string, unknown>): Promise<string>;
}

let vditorPromise: Promise<VditorStatic> | null = null;
/** 动态加载并缓存 Vditor (加载失败允许重试) */
const loadVditor = (): Promise<VditorStatic> => {
  if (!vditorPromise) {
    vditorPromise = import('vditor')
      .then((mod) => (mod as unknown as { default: VditorStatic }).default)
      .catch((err: unknown) => {
        vditorPromise = null;
        throw err;
      });
  }
  return vditorPromise;
};

/** 各模式的一句话说明 (中文原文, 经语言包翻译) */
const MODE_HINTS: Record<EditorMode, string> = {
  ir: '即时渲染: 光标所在块实时渲染, 其余块保持源码',
  sv: '分屏预览: 左侧源码, 右侧实时预览',
  wysiwyg: '所见即所得: 全部内容都是渲染结果',
};

const STATS_TEXT = '{c} 字符 · {w} 词 · {l} 行 · {h} 标题 · {cb} 代码块 · {lk} 链接 · {im} 图片';

const HINT_TEXT =
  '支持表格 / 任务列表 / 代码高亮 / KaTeX 公式 / 脚注 / 提示块; 粘贴或拖入的图片以 base64 内联 (2MB 以内)';

/** 内联图片上限 (base64 会让文档迅速变大) */
const MAX_INLINE_IMAGE = 2 * 1024 * 1024;

/** 读取为 data URL (粘贴 / 上传的图片内联到 Markdown 里, 不依赖后端) */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('read error'));
    reader.readAsDataURL(file);
  });

/** 拉取同源的 Vditor 样式文件 (导出 HTML 时内联, 保证离线可用) */
const fetchText = async (url: string): Promise<string> => {
  const fetcher = (globalThis as { fetch?: typeof fetch }).fetch;
  if (typeof fetcher !== 'function') return '';
  try {
    const res = await fetcher(url);
    return res.ok ? await res.text() : '';
  } catch {
    return '';
  }
};

const VditorMarkdown: React.FC = () => {
  const { locale } = useLocale();
  const { isDark } = useTheme();
  const t = (zh: string) => vm(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => vmT(locale, zh, vars);
  const editorLang = vditorLang(locale);
  // 资源前缀: 以当前文档地址为基准, hash 路由下恒定指向 index.html 所在目录,
  // 因此 Tauri 自定义协议 / Pages 子路径 / 开发服务器都能命中
  const cdn = useMemo(() => vditorCdn(document.baseURI), []);
  const themePath = `${cdn}/dist/css/content-theme`;

  const [markdown, setMarkdown] = useState(() => findSample(DEFAULT_SAMPLE_ID)?.md ?? '');
  const [sampleId, setSampleId] = useState(DEFAULT_SAMPLE_ID);
  const [mode, setMode] = useState<EditorMode>('ir');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'copyHtml' | 'saveMd' | 'saveHtml' | ''>('');

  const hostRef = useRef<HTMLDivElement | null>(null);
  const vditorRef = useRef<VditorInstance | null>(null);
  // 重建编辑器 / 导出时读取最新值, 避免把 markdown 放进 effect 依赖导致频繁重建
  const markdownRef = useRef(markdown);
  const darkRef = useRef(isDark);
  markdownRef.current = markdown;
  darkRef.current = isDark;

  const stats = useMemo(() => markdownStats(markdown), [markdown]);

  // Vditor 不支持运行时切换模式, 模式 / 界面语言变化时整体重建
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let disposed = false;
    let instance: VditorInstance | null = null;
    setReady(false);
    setError('');

    const applyTheme = () => {
      const dark = darkRef.current;
      instance?.setTheme(dark ? 'dark' : 'classic', contentTheme(dark), hljsStyle(dark), themePath);
    };

    /** 粘贴 / 上传图片: 转成 data URL 内联; 返回字符串表示失败提示 (Vditor 会以 tip 展示) */
    const handleUpload = async (files: File[]): Promise<string | null> => {
      try {
        const parts: string[] = [];
        for (const file of files) {
          if (!file.type.startsWith('image/')) return t('仅支持插入图片文件');
          if (file.size > MAX_INLINE_IMAGE) return t('图片过大 (超过 2MB), 请先压缩再插入');
          parts.push(`![${file.name}](${await readAsDataUrl(file)})`);
        }
        if (parts.length === 0) return null;
        if (!instance) return t('编辑器尚未就绪');
        instance.insertValue(`\n${parts.join('\n')}\n`);
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    };

    loadVditor()
      .then((Vditor) => {
        if (disposed) return;
        instance = new Vditor(host, {
          cdn,
          lang: editorLang,
          mode,
          icon: 'ant',
          height: EDITOR_HEIGHT,
          value: markdownRef.current,
          placeholder: t('在此输入 Markdown, 光标所在块会即时渲染'),
          cache: { enable: false },
          tab: '  ',
          toolbar: TOOLBAR,
          upload: { accept: 'image/*', handler: handleUpload },
          preview: {
            hljs: { style: hljsStyle(darkRef.current), lineNumber: false },
            math: { engine: 'KaTeX', inlineDigit: true },
            markdown: MARKDOWN_OPTIONS,
            theme: { current: contentTheme(darkRef.current), path: themePath },
          },
          input: (value: string) => {
            setMarkdown(value);
            setSampleId('');
          },
          after: () => {
            if (disposed) return;
            applyTheme();
            setReady(true);
          },
        });
        vditorRef.current = instance;
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      disposed = true;
      vditorRef.current = null;
      try {
        instance?.destroy();
      } catch {
        // 忽略销毁异常 (组件卸载后 DOM 已不可用)
      }
    };
  }, [cdn, editorLang, mode, themePath]);

  // 主题切换走 setTheme 热更新, 不重建编辑器 (避免丢失撤销历史与光标位置)
  useEffect(() => {
    if (!ready) return;
    const dark = isDark;
    vditorRef.current?.setTheme(dark ? 'dark' : 'classic', contentTheme(dark), hljsStyle(dark), themePath);
  }, [isDark, ready, themePath]);

  const applySample = (id: string) => {
    const sample = findSample(id);
    if (!sample) return;
    setSampleId(id);
    setMarkdown(sample.md);
    vditorRef.current?.setValue(sample.md);
  };

  const insertToc = () => {
    const toc = buildToc(markdownRef.current);
    if (toc === '') {
      message.warning(t('未找到可插入的标题 (需要 h2 及以下标题)'));
      return;
    }
    vditorRef.current?.insertValue(toc);
  };

  const clearAll = () => {
    setMarkdown('');
    setSampleId('');
    vditorRef.current?.setValue('');
  };

  const copy = async (text: string, ok: string) => {
    try {
      await copyTextToClipboard(text);
      message.success(ok);
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };

  /** 用 Vditor 自带的 md2html 渲染, 并内联主题 / 代码高亮样式 */
  const buildHtml = async (): Promise<string> => {
    const Vditor = await loadVditor();
    const dark = darkRef.current;
    const body = await Vditor.md2html(markdownRef.current, {
      cdn,
      lang: editorLang,
      hljs: { style: hljsStyle(dark), lineNumber: false },
      math: { engine: 'KaTeX', inlineDigit: true },
      markdown: MARKDOWN_OPTIONS,
      theme: { current: contentTheme(dark), path: themePath },
    });
    const [themeCss, codeCss] = await Promise.all([
      fetchText(`${cdn}/dist/css/content-theme/${contentTheme(dark)}.css`),
      fetchText(`${cdn}/dist/js/highlight.js/styles/${hljsStyle(dark)}.min.css`),
    ]);
    return wrapExportHtml(body, {
      title: docTitle(markdownRef.current),
      isDark: dark,
      lang: locale,
      themeCss,
      codeCss,
    });
  };

  const copyHtml = async () => {
    setBusy('copyHtml');
    try {
      await copy(await buildHtml(), t('已复制 HTML'));
    } catch {
      message.error(t('HTML 渲染失败'));
    } finally {
      setBusy('');
    }
  };

  const saveMarkdown = async () => {
    setBusy('saveMd');
    try {
      const ok = await saveTextFile(
        exportFileName(docTitle(markdownRef.current), 'md'),
        markdownRef.current,
        t('导出 .md'),
        { filterName: 'Markdown', extensions: ['md'] },
      );
      if (ok) message.success(t('保存成功'));
    } finally {
      setBusy('');
    }
  };

  const saveHtml = async () => {
    setBusy('saveHtml');
    try {
      const html = await buildHtml();
      const ok = await saveTextFile(
        exportFileName(docTitle(markdownRef.current), 'html'),
        html,
        t('导出 .html'),
        { filterName: 'HTML', extensions: ['html'] },
      );
      if (ok) message.success(t('保存成功'));
    } catch {
      message.error(t('HTML 渲染失败'));
    } finally {
      setBusy('');
    }
  };

  return (
    <Card
      size="small"
      title={t('即时渲染 Markdown')}
      extra={
        <Space size={8} wrap>
          <Segmented
            size="small"
            value={mode}
            onChange={(value) => setMode(value as EditorMode)}
            options={MODE_OPTIONS.map((item) => ({ value: item.value, label: t(item.label) }))}
          />
          <Select
            size="small"
            showSearch
            style={{ minWidth: 150 }}
            value={sampleId === '' ? undefined : sampleId}
            placeholder={t('示例')}
            optionFilterProp="label"
            onChange={applySample}
            options={SAMPLES.map((sample) => ({ value: sample.id, label: t(sample.label) }))}
          />
          <Button size="small" icon={<CopyOutlined />} disabled={markdown === ''} onClick={() => copy(markdown, t('已复制 Markdown'))}>
            {t('复制 Markdown')}
          </Button>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            loading={busy === 'copyHtml'}
            disabled={markdown === ''}
            onClick={copyHtml}
          >
            {t('复制 HTML')}
          </Button>
          <Button
            size="small"
            icon={<OrderedListOutlined />}
            disabled={markdown === ''}
            onClick={insertToc}
          >
            {t('插入目录')}
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={busy === 'saveMd'}
            disabled={markdown === ''}
            onClick={saveMarkdown}
          >
            {t('导出 .md')}
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={busy === 'saveHtml'}
            disabled={markdown === ''}
            onClick={saveHtml}
          >
            {t('导出 .html')}
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} disabled={markdown === ''} onClick={clearAll}>
            {t('清空')}
          </Button>
        </Space>
      }
    >
      {error !== '' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 10 }}
          message={t('编辑器加载失败, 请刷新页面重试')}
          description={error}
        />
      )}
      <div style={{ position: 'relative' }}>
        <div ref={hostRef} />
        {!ready && error === '' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Spin size="small" />
            <Text type="secondary">{t('编辑器加载中…')}</Text>
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          {tt(STATS_TEXT, {
            c: stats.chars,
            w: stats.words,
            l: stats.lines,
            h: stats.headings,
            cb: stats.codeBlocks,
            lk: stats.links,
            im: stats.images,
          })}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t(MODE_HINTS[mode])}
        </Text>
      </div>
      <div style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t(HINT_TEXT)}
        </Text>
      </div>
    </Card>
  );
};

export default VditorMarkdown;
