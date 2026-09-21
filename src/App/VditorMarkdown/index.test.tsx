import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import VditorMarkdown from './index';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

interface MockOptions {
  [key: string]: any;
}

interface MockInstance {
  element: HTMLElement;
  options: MockOptions;
  value: string;
  themes: string[][];
  destroyed: boolean;
  inserted: string[];
}

// Vditor 是重量级 DOM 编辑器, 单测只验证"页面如何驱动它":
// 这里记录构造参数与实例方法调用, 编辑器自身的渲染逻辑由 e2e 验证
const created: MockInstance[] = [];
const md2htmlCalls: { md: string; options?: MockOptions }[] = [];
let ctorError = '';

jest.mock('vditor', () => {
  class Vditor {
    element: HTMLElement;
    options: MockOptions;
    value: string;
    themes: string[][] = [];
    inserted: string[] = [];
    destroyed = false;

    static md2html = jest.fn(async (md: string, options?: MockOptions) => {
      md2htmlCalls.push({ md, options });
      return `<h1>${md.split('\n')[0]}</h1>`;
    });

    constructor(element: HTMLElement | string, options: MockOptions) {
      if (ctorError !== '') throw new Error(ctorError);
      this.element = element as HTMLElement;
      this.options = options;
      this.value = String(options.value ?? '');
      created.push(this as unknown as MockInstance);
      // Vditor 初始化完成后回调 after, 页面据此隐藏加载提示
      setTimeout(() => {
        if (typeof options.after === 'function') options.after();
      }, 0);
    }

    getValue(): string {
      return this.value;
    }

    setValue(markdown: string): void {
      this.value = markdown;
    }

    insertValue(markdown: string): void {
      this.inserted.push(markdown);
      this.value += markdown;
    }

    setTheme(...args: string[]): void {
      this.themes.push(args);
    }

    destroy(): void {
      this.destroyed = true;
    }

    focus(): void {
      /* noop */
    }
  }
  return { __esModule: true, default: Vditor };
});

const mockSave = saveTextFile as jest.Mock;

/** 按按钮文案定位 (antd 可能给两个汉字插空格, 故逐字符匹配) */
const btn = (name: string): HTMLButtonElement => {
  const pattern = new RegExp(name.split('').map((c) => (c === ' ' ? '\\s+' : c)).join('\\s*'));
  const hit = screen.getAllByRole('button', { name: pattern })[0];
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};

const notice = (): string => document.querySelector('.ant-message')?.textContent ?? '';
const writeText = (): jest.Mock =>
  (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;

/** 等待编辑器创建完成 (mock 在下一个 tick 回调 after) */
const waitEditor = async (count = 1): Promise<MockInstance> => {
  await waitFor(() => expect(created.length).toBeGreaterThanOrEqual(count));
  return created[count - 1];
};

/** 在示例下拉框中选中某项 */
const pickSample = async (label: string) => {
  fireEvent.mouseDown(document.querySelector('.ant-select-selector') as HTMLElement);
  const option = await waitFor(() => {
    const hit = screen.getAllByText(label).find((el) => el.closest('.ant-select-item-option'));
    if (!hit) throw new Error(`未找到示例选项: ${label}`);
    return hit.closest('.ant-select-item-option') as HTMLElement;
  });
  fireEvent.click(option);
};

describe('VditorMarkdown 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    created.length = 0;
    md2htmlCalls.length = 0;
    ctorError = '';
    mockSave.mockClear().mockResolvedValue(true);
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async () => ({
      ok: true,
      text: async () => '/*theme css*/',
    }));
  });

  test('渲染后按当前模式 / 语言创建编辑器, 并传入默认示例', async () => {
    render(<VditorMarkdown />);
    expect(screen.getByText('编辑器加载中…')).toBeInTheDocument();
    const instance = await waitEditor();
    expect(instance.options.mode).toBe('ir');
    expect(instance.options.lang).toBe('zh_CN');
    expect(instance.options.icon).toBe('ant');
    expect(String(instance.options.cdn).endsWith('/vditor')).toBe(true);
    expect(String(instance.options.value)).toContain('# Markdown 基础语法');
    expect(instance.options.cache).toEqual({ enable: false });
    expect(instance.options.preview.theme.current).toBe('light');
    expect(instance.options.preview.hljs.style).toBe('github');
    expect(instance.options.preview.math.engine).toBe('KaTeX');
  });

  test('初始化完成后隐藏加载提示并显示统计条', async () => {
    render(<VditorMarkdown />);
    await waitEditor();
    await waitFor(() => expect(screen.queryByText('编辑器加载中…')).toBeNull());
    expect(screen.getByText(/字符 ·/)).toBeInTheDocument();
    expect(screen.getByText(/即时渲染: 光标所在块实时渲染/)).toBeInTheDocument();
  });

  test('编辑器输入会同步统计与示例选择状态', async () => {
    render(<VditorMarkdown />);
    const instance = await waitEditor();
    act(() => {
      instance.options.input('hello');
    });
    expect(screen.getByText(/5 字符/)).toBeInTheDocument();
    expect(screen.getByText(/1 词/)).toBeInTheDocument();
    expect(screen.getByText('示例')).toBeInTheDocument();
    expect(btn('复制 Markdown')).toBeEnabled();
  });

  test('切换模式会重建编辑器并销毁旧实例', async () => {
    render(<VditorMarkdown />);
    const first = await waitEditor();
    fireEvent.click(screen.getByText('分屏预览'));
    const second = await waitEditor(2);
    expect(second.options.mode).toBe('sv');
    expect(first.destroyed).toBe(true);
    expect(second.options.lang).toBe('zh_CN');
  });

  test('切换示例会把内容写入编辑器', async () => {
    render(<VditorMarkdown />);
    const instance = await waitEditor();
    await pickSample('数学公式');
    expect(instance.value).toContain('E = mc^2');
    expect(screen.getAllByText(/数学公式/).length).toBeGreaterThan(0);
  });

  test('「插入目录」把生成的目录插入编辑器', async () => {
    render(<VditorMarkdown />);
    const instance = await waitEditor();
    fireEvent.click(btn('插入目录'));
    expect(instance.inserted[0]).toContain('## 目录');
    expect(instance.inserted[0]).toContain('- 列表');
  });

  test('「插入目录」在没有 h2 及以下标题时给出提示', async () => {
    render(<VditorMarkdown />);
    const instance = await waitEditor();
    act(() => {
      instance.options.input('# 只有一级标题');
    });
    fireEvent.click(btn('插入目录'));
    await waitFor(() => expect(notice()).toContain('未找到可插入的标题'));
    expect(instance.inserted).toHaveLength(0);
  });

  test('「清空」清空内容并禁用操作按钮', async () => {
    render(<VditorMarkdown />);
    const instance = await waitEditor();
    fireEvent.click(btn('清空'));
    expect(instance.value).toBe('');
    expect(btn('复制 Markdown')).toBeDisabled();
    expect(btn('导出 .md')).toBeDisabled();
  });

  test('「复制 Markdown」写入剪贴板', async () => {
    render(<VditorMarkdown />);
    await waitEditor();
    fireEvent.click(btn('复制 Markdown'));
    await waitFor(() => expect(writeText()).toHaveBeenCalled());
    expect(String(writeText().mock.calls[0][0])).toContain('# Markdown 基础语法');
    await waitFor(() => expect(notice()).toContain('已复制 Markdown'));
  });

  test('「复制 HTML」用 md2html 渲染并内联主题样式', async () => {
    render(<VditorMarkdown />);
    await waitEditor();
    fireEvent.click(btn('复制 HTML'));
    await waitFor(() => expect(md2htmlCalls).toHaveLength(1));
    expect(String(md2htmlCalls[0].md)).toContain('# Markdown 基础语法');
    expect(String(md2htmlCalls[0].options?.cdn).endsWith('/vditor')).toBe(true);
    await waitFor(() => expect(writeText()).toHaveBeenCalled());
    const html = String(writeText().mock.calls[0][0]);
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<article class="vditor-reset">');
    expect(html).toContain('/*theme css*/');
    const fetched = ((globalThis as unknown as { fetch: jest.Mock }).fetch).mock.calls.map((call) => String(call[0]));
    expect(fetched.some((url) => url.endsWith('/vditor/dist/css/content-theme/light.css'))).toBe(true);
    expect(fetched.some((url) => url.endsWith('/vditor/dist/js/highlight.js/styles/github.min.css'))).toBe(true);
  });

  test('「导出 .md」调用保存对话框', async () => {
    render(<VditorMarkdown />);
    await waitEditor();
    fireEvent.click(btn('导出 .md'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    const [name, content] = mockSave.mock.calls[0];
    expect(String(name)).toBe('Markdown-基础语法.md');
    expect(String(content)).toContain('# Markdown 基础语法');
    await waitFor(() => expect(notice()).toContain('保存成功'));
  });

  test('「导出 .html」保存渲染后的完整文档', async () => {
    render(<VditorMarkdown />);
    await waitEditor();
    fireEvent.click(btn('导出 .html'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    const [name, content, title] = mockSave.mock.calls[0];
    expect(String(name)).toBe('Markdown-基础语法.html');
    expect(String(content)).toContain('<!DOCTYPE html>');
    expect(String(title)).toBe('导出 .html');
  });

  test('编辑器初始化失败时给出错误提示, 切换模式后可以重试', async () => {
    ctorError = 'create failed';
    const { unmount } = render(<VditorMarkdown />);
    await waitFor(() => expect(screen.getByText('编辑器加载失败, 请刷新页面重试')).toBeInTheDocument());
    expect(screen.getByText('create failed')).toBeInTheDocument();
    expect(created).toHaveLength(0);
    unmount();

    ctorError = '';
    render(<VditorMarkdown />);
    const instance = await waitEditor();
    expect(instance.options.mode).toBe('ir');
    expect(screen.queryByText('编辑器加载失败, 请刷新页面重试')).toBeNull();
  });
});
