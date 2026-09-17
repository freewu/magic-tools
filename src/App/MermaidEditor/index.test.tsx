import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { ThemeProvider } from '../../hook/theme-context';
import MermaidEditor from './index';
import { GROUP_LABELS, SAMPLES } from './data';
import { u } from './lang';
import { saveBytesFile, savePngFile, saveTextFile } from '../../lib/tauri';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  saveTextFile: jest.fn().mockResolvedValue(true),
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
  emitThemeMode: jest.fn(),
  listenThemeMode: jest.fn().mockResolvedValue(() => {}),
  emitLocale: jest.fn(),
  listenLocale: jest.fn().mockResolvedValue(() => {}),
  listenOpenPage: jest.fn().mockResolvedValue(() => {}),
}));

jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(),
    parse: jest.fn().mockResolvedValue(true),
  },
}));

import mermaid from 'mermaid';

const mockInitialize = mermaid.initialize as jest.Mock;
const mockRender = mermaid.render as jest.Mock;

/** mermaid 渲染出的 SVG (width/height 为数值, 便于导出断言) */
const SVG = '<svg id="mmd" width="240" height="120" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg"><g><rect width="40" height="20" /></g></svg>';

/** 被渲染过的源码 (按调用顺序) */
let rendered: string[] = [];

// ---- canvas / Image 桩: 记录绘制调用, 用于验证导出倍率与背景色 ----
const ctxCalls: Array<{ op: string; args: number[] }> = [];
const stubCtx = {
  fillStyle: '',
  fillRect: (x: number, y: number, w: number, h: number) => ctxCalls.push({ op: 'fillRect', args: [ x, y, w, h ] }),
  drawImage: (_img: unknown, x: number, y: number, w: number, h: number) => ctxCalls.push({ op: 'drawImage', args: [ x, y, w, h ] }),
};
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) { setTimeout(() => this.onload?.(), 0); }
  get src() { return ''; }
}

const pngUrl = 'data:image/png;base64,cG5n';
const webpUrl = 'data:image/webp;base64,d2VicA==';

const stubCanvas = (webp = true) => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = jest.fn((mime?: string) => (webp && mime === 'image/webp' ? webpUrl : pngUrl)) as unknown as HTMLCanvasElement['toDataURL'];
  (global as unknown as { Image: unknown }).Image = MockImage;
};

/** 按按钮文案定位 (antd 会在两个汉字间插空格, 故比较去掉空白后的文本) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .map((el) => el.closest('button'))
    .find((b): b is HTMLButtonElement => !!b);
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit;
};
/** 在分组下拉框中搜索并选中某个示例 (列表虚拟滚动, 需先输入关键字筛出目标项) */
const pickSample = async (label: string) => {
  fireEvent.mouseDown(document.querySelector('.ant-select-selector') as HTMLElement);
  const input = document.querySelector('.ant-select-selection-search-input') as HTMLInputElement;
  fireEvent.change(input, { target: { value: label } });
  const option = await waitFor(() => {
    const hit = screen
      .getAllByText(label)
      .find((el) => el.closest('.ant-select-item-option'))
      ?.closest('.ant-select-item-option');
    if (!hit) throw new Error(`未找到示例选项: ${label}`);
    return hit as HTMLElement;
  });
  fireEvent.click(option);
};
/** 组件注入的预览样式表内容 (通过 SSR 无关的 style 标签读取) */
const previewCss = (): string => {
  const hit = Array.from(document.querySelectorAll('style'))
    .map((el) => el.textContent ?? '')
    .find((text) => text.includes('.mmd-preview'));
  if (!hit) throw new Error('未找到预览样式');
  return hit;
};
/** 源码编辑框 */
const codeArea = () => screen.getByPlaceholderText('在此输入 Mermaid 代码…') as HTMLTextAreaElement;
/** 等待首次渲染完成 (200ms 防抖) */
const waitRendered = () => waitFor(() => expect(document.querySelector('.mmd-preview svg')).not.toBeNull());

beforeEach(() => {
  rendered = [];
  ctxCalls.length = 0;
  mockInitialize.mockClear();
  mockRender.mockReset();
  mockRender.mockImplementation(async (_id: string, code: string) => {
    rendered.push(code);
    return { svg: SVG };
  });
  (saveTextFile as jest.Mock).mockClear().mockResolvedValue(true);
  (savePngFile as jest.Mock).mockClear().mockResolvedValue(true);
  (saveBytesFile as jest.Mock).mockClear().mockResolvedValue(true);
  stubCanvas();
  localStorage.clear();
  message.destroy(); // 清理上一个用例残留的 antd message 提示
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
});

describe('MermaidEditor 初始界面', () => {
  test('渲染编辑器 / 示例选择 / 预览与导出按钮, 并自动渲染首个示例', async () => {
    render(<MermaidEditor />);
    expect(screen.getByText('Mermaid 源码')).toBeInTheDocument();
    expect(screen.getByText('预览')).toBeInTheDocument();
    expect(screen.getByText('缩放')).toBeInTheDocument();
    expect(screen.getByText('背景')).toBeInTheDocument();
    // 顶部 Info 说明已移除, 仅保留面板开关
    expect(screen.queryByText('Mermaid 编辑器')).toBeNull();
    expect(btn('隐藏输入')).toBeInTheDocument();
    expect(btn('隐藏预览')).toBeInTheDocument();
    expect(codeArea().value).toBe(SAMPLES[0].code);

    await waitRendered();
    expect(rendered).toEqual([ SAMPLES[0].code ]);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockInitialize.mock.calls[0][0]).toMatchObject({ theme: 'default', startOnLoad: false, securityLevel: 'strict' });
    expect(btn('导出 SVG')).toBeEnabled();
    expect(btn('导出 PNG')).toBeEnabled();
    expect(btn('复制 SVG')).toBeEnabled();
    // 行数 / 字符数统计
    expect(screen.getByText(`${SAMPLES[0].code.split('\n').length} 行 / ${SAMPLES[0].code.length} 字符`)).toBeInTheDocument();
  });

  test('深色模式下使用 mermaid dark 主题', async () => {
    localStorage.setItem('theme-mode', 'dark');
    render(<ThemeProvider><MermaidEditor /></ThemeProvider>);
    await waitRendered();
    expect(mockInitialize.mock.calls[0][0]).toMatchObject({ theme: 'dark' });
  });

  test('下拉切换示例后源码与渲染内容同步更新', async () => {
    render(<MermaidEditor />);
    await waitRendered();

    await pickSample('饼图 (pie)');

    const pie = SAMPLES.find((s) => s.id === 'pie')!;
    expect(codeArea().value).toBe(pie.code);
    await waitFor(() => expect(rendered[rendered.length - 1]).toBe(pie.code));
  });

  test('示例下拉按图形家族分组 (首个分组为「基础图」)', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.mouseDown(document.querySelector('.ant-select-selector') as HTMLElement);
    await waitFor(() => expect(screen.getByText(GROUP_LABELS.basic)).toBeInTheDocument());
    expect(document.querySelectorAll('.ant-select-item-group').length).toBeGreaterThan(0);
  });

  test('手动编辑源码后重新渲染', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.change(codeArea(), { target: { value: 'flowchart LR\n  A-->B' } });
    await waitFor(() => expect(rendered[rendered.length - 1]).toBe('flowchart LR\n  A-->B'));
  });

  test('渲染失败: 展示 mermaid 错误详情并禁用导出', async () => {
    mockRender.mockRejectedValue(new Error('Parse error on line 2: Expecting \'SEMI\''));
    render(<MermaidEditor />);
    await waitFor(() => expect(screen.getByText('渲染失败')).toBeInTheDocument());
    expect(screen.getByText(/Parse error on line 2/)).toBeInTheDocument();
    expect(btn('导出 SVG')).toBeDisabled();
    expect(btn('导出 PNG')).toBeDisabled();
    expect(btn('导出 WebP')).toBeDisabled();
    expect(document.querySelector('.mmd-preview')).toBeNull();

    // 修好语法后恢复
    mockRender.mockImplementation(async (_id: string, code: string) => ({ svg: SVG, bindFunctions: () => void code }));
    fireEvent.change(codeArea(), { target: { value: 'flowchart TD\n  A-->B' } });
    await waitRendered();
    expect(screen.queryByText('渲染失败')).toBeNull();
    expect(btn('导出 PNG')).toBeEnabled();
  });

  test('清空源码后回到占位提示', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('清空'));
    expect(codeArea().value).toBe('');
    await waitFor(() => expect(screen.getByText('还没内容, 在左侧输入 Mermaid 代码')).toBeInTheDocument());
    expect(document.querySelector('.mmd-preview')).toBeNull();
    expect(btn('导出 SVG')).toBeDisabled();
    expect(btn('复制源码')).toBeDisabled();
  });

  test('浏览器不支持 WebP 时按钮禁用并给出提示', async () => {
    stubCanvas(false);
    render(<MermaidEditor />);
    await waitRendered();
    expect(btn('导出 WebP')).toBeDisabled();
    expect(btn('导出 PNG')).toBeEnabled();
  });
});

describe('MermaidEditor 面板与视图', () => {
  test('预览底色跟随「背景」实时切换 (透明为棋盘格)', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    expect(previewCss()).toContain('.mmd-preview svg');
    const pane = () => document.querySelector('.mmd-preview') as HTMLElement;
    expect(getComputedStyle(pane()).backgroundColor).toBe('rgb(255, 255, 255)');

    fireEvent.click(screen.getByText('深色'));
    expect(getComputedStyle(pane()).backgroundColor).toBe('rgb(31, 31, 31)');

    fireEvent.click(screen.getByText('透明'));
    expect(pane().className).toContain('mmd-preview-checker');
    expect(previewCss()).toContain('linear-gradient');
    expect(getComputedStyle(pane()).backgroundColor).toBe('');
  });

  test('缩放切换实时改变预览尺寸 (1x 自适应, 更大倍率按原图放大)', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    const css = previewCss;
    // 默认 1x: 预览自适应卡片宽度 (不写死像素宽度)
    expect(css()).toContain('max-width: 100%');

    fireEvent.click(screen.getByText('3x'));
    await waitFor(() => expect(css()).toContain('width: 720px'));
    expect(css()).toContain('max-width: none');

    fireEvent.click(screen.getByText('1x (自适应)'));
    await waitFor(() => expect(css()).toContain('max-width: 100%'));
    expect(css()).not.toContain('width: 720px');
  });

  test('可隐藏输入 / 隐藏预览, 并可随时恢复', async () => {
    render(<MermaidEditor />);
    await waitRendered();

    fireEvent.click(btn('隐藏输入'));
    expect(screen.queryByText('Mermaid 源码')).toBeNull();
    expect(btn('显示输入')).toBeInTheDocument();
    expect(document.querySelector('.mmd-preview svg')).not.toBeNull();

    fireEvent.click(btn('隐藏预览'));
    expect(document.querySelector('.mmd-preview')).toBeNull();
    expect(screen.queryByRole('button', { name: '导出 PNG' })).toBeNull();
    expect(btn('显示预览')).toBeInTheDocument();

    fireEvent.click(btn('显示输入'));
    fireEvent.click(btn('显示预览'));
    expect(screen.getByText('Mermaid 源码')).toBeInTheDocument();
    expect(screen.getByText('预览')).toBeInTheDocument();
    expect(document.querySelector('.mmd-preview svg')).not.toBeNull();
  });
});

describe('MermaidEditor 导出', () => {
  test('导出 SVG: 固定宽高后写入文件', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('导出 SVG'));

    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    const [ name, content, title, opts ] = (saveTextFile as jest.Mock).mock.calls[0];
    expect(name).toBe('mermaid-flowchart.svg');
    expect(title).toBe('导出 SVG');
    expect(opts).toEqual({ filterName: 'SVG 图片', extensions: [ 'svg' ] });
    expect(content).toContain('<svg width="240" height="120"');
    expect(content).toContain('viewBox="0 0 240 120"');
    expect(content).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    await waitFor(() => expect(screen.getByText('已导出 mermaid-flowchart.svg')).toBeInTheDocument());
    // 矢量导出不经过 canvas
    expect(ctxCalls).toHaveLength(0);
  });

  test('导出 PNG: 默认 1x (原图尺寸) + 白底', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('导出 PNG'));

    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0]).toEqual([ 'mermaid-flowchart.png', pngUrl ]);
    expect(ctxCalls).toEqual([
      { op: 'fillRect', args: [ 0, 0, 240, 120 ] },
      { op: 'drawImage', args: [ 0, 0, 240, 120 ] },
    ]);
    await waitFor(() => expect(screen.getByText('已导出 mermaid-flowchart.png')).toBeInTheDocument());
  });

  test('导出 PNG: 切到 3x + 透明背景后不带底色且尺寸放大', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(screen.getByText('3x'));
    fireEvent.click(screen.getByText('透明'));
    fireEvent.click(btn('导出 PNG'));

    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect(ctxCalls).toEqual([{ op: 'drawImage', args: [ 0, 0, 720, 360 ] }]);
  });

  test('导出 WebP: 走字节写入并带扩展名过滤', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('导出 WebP'));

    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(1));
    const [ name, bytes, opts ] = (saveBytesFile as jest.Mock).mock.calls[0];
    expect(name).toBe('mermaid-flowchart.webp');
    expect(Array.from(bytes as Uint8Array)).toEqual(Array.from(new TextEncoder().encode('webp')));
    expect(opts).toEqual({ title: '导出 WebP', filterName: 'WebP 图片', extensions: [ 'webp' ] });
    expect(ctxCalls.some((c) => c.op === 'fillRect')).toBe(true); // 默认白底
  });

  test('导出文件名跟随所选示例', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    await pickSample('时序图 (sequenceDiagram)');
    await waitFor(() => expect(codeArea().value).toContain('sequenceDiagram'));

    fireEvent.click(btn('导出 SVG'));
    await waitFor(() => expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('mermaid-sequence.svg'));
  });

  test('用户在保存对话框取消时不提示成功', async () => {
    (saveTextFile as jest.Mock).mockResolvedValue(false);
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('导出 SVG'));
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText(/已导出/)).toBeNull());
  });

  test('导出异常时提示错误原因', async () => {
    (savePngFile as jest.Mock).mockRejectedValue(new Error('磁盘已满'));
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('导出 PNG'));
    await waitFor(() => expect(screen.getByText('导出失败: 磁盘已满')).toBeInTheDocument());
  });

  test('复制源码 / 复制 SVG 写入粘贴板', async () => {
    render(<MermaidEditor />);
    await waitRendered();
    fireEvent.click(btn('复制源码'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLES[0].code));
    await waitFor(() => expect(screen.getByText('已复制源码')).toBeInTheDocument());

    fireEvent.click(btn('复制 SVG'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SVG));
    await waitFor(() => expect(screen.getByText('已复制 SVG')).toBeInTheDocument());
  });
});

describe('MermaidEditor 说明区', () => {
  test('渲染说明标题与语法要点', () => {
    const { container } = render(<MermaidEditor />);
    expect(screen.getByText('Mermaid 编辑器说明')).toBeInTheDocument();
    const intro = container.querySelector('.intro') as HTMLElement;
    expect(intro.textContent).toContain('flowchart TD');
    expect(intro.textContent).toContain('sequenceDiagram');
    expect(intro.textContent).toContain('gitGraph');
    expect(intro.textContent).toContain('htmlLabels');
  });
});

describe('MermaidEditor 内置示例', () => {
  /** 各图形源码的开头关键字 (sankey 带 front-matter, 断言前先剥掉) */
  const KEYWORDS: Record<string, RegExp> = {
    flowchart: /^flowchart /, sequence: /^sequenceDiagram/, class: /^classDiagram/, state: /^stateDiagram-v2/,
    er: /^erDiagram/, mindmap: /^mindmap/, journey: /^journey/, c4: /^C4Context/, architecture: /^architecture-beta/,
    block: /^block-beta/, requirement: /^requirementDiagram/, pie: /^pie /, quadrant: /^quadrantChart/, xychart: /^xychart/,
    sankey: /^sankey/, radar: /^radar-beta/, treemap: /^treemap-beta/, venn: /^venn-beta/, packet: /^packet/,
    gantt: /^gantt/, gitgraph: /^gitGraph/, timeline: /^timeline/, kanban: /^kanban/, ishikawa: /^ishikawa-beta/,
    cynefin: /^cynefin-beta/, wardley: /^wardley-beta/, eventmodeling: /^eventmodeling/, treeview: /^treeView-beta/,
    'railroad-ir': /^railroad-beta/, 'railroad-ebnf': /^railroad-ebnf-beta/,
    'railroad-abnf': /^railroad-abnf-beta/, 'railroad-peg': /^railroad-peg-beta/,
  };

  test('覆盖全部可预览图形: id 唯一、分组齐全、源码关键字正确', () => {
    const ids = SAMPLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    // 与关键字清单一一对应 (新增/删除示例时同步维护)
    expect([...ids].sort()).toEqual(Object.keys(KEYWORDS).sort());
    // 四个分组都有示例
    expect([...new Set(SAMPLES.map((s) => s.group))].sort()).toEqual([ 'basic', 'chart', 'flow', 'grammar' ]);

    for (const s of SAMPLES) {
      const body = s.code.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
      expect(body).toMatch(KEYWORDS[s.id]);
      expect(s.code.length).toBeGreaterThan(20);
    }

    // 需要外挂插件 / 无解析器的图形不应出现在内置示例里
    for (const hidden of [ 'usecase', 'zenuml', 'flowchart-elk', 'info' ]) {
      expect(ids).not.toContain(hidden);
    }
  });

  test('示例名与分组名均有 zh-TW / en 词条', () => {
    for (const s of SAMPLES) {
      // en 词条必须齐全; zh-TW 允许与 zh 相同 (如「看板 (kanban)」两地用字一致)
      expect(u('en', s.label)).not.toBe(s.label);
      expect(u('zh-TW', s.label).length).toBeGreaterThan(0);
      expect(u('zh-CN', s.label)).toBe(s.label);
    }
    for (const g of Object.values(GROUP_LABELS)) {
      expect(u('en', g)).not.toBe(g);
    }
  });
});
