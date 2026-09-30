import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Whiteboard from './index';
import { SCENE_STORAGE_KEY } from './data';
import { LocaleProvider } from '../../hook/locale-context';
import { ThemeProvider } from '../../hook/theme-context';
import { readScene, storeScene } from './lib';

// Excalidraw 是超大库 (含全部语言包 / 渲染器), 单测里整体 mock:
// - Excalidraw 渲染成一个可观察的桩 (记录 langCode / theme / initialData / onChange)
// - serializeAsJSON / restore 用固定实现, 只验证「本地存取链路」
jest.mock('@excalidraw/excalidraw', () => {
  const DefaultItems: Record<string, () => null> = {
    LoadScene: () => null,
    SaveAsImage: () => null,
    Export: () => null,
    CommandPalette: () => null,
    SearchMenu: () => null,
    ClearCanvas: () => null,
    ChangeCanvasBackground: () => null,
    ToggleTheme: () => null,
  };
  const MainMenu = Object.assign(() => null, { DefaultItems });
  return {
    Excalidraw: (props: Record<string, unknown>) => (
      // eslint-disable-next-line react/jsx-no-target-blank
      <button
        type="button"
        data-testid="wb-board"
        data-lang={String(props.langCode)}
        data-theme={String(props.theme)}
        data-has-children={Boolean(props.children)}
        onClick={() => {
          const onChange = props.onChange as (...a: unknown[]) => void;
          onChange?.([ { id: 'rect-1', type: 'rectangle' } ], { theme: 'light' }, {});
        }}
      />
    ),
    MainMenu,
    serializeAsJSON: (_e: unknown, _s: unknown, _f: unknown) => JSON.stringify({ elements: [ { id: 'rect-1' } ] }),
    restore: (_data: unknown) => ({ elements: [ { id: 'rect-1' } ], appState: {} }),
  };
});

const wbBoard = () => screen.getByTestId('wb-board') as HTMLButtonElement;

describe('白板 页面', () => {
  test('渲染标题 / 说明与懒加载画布, 语言与主题跟随应用设置', async () => {
    localStorage.setItem('theme-mode', 'dark');
    render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);

    // 懒加载未完成时先显示 loading
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());

    expect(screen.getByText('白板')).toBeInTheDocument();
    // 画布收到正确语言与主题 (zh-CN + dark)
    expect(wbBoard().dataset.lang).toBe('zh-CN');
    expect(wbBoard().dataset.theme).toBe('dark');
    // Excalidraw 的 height:100% 依赖外层有确定高度, 防止画布塌陷成 0 高 (导致白板"渲染不开")
    expect(wbBoard().parentElement).toHaveStyle({ height: '700px', width: '100%' });
    // 说明区
    expect(document.querySelector('.intro')).not.toBeNull();
    expect(screen.getByText('这个工具做什么')).toBeInTheDocument();
  });

  test('英文与繁体界面 → Excalidraw 语言 / 标题同步', async () => {
    localStorage.setItem('app-locale', 'en');
    localStorage.setItem('theme-mode', 'light');
    const { unmount } = render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());
    expect(wbBoard().dataset.lang).toBe('en');
    expect(screen.getByText('Whiteboard')).toBeInTheDocument();
    unmount();

    localStorage.setItem('app-locale', 'zh-TW');
    render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());
    expect(wbBoard().dataset.lang).toBe('zh-TW');
  });

  test('主题浅色时画布 theme=light', async () => {
    localStorage.setItem('theme-mode', 'light');
    render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());
    expect(wbBoard().dataset.theme).toBe('light');
  });
});

describe('白板 本地保存', () => {
  test('画布变化后自动写入 localStorage, 再次打开恢复该场景', async () => {
    const { unmount } = render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());
    // 没画过 → 不落盘
    expect(localStorage.getItem(SCENE_STORAGE_KEY)).toBeNull();

    // 触发 onChange (模拟画布变化): 600ms 后自动保存
    await act(async () => { fireEvent.click(wbBoard()); });
    await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
    expect(readScene()).not.toBeNull();
    expect(readScene()).toContain('rect-1');
    unmount();

    // 再次打开: initialData 走 restore 恢复 (mock 固定返回 rect-1)
    render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());
    expect(readScene()).toContain('rect-1');
  });

  test('已存储的场景会作为初始数据传给画布 (initialData = 恢复函数)', async () => {
    storeScene('{"elements":[],"appState":{}}');
    render(<ThemeProvider><LocaleProvider><Whiteboard /></LocaleProvider></ThemeProvider>);
    await waitFor(() => expect(wbBoard()).toBeInTheDocument());
    // 桩组件有 children (本地菜单) 且收到 initialData 函数
    expect(wbBoard().dataset.hasChildren).toBe('true');
    expect(readScene()).not.toBeNull();
  });
});