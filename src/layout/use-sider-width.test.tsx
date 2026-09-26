import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useSiderWidth } from './use-sider-width';
import { SIDER_WIDTH_DEFAULT, SIDER_WIDTH_MAX, SIDER_WIDTH_MIN, setSiderWidth } from '../lib/setting';

// 触摸事件在 jsdom 里不完整, 仅覆盖鼠标拖动 / 方向键 / 复位 / 持久化
const mouseDown = (startX :number) => ({ clientX: startX, preventDefault: () => {} }) as unknown as React.MouseEvent;
const mouseMove = (x :number) => act(() => {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: x }));
});
const mouseUp = () => act(() => { window.dispatchEvent(new MouseEvent('mouseup')); });

describe('侧边栏宽度拖拽 (useSiderWidth)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  test('初始宽度取本地存储 (未设置时默认)', () => {
    const { result } = renderHook(() => useSiderWidth());
    expect(result.current.width).toBe(SIDER_WIDTH_DEFAULT);
    expect(result.current.dragging).toBe(false);
  });

  test('拖动分隔条按指针位移改变宽度, 松手后持久化', () => {
    const { result } = renderHook(() => useSiderWidth());
    act(() => result.current.onDragStart(mouseDown(230)));
    expect(result.current.dragging).toBe(true);
    expect(document.body).toHaveClass('sider-resizing');
    mouseMove(300);
    expect(result.current.width).toBe(300);
    // 拖动中不写 localStorage
    expect(localStorage.getItem('sider-width')).toBeNull();
    mouseUp();
    expect(result.current.dragging).toBe(false);
    expect(document.body).not.toHaveClass('sider-resizing');
    expect(localStorage.getItem('sider-width')).toBe('300');
  });

  test('拖动受上下限约束', () => {
    const { result } = renderHook(() => useSiderWidth());
    act(() => result.current.onDragStart(mouseDown(230)));
    mouseMove(-500);
    expect(result.current.width).toBe(SIDER_WIDTH_MIN);
    mouseMove(5000);
    expect(result.current.width).toBe(SIDER_WIDTH_MAX);
    mouseUp();
    expect(localStorage.getItem('sider-width')).toBe(String(SIDER_WIDTH_MAX));
  });

  test('松手后不再跟随鼠标', () => {
    const { result } = renderHook(() => useSiderWidth());
    act(() => result.current.onDragStart(mouseDown(230)));
    mouseMove(280);
    mouseUp();
    mouseMove(400);
    expect(result.current.width).toBe(280);
  });

  test('resize 直接设置 (方向键微调) 并持久化; reset 恢复默认', () => {
    const { result } = renderHook(() => useSiderWidth());
    act(() => result.current.resize(230 + 20));
    expect(result.current.width).toBe(250);
    expect(localStorage.getItem('sider-width')).toBe('250');
    act(() => result.current.reset());
    expect(result.current.width).toBe(SIDER_WIDTH_DEFAULT);
    expect(localStorage.getItem('sider-width')).toBe(String(SIDER_WIDTH_DEFAULT));
  });

  test('设置中心调整宽度时侧边栏实时同步', () => {
    const { result } = renderHook(() => useSiderWidth());
    act(() => { setSiderWidth(320); });
    expect(result.current.width).toBe(320);
    expect(localStorage.getItem('sider-width')).toBe('320');
  });

  test('已有持久化宽度时按该宽度初始化', () => {
    localStorage.setItem('sider-width', '255');
    const { result } = renderHook(() => useSiderWidth());
    expect(result.current.width).toBe(255);
  });
});
