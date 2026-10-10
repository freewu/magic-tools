import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { ThemeProvider } from '../../hook/theme-context';
import MindMap from './index';
import { COLOR_SCHEMES, EXPORT_PADDING, FONT_SIZES, PREVIEW_HEIGHT, SAMPLES } from './data';
import { saveBytesFile, savePngFile, saveTextFile } from '../../lib/tauri';

// markmap-view 只有 ESM 产物, jest 无法加载 -> 两个 markmap 包都 mock 掉
const mockInstances: Array<{
  el: SVGSVGElement;
  options: Record<string, unknown>;
  data: unknown;
  state: { rect: { x1: number; y1: number; x2: number; y2: number } };
  setData: jest.Mock;
  fit: jest.Mock;
  rescale: jest.Mock;
  destroy: jest.Mock;
}> = [];

/** 内容包围盒: 240 x 100 (纵向含负值, 与 markmap 实际输出一致) */
const RECT = { x1: -60, y1: -40, x2: 180, y2: 60 };
const BOX_W = 240 + EXPORT_PADDING * 2;
const BOX_H = 100 + EXPORT_PADDING * 2;

const mockTransform = jest.fn((md: string) => ({ root: { content: md, children: [ {} ] }, frontmatter: undefined }));

jest.mock('markmap-lib', () => ({
  __esModule: true,
  builtInPlugins: [ { name: 'frontmatter' }, { name: 'katex' }, { name: 'hljs' } ],
  Transformer: function MockTransformer(this: Record<string, unknown>) {
    this.transform = mockTransform;
  },
}));

jest.mock('markmap-view', () => ({
  __esModule: true,
  Markmap: {
    create: jest.fn((el: SVGSVGElement, options: Record<string, unknown>, data: unknown) => {
      const mm = {
        el,
        options,
        data,
        state: { rect: { ...{ x1: -60, y1: -40, x2: 180, y2: 60 } } },
        setData: jest.fn(async (d: unknown, o?: Record<string, unknown>) => { mm.data = d; if (o) mm.options = o; }),
        fit: jest.fn(async () => {}),
        rescale: jest.fn(async () => {}),
        destroy: jest.fn(),
      };
      mockInstances.push(mm);
      return mm;
    }),
  },
  deriveOptions: jest.fn((json: Record<string, unknown>) => ({ ...json, __derived: true })),
}));

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

/** 按按钮文案定位 (antd 会在汉字与拉丁字母间插空格, 故比较去掉空白后的文本) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .map((el) => el.closest('button'))
    .find((b): b is HTMLButtonElement => !!b);
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit;
};

/** 参数下拉 (0 = 示例, 1 = 配色, 2 = 展开层级, 3 = 字号, 4 = 背景, 5 = 缩放; 与 DOM 顺序一致) */
const selectAt = (index: number) => document.querySelectorAll('.ant-select-selector')[index] as HTMLElement;
const openSelect = async (index: number) => {
  fireEvent.mouseDown(selectAt(index));
  await waitFor(() => expect(document.querySelector('.ant-select-dropdown')).not.toBeNull());
};
/** 刚展开的下拉里的选项文案 (旧下拉带 ant-select-dropdown-hidden, 需取最后一个可见的) */
const openSelectOptions = async (index: number) => {
  await openSelect(index);
  return waitFor(() => {
    const drops = Array.from(document.querySelectorAll('.ant-select-dropdown'))
      .filter((d) => !d.classList.contains('ant-select-dropdown-hidden'));
    const list = drops[drops.length - 1]?.querySelectorAll('.ant-select-item-option') ?? [];
    if (list.length === 0) throw new Error(`下拉 ${index} 未展开`);
    return Array.from(list).map((el) => (el.textContent ?? '').trim());
  });
};
/** 「导出图片」下拉: 打开菜单 / 按格式点菜单项 (key 与 data.ts 的 ExportFormat 一致) */
const EXPORT_LABEL: Record<string, string> = { svg: 'SVG 图片', png: 'PNG 图片', webp: 'WebP 图片' };
const exportMenuItems = () => Array.from(document.querySelectorAll('.ant-dropdown-menu-item')) as HTMLElement[];
const openExportMenu = () => { fireEvent.click(btn('导出图片')); };
const menuItem = async (format: string) => waitFor(() => {
  const target = EXPORT_LABEL[format].replace(/\s+/g, '');
  const hit = exportMenuItems().find((el) => (el.textContent ?? '').replace(/\s+/g, '').startsWith(target));
  if (!hit) throw new Error(`未找到导出格式: ${format}`);
  return hit;
});
const exportAs = async (format: string) => { openExportMenu(); fireEvent.click(await menuItem(format)); };

const clickOption = async (label: string) => {
  const option = await waitFor(() => {
    const hit = screen.getAllByText(label).find((el) => el.closest('.ant-select-item-option'))?.closest('.ant-select-item-option');
    if (!hit) throw new Error(`未找到选项: ${label}`);
    return hit as HTMLElement;
  });
  fireEvent.click(option);
};

/** 参数区的小标签 (说明区里也会出现同名文字, 需按样式精确定位) */
const viewLabel = (text: string): Element | null =>
  screen.queryAllByText(text).find((el) => el.tagName === 'SPAN' && (el as HTMLElement).style.color === 'rgb(136, 136, 136)') ?? null;
/** 卡片标题 (说明区里也会出现同名文字, 需按 class 精确定位) */
const cardTitle = (text: string): Element | null =>
  screen.queryAllByText(text).find((el) => el.classList.contains('ant-card-head-title')) ?? null;
const pane = () => document.querySelector('.mindmap-preview') as HTMLElement;
/** 预览 / 全屏的舞台容器 */
const stageOf = (c: HTMLElement) => c.querySelector('.mindmap-stage') as HTMLElement;
const codeArea = () => screen.getByPlaceholderText('在此输入 Markdown 大纲…') as HTMLTextAreaElement;
/** 全量测试并行跑时定时器会被拖慢, 关键等待放宽到 5s */
const WAIT = { timeout: 5000 };
/**
 * 等待首次渲染完成: 实例已创建 **且** 渲染收尾 (setBox) 后导出按钮解禁。
 * 只等实例个数会踩到「实例已建但 canExport 仍为 false」的窗口 —— 此时点导出/适应窗口
 * 是点在 disabled 按钮上, 全量并发跑测试时定时器被拖慢就会偶发失败。
 */
const waitRendered = () => waitFor(() => {
  expect(mockInstances).toHaveLength(1);
  expect(btn('导出图片')).toBeEnabled();
}, WAIT);
/** 最近一次传给 markmap 的 options */
const lastOptions = () => mockInstances[mockInstances.length - 1].options;
const styleCss = () => String((lastOptions().style as () => string)());

beforeEach(() => {
  mockInstances.length = 0;
  ctxCalls.length = 0;
  mockTransform.mockClear();
  (saveTextFile as jest.Mock).mockClear().mockResolvedValue(true);
  (savePngFile as jest.Mock).mockClear().mockResolvedValue(true);
  (saveBytesFile as jest.Mock).mockClear().mockResolvedValue(true);
  stubCanvas();
  localStorage.clear();
  message.destroy(); // 清理上一个用例残留的 antd message 提示
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
});

describe('MindMap 初始界面', () => {
  test('渲染大纲编辑 / 预览与参数区, 并按设置默认项自动渲染首个示例', async () => {
    render(<MindMap />);
    expect(cardTitle('Markdown 大纲')).not.toBeNull();
    expect(cardTitle('预览')).not.toBeNull();
    for (const label of [ '配色', '展开层级', '字号', '背景', '缩放' ]) {
      expect(viewLabel(label)).not.toBeNull();
    }
    expect(btn('隐藏输入')).toBeInTheDocument();
    expect(btn('隐藏预览')).toBeInTheDocument();
    // 「全屏」与两个面板开关在同一行工具条上
    const toolbar = btn('隐藏输入').closest('.ant-space');
    expect(btn('隐藏预览').closest('.ant-space')).toBe(toolbar);
    expect(btn('全屏').closest('.ant-space')).toBe(toolbar);
    expect(codeArea().value).toBe(SAMPLES[0].code);

    await waitRendered();
    expect(mockTransform.mock.calls[0][0]).toBe(SAMPLES[0].code);
    expect(mockInstances[0].fit).toHaveBeenCalled();
    // 视图参数: 默认配色交给 markmap 自带调色板, 展开层级 -1, 无动画 (保证导出即最终画面)
    expect(lastOptions().color).toBeUndefined();
    expect(lastOptions().initialExpandLevel).toBe(-1);
    expect(lastOptions().duration).toBe(0);
    expect(lastOptions().autoFit).toBe(true);
    expect(styleCss()).toContain('--markmap-font:16px/20px');

    // 状态栏: 行 / 字符 / 标题 + 节点数 / 层数
    const stats = screen.getByText(/行 \/ .* 字符 \/ .* 个标题/);
    expect(stats.textContent).toContain(`${SAMPLES[0].code.replace(/\s+$/, '').split('\n').length} 行`);
    expect(stats.textContent).toContain('2 个节点 · 2 层');
    // 统计信息在输入框上方
    expect(stats.compareDocumentPosition(codeArea()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(btn('导出图片')).toBeEnabled();
  });

  test('视图参数都是下拉, 选项文案为配色 / 层级 / 字号 / 背景 / 缩放', async () => {
    render(<MindMap />);
    await waitRendered();
    expect(await openSelectOptions(1)).toEqual([ '多色', '蓝', '绿', '灰', '暖色', '冷色' ]);
    expect(await openSelectOptions(2)).toEqual([ '全部', '一层', '两层', '三层', '四层' ]);
    expect(await openSelectOptions(3)).toEqual([ '12', '14', '16', '18', '20', '22' ]);
    expect(await openSelectOptions(4)).toEqual([ '白色', '深色', '透明' ]);
    expect(await openSelectOptions(5)).toEqual([ '100%', '150%', '200%', '250%', '300%', '400%' ]);
  });

  test('「缩放」按倍率放大预览画面 (fit 后 rescale, 不重建整棵树)', async () => {
    render(<MindMap />);
    await waitRendered();
    const inst = mockInstances[0];
    expect(inst.rescale).not.toHaveBeenCalled();

    await openSelect(5);
    await clickOption('200%');
    await waitFor(() => expect(inst.rescale).toHaveBeenCalledWith(2));

    inst.fit.mockClear();
    await openSelect(5);
    await clickOption('150%');
    await waitFor(() => expect(inst.rescale).toHaveBeenLastCalledWith(1.5));
    expect(inst.fit).toHaveBeenCalledTimes(1);
    // 只改视图参数: 实例不被重建
    expect(mockInstances).toHaveLength(1);

    // 回到 100% 只重新适应窗口, 不再额外缩放
    inst.fit.mockClear();
    await openSelect(5);
    await clickOption('100%');
    await waitFor(() => expect(inst.fit).toHaveBeenCalledTimes(1));
    expect(inst.rescale).toHaveBeenCalledTimes(2);
  });

  test('输入区与预览区等高对齐, 输入框自动撑满卡片', async () => {
    render(<MindMap />);
    await waitRendered();
    const inputCard = cardTitle('Markdown 大纲')!.closest('.ant-card') as HTMLElement;
    const previewCard = cardTitle('预览')!.closest('.ant-card') as HTMLElement;
    // 两张卡片都撑满同一行 (flex 拉伸), 输入卡正文用 flex 列把输入框拉到与预览同高
    expect(inputCard.style.display).toBe('flex');
    expect(inputCard.style.flexDirection).toBe('column');
    // 预览卡同样由「面板容器 -> 卡片 -> 卡身」三层 flex 撑满行高, 与输入卡等高
    expect(previewCard.style.display).toBe('flex');
    expect(previewCard.style.flexDirection).toBe('column');
    expect(previewCard.style.flex).toBe('1 1 auto');
    const paneBox = previewCard.parentElement as HTMLElement;
    expect(paneBox.className).toContain('mindmap-pane');
    expect(paneBox.style.display).toBe('flex');
    expect(paneBox.style.flexDirection).toBe('column');
    const body = codeArea().parentElement as HTMLElement;
    expect(body.className).toContain('ant-card-body');
    expect(body.style.display).toBe('flex');
    expect(codeArea().style.flex).toContain('1 1 auto');
    expect(codeArea().style.minHeight).toBe('420px');
  });

  test('设置中心的默认配色 / 展开层级 / 示例在打开时生效', async () => {
    localStorage.setItem('mindmap:default-color', 'warm');
    localStorage.setItem('mindmap:default-depth', '2');
    localStorage.setItem('mindmap:default-sample', 'meeting');
    render(<MindMap />);
    const meeting = SAMPLES.find((s) => s.id === 'meeting')!;
    expect(codeArea().value).toBe(meeting.code);
    await waitRendered();
    expect(lastOptions().color).toEqual(COLOR_SCHEMES.warm.colors);
    expect(lastOptions().initialExpandLevel).toBe(2);
  });

  test('默认示例设为「空白大纲」时不创建 markmap 实例', async () => {
    localStorage.setItem('mindmap:default-sample', '');
    render(<MindMap />);
    expect(codeArea().value).toBe('');
    expect(screen.getByText('还没内容, 在左侧输入 Markdown 大纲')).toBeInTheDocument();
    expect(mockInstances).toHaveLength(0);
  });

  test('字号 / 配色 / 展开层级变化后按新参数重排 (复用同一实例)', async () => {
    render(<MindMap />);
    await waitRendered();

    await openSelect(3);
    await clickOption('18');
    await waitFor(() => expect(styleCss()).toContain('--markmap-font:18px/'));
    expect(FONT_SIZES).toContain(18);

    await openSelect(1);
    await clickOption('蓝');
    await waitFor(() => expect(lastOptions().color).toEqual(COLOR_SCHEMES.blue.colors));

    await openSelect(2);
    await clickOption('两层');
    await waitFor(() => expect(lastOptions().initialExpandLevel).toBe(2));

    // 参数变化走 setData 复用实例, 不重建
    expect(mockInstances).toHaveLength(1);
    expect(mockInstances[0].setData).toHaveBeenCalled();
  });

  test('深色模式下默认用深色导出底色, 并可手动改回白色', async () => {
    localStorage.setItem('theme-mode', 'dark');
    render(<ThemeProvider><MindMap /></ThemeProvider>);
    await waitRendered();
    expect(getComputedStyle(pane()).backgroundColor).toBe('rgb(31, 31, 31)');
    expect(styleCss()).toContain('--markmap-text-color:#e8e8e8');

    // 换成白底后文字同步改为深色, 避免导出「白底 + 浅字」
    await openSelect(4);
    await clickOption('白色');
    expect(getComputedStyle(pane()).backgroundColor).toBe('rgb(255, 255, 255)');
    await waitFor(() => expect(styleCss()).toContain('--markmap-text-color:#333'));
    expect(styleCss()).not.toContain('--markmap-text-color:#e8e8e8');
  });

  test('预览底色跟随「背景」切换, 透明为棋盘格', async () => {
    render(<MindMap />);
    await waitRendered();
    expect(getComputedStyle(pane()).backgroundColor).toBe('rgb(255, 255, 255)');

    await openSelect(4);
    await clickOption('透明');
    expect(pane().className).toContain('mindmap-preview-checker');
    expect(getComputedStyle(pane()).backgroundColor).toBe('');
  });

  test('切换示例: 源码 / 渲染内容同步更新', async () => {
    render(<MindMap />);
    await waitRendered();
    await openSelect(0);
    await clickOption('学习路线');
    const learning = SAMPLES.find((s) => s.id === 'learning')!;
    expect(codeArea().value).toBe(learning.code);
    await waitFor(() => expect(mockTransform.mock.calls[mockTransform.mock.calls.length - 1][0]).toBe(learning.code));
  });

  test('手动编辑大纲后重新渲染, 且不再关联示例名', async () => {
    render(<MindMap />);
    await waitRendered();
    fireEvent.change(codeArea(), { target: { value: '# 我的导图\n- 一\n- 二' } });
    await waitFor(() => expect(mockTransform.mock.calls[mockTransform.mock.calls.length - 1][0]).toBe('# 我的导图\n- 一\n- 二'));

    await exportAs('svg');
    await waitFor(() => expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('我的导图.svg'));
  });

  test('解析失败时展示错误详情并禁用导出, 修好后恢复', async () => {
    mockTransform.mockImplementationOnce(() => { throw new Error('markmap 解析失败'); });
    render(<MindMap />);
    await waitFor(() => expect(screen.getByText('渲染失败')).toBeInTheDocument());
    expect(screen.getByText(/markmap 解析失败/)).toBeInTheDocument();
    expect(btn('导出图片')).toBeDisabled();
    expect(btn('复制 SVG')).toBeDisabled();

    fireEvent.change(codeArea(), { target: { value: '# 修好了' } });
    await waitRendered();
    expect(screen.queryByText('渲染失败')).toBeNull();
    expect(btn('导出图片')).toBeEnabled();
  });

  test('清空大纲后回到占位提示并销毁实例', async () => {
    render(<MindMap />);
    await waitRendered();
    const inst = mockInstances[0];
    fireEvent.click(btn('清空'));
    expect(codeArea().value).toBe('');
    await waitFor(() => expect(screen.getByText('还没内容, 在左侧输入 Markdown 大纲')).toBeInTheDocument());
    // 画布容器保留 (常驻), 但隐藏起来
    expect(pane().style.display).toBe('none');
    expect(inst.destroy).toHaveBeenCalled();
    expect(btn('导出图片')).toBeDisabled();
    expect(btn('复制大纲')).toBeDisabled();
  });

  test('浏览器不支持 WebP 时对应菜单项禁用', async () => {
    stubCanvas(false);
    render(<MindMap />);
    await waitRendered();
    openExportMenu();
    expect(await menuItem('webp')).toHaveClass('ant-dropdown-menu-item-disabled');
    expect(await menuItem('png')).not.toHaveClass('ant-dropdown-menu-item-disabled');
  });
});

describe('MindMap 面板开关', () => {
  test('可隐藏输入 / 隐藏预览 (但不能同时隐藏, 另一个置灰), 并可随时恢复', async () => {
    render(<MindMap />);
    await waitRendered();

    fireEvent.click(btn('隐藏输入'));
    expect(cardTitle('Markdown 大纲')).toBeNull();
    expect(btn('显示输入')).toBeInTheDocument();
    expect(pane()).not.toBeNull();
    // 输入已收起: 再收起预览就什么都不剩了, 因此置灰
    expect(btn('隐藏预览')).toBeDisabled();

    fireEvent.click(btn('显示输入'));
    expect(cardTitle('Markdown 大纲')).not.toBeNull();
    expect(btn('隐藏预览')).toBeEnabled();

    fireEvent.click(btn('隐藏预览'));
    expect(pane()).toBeNull();
    expect(cardTitle('预览')).toBeNull();
    // 预览隐藏后实例被销毁 (markmap 依赖可见容器测量尺寸), 且全屏不再可用
    expect(mockInstances[0].destroy).toHaveBeenCalled();
    expect(btn('显示预览')).toBeInTheDocument();
    expect(btn('隐藏输入')).toBeDisabled();
    expect(btn('全屏')).toBeDisabled();

    fireEvent.click(btn('显示预览'));
    expect(cardTitle('预览')).not.toBeNull();
    expect(btn('隐藏输入')).toBeEnabled();
    expect(btn('全屏')).toBeEnabled();
    await waitFor(() => expect(mockInstances).toHaveLength(2));
  });

  test('适应窗口: 重新 fit 并提示', async () => {
    render(<MindMap />);
    await waitRendered();
    const inst = mockInstances[0];
    inst.fit.mockClear();
    fireEvent.click(btn('适应窗口'));
    await waitFor(() => expect(inst.fit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('已适应窗口')).toBeInTheDocument());
  });
});

describe('MindMap 全屏', () => {
  test('全屏时隐藏输入区也照样全屏, 两栏开关在全屏里仍旧可用', async () => {
    const { container } = render(<MindMap />);
    await waitRendered();
    fireEvent.click(btn('隐藏输入'));
    fireEvent.click(btn('全屏'));
    const stage = stageOf(container);
    expect(stage.className).toContain('mindmap-full');
    // 全屏容器始终是整页外壳: 预览卡与工具条都还在里面
    expect(stage).toContainElement(btn('隐藏预览'));
    expect(pane().closest('.mindmap-stage')).toBe(stage);
    expect(cardTitle('预览')).not.toBeNull();
    expect(cardTitle('Markdown 大纲')).toBeNull();
  });

  test('全屏按钮让整个页面全屏 (原生全屏不可用时的窗口内兜底)', async () => {
    const { container } = render(<MindMap />);
    await waitRendered();
    const stage = stageOf(container);
    expect(stage.className).not.toContain('mindmap-full');
    // 普通模式: 画布固定高度
    expect(pane().style.height).toBe(`${PREVIEW_HEIGHT}px`);
    expect(screen.getByText('思维导图说明')).toBeInTheDocument();

    fireEvent.click(btn('全屏'));
    expect(stage.className).toContain('mindmap-full');
    expect(btn('退出全屏')).toBeInTheDocument();
    // 整个页面全屏: 工具栏 / 输入区 / 预览都在同一个全屏容器里 (不是只有预览铺满)
    expect(stage).toContainElement(btn('退出全屏'));
    expect(cardTitle('Markdown 大纲')).not.toBeNull();
    expect(cardTitle('预览')).not.toBeNull();
    expect(pane().closest('.mindmap-stage')).toBe(stage);
    // 全屏时隐藏下方说明区, 把高度全让给画布
    expect(screen.queryByText('思维导图说明')).toBeNull();
    // 全屏模式: 高度交给 flex 撑满, 由 CSS 类控制
    expect(pane().style.height).toBe('');
    expect((pane().querySelector('svg') as SVGElement).style.height).toBe('100%');

    fireEvent.click(btn('退出全屏'));
    expect(stage.className).not.toContain('mindmap-full');
    expect(btn('全屏')).toBeInTheDocument();
    expect(screen.getByText('思维导图说明')).toBeInTheDocument();
    expect(pane().style.height).toBe(`${PREVIEW_HEIGHT}px`);
    expect((pane().querySelector('svg') as SVGElement).style.height).toBe(`${PREVIEW_HEIGHT}px`);
  });

  test('进入 / 退出全屏后重新 fit 整棵树', async () => {
    const { container } = render(<MindMap />);
    await waitRendered();
    const inst = mockInstances[0];
    inst.fit.mockClear();

    fireEvent.click(btn('全屏'));
    await waitFor(() => expect(inst.fit).toHaveBeenCalledTimes(1), WAIT);

    inst.fit.mockClear();
    fireEvent.click(btn('退出全屏'));
    await waitFor(() => expect(inst.fit).toHaveBeenCalledTimes(1), WAIT);
    expect(stageOf(container).className).not.toContain('mindmap-full');
  });

  test('窗口内全屏下按 Esc 退出', async () => {
    const { container } = render(<MindMap />);
    await waitRendered();
    fireEvent.click(btn('全屏'));
    expect(stageOf(container).className).toContain('mindmap-full');

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(stageOf(container).className).not.toContain('mindmap-full');
  });

  test('支持原生全屏时调用 Fullscreen API, 浏览器退出后同步状态', async () => {
    const request = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn().mockResolvedValue(undefined);
    let nativeEl: Element | null = null;
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: request });
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => nativeEl });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });
    try {
      const { container } = render(<MindMap />);
      await waitRendered();
      fireEvent.click(btn('全屏'));
      nativeEl = stageOf(container);
      expect(request).toHaveBeenCalledTimes(1);
      expect(stageOf(container).className).toContain('mindmap-full');

      // 原生全屏中按 Esc 由浏览器处理: 不应自己再调 exitFullscreen
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(exit).not.toHaveBeenCalled();

      // 浏览器退出原生全屏 -> fullscreenchange 同步按钮状态
      nativeEl = null;
      fireEvent(document, new Event('fullscreenchange'));
      await waitFor(() => expect(stageOf(container).className).not.toContain('mindmap-full'));

      // 点「退出全屏」时才真的调 exitFullscreen
      fireEvent.click(btn('全屏'));
      nativeEl = stageOf(container);
      fireEvent.click(btn('退出全屏'));
      expect(exit).toHaveBeenCalledTimes(1);
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).requestFullscreen;
      delete (document as unknown as Record<string, unknown>).fullscreenElement;
      delete (document as unknown as Record<string, unknown>).exitFullscreen;
    }
  });
});

describe('MindMap 导出', () => {
  test('「导出图片」下拉列出三种格式与说明', async () => {
    render(<MindMap />);
    await waitRendered();
    openExportMenu();
    const items = await waitFor(() => {
      const list = exportMenuItems();
      if (list.length !== 3) throw new Error(`菜单项数量: ${list.length}`);
      return list;
    });
    const text = items.map((el) => (el.textContent ?? '').replace(/\s+/g, ''));
    expect(text[0]).toContain('SVG图片');
    expect(text[0]).toContain('矢量图,始终透明背景');
    expect(text[1]).toContain('PNG图片');
    expect(text[2]).toContain('WebP图片');
    // 原来的三个导出按钮已合并, 卡片上不再有它们的文案
    expect(screen.queryByText('导出 SVG')).toBeNull();
    expect(screen.queryByText('导出 PNG')).toBeNull();
    expect(screen.queryByText('导出 WebP')).toBeNull();
  });

  test('导出 SVG: 按内容包围盒写入宽高与 viewBox', async () => {
    render(<MindMap />);
    await waitRendered();
    await exportAs('svg');

    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    const [ name, content, title, opts ] = (saveTextFile as jest.Mock).mock.calls[0];
    expect(name).toBe('mindmap-project.svg');
    expect(title).toBe('导出 SVG');
    expect(opts).toEqual({ filterName: 'SVG 图片', extensions: [ 'svg' ] });
    expect(content).toContain(`width="${BOX_W}" height="${BOX_H}"`);
    expect(content).toContain(`viewBox="-76 -56 ${BOX_W} ${BOX_H}"`);
    expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(content).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    await waitFor(() => expect(screen.getByText('已导出 mindmap-project.svg')).toBeInTheDocument());
    // 矢量导出不经过 canvas
    expect(ctxCalls).toHaveLength(0);
  });

  test('导出 PNG: 默认 1x + 白底', async () => {
    render(<MindMap />);
    await waitRendered();
    await exportAs('png');

    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1), WAIT);
    expect((savePngFile as jest.Mock).mock.calls[0]).toEqual([ 'mindmap-project.png', pngUrl ]);
    expect(ctxCalls).toEqual([
      { op: 'fillRect', args: [ 0, 0, BOX_W, BOX_H ] },
      { op: 'drawImage', args: [ 0, 0, BOX_W, BOX_H ] },
    ]);
    await waitFor(() => expect(screen.getByText('已导出 mindmap-project.png')).toBeInTheDocument());
  });

  test('导出 PNG: 2x + 透明背景时不铺底色且尺寸翻倍', async () => {
    render(<MindMap />);
    await waitRendered();
    await openSelect(5);
    await clickOption('200%');
    await openSelect(4);
    await clickOption('透明');
    await exportAs('png');

    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1), WAIT);
    expect(ctxCalls).toEqual([{ op: 'drawImage', args: [ 0, 0, BOX_W * 2, BOX_H * 2 ] }]);
  });

  test('导出 PNG: 150% 非整数倍率同样生效', async () => {
    render(<MindMap />);
    await waitRendered();
    await openSelect(5);
    await clickOption('150%');
    await exportAs('png');

    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1), WAIT);
    // 默认白底: 先铺底色再贴图, 尺寸都按 150% 取整
    expect(ctxCalls).toEqual([
      { op: 'fillRect', args: [ 0, 0, 408, 198 ] },
      { op: 'drawImage', args: [ 0, 0, 408, 198 ] },
    ]);
  });

  test('导出 WebP: 走字节写入并带扩展名过滤', async () => {
    render(<MindMap />);
    await waitRendered();
    await exportAs('webp');

    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(1), WAIT);
    const [ name, bytes, opts ] = (saveBytesFile as jest.Mock).mock.calls[0];
    expect(name).toBe('mindmap-project.webp');
    expect(Array.from(bytes as Uint8Array)).toEqual(Array.from(new TextEncoder().encode('webp')));
    expect(opts).toEqual({ title: '导出 WebP', filterName: 'WebP 图片', extensions: [ 'webp' ] });
    expect(ctxCalls.some((c) => c.op === 'fillRect')).toBe(true); // 默认白底
  });

  test('导出文件名跟随所选示例', async () => {
    render(<MindMap />);
    await waitRendered();
    await openSelect(0);
    await clickOption('需求拆解');
    await waitFor(() => expect(codeArea().value).toBe(SAMPLES.find((s) => s.id === 'requirements')!.code));

    await exportAs('svg');
    await waitFor(() => expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('mindmap-requirements.svg'));
  });

  test('用户在保存对话框取消时不提示成功', async () => {
    (saveTextFile as jest.Mock).mockResolvedValue(false);
    render(<MindMap />);
    await waitRendered();
    await exportAs('svg');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText(/已导出/)).toBeNull());
  });

  test('导出异常时提示错误原因', async () => {
    (savePngFile as jest.Mock).mockRejectedValue(new Error('磁盘已满'));
    render(<MindMap />);
    await waitRendered();
    await exportAs('png');
    await waitFor(() => expect(screen.getByText('导出失败: 磁盘已满')).toBeInTheDocument(), WAIT);
  });

  test('复制大纲 / 复制 SVG 写入粘贴板', async () => {
    render(<MindMap />);
    await waitRendered();

    fireEvent.click(btn('复制大纲'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLES[0].code));
    await waitFor(() => expect(screen.getByText('已复制大纲')).toBeInTheDocument());

    fireEvent.click(btn('复制 SVG'));
    await waitFor(() => expect((navigator.clipboard.writeText as jest.Mock).mock.calls.length).toBe(2));
    const svgText = (navigator.clipboard.writeText as jest.Mock).mock.calls[1][0] as string;
    expect(svgText).toContain(`viewBox="-76 -56 ${BOX_W} ${BOX_H}"`);
    await waitFor(() => expect(screen.getByText('已复制 SVG')).toBeInTheDocument());
  });
});

describe('MindMap 说明区', () => {
  test('渲染说明标题与要点 (含 markmap 写法与混用提示)', () => {
    const { container } = render(<MindMap />);
    expect(screen.getByText('思维导图说明')).toBeInTheDocument();
    const intro = container.querySelector('.intro') as HTMLElement;
    expect(intro.textContent).toContain('markmap');
    expect(intro.textContent).toContain('fold');
    expect(intro.textContent).toContain('foreignObject');
    expect(intro.textContent).toContain('frontmatter');
    expect(intro.textContent).toContain('KaTeX');
  });
});
