// 侧边栏宽度拖拽: 左右两栏之间的分隔条拖动调整宽度 (鼠标 + 触摸 + 方向键), 松手后持久化
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  SIDER_WIDTH_DEFAULT,
  SIDER_WIDTH_EVENT,
  clampSiderWidth,
  getSiderWidth,
  setSiderWidth,
} from '../lib/setting';

/** 拖动起点 (按下时的指针 X 与当时的宽度, 用增量计算避免受分隔条位置影响) */
type DragState = { startX: number; startWidth: number } | null;

export interface SiderWidthApi {
  /** 当前宽度 (px) */
  width: number;
  /** 是否正在拖动 */
  dragging: boolean;
  /** 分隔条 mousedown / touchstart 处理 */
  onDragStart: (e :React.MouseEvent | React.TouchEvent) => void;
  /** 直接设置宽度 (方向键微调 / 双击复位), 立即持久化 */
  resize: (width :number) => void;
  /** 恢复默认宽度 */
  reset: () => void;
}

export const useSiderWidth = () :SiderWidthApi => {
  const [ width, setWidth ] = useState<number>(() => getSiderWidth());
  const [ dragging, setDragging ] = useState(false);
  // ref 镜像: 拖动过程中 window 事件回调里需要读到最新值
  const widthRef = useRef(width);
  const dragRef = useRef<DragState>(null);

  const apply = useCallback((next :number) => {
    const value = clampSiderWidth(next);
    widthRef.current = value;
    setWidth(value);
  }, []);

  const moveTo = useCallback((clientX :number) => {
    const drag = dragRef.current;
    if (!drag) return;
    apply(drag.startWidth + (clientX - drag.startX));
  }, [apply]);

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    // 只在松手时写 localStorage (拖动过程中不频繁写入)
    setSiderWidth(widthRef.current);
  }, []);

  // 拖动中: 监听 window 上的移动/松手 (移出边栏也能继续拖)
  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e :MouseEvent) => moveTo(e.clientX);
    const onTouchMove = (e :TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      moveTo(touch.clientX);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);
    // 拖动期间全局保持列宽光标并禁止选中文字
    document.body.classList.add('sider-resizing');
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endDrag);
      window.removeEventListener('touchcancel', endDrag);
      document.body.classList.remove('sider-resizing');
    };
  }, [dragging, moveTo, endDrag]);

  // 设置中心调整宽度时实时同步 (broadcast 事件, 无需重启)
  useEffect(() => {
    const onExternal = (e :Event) => {
      const value = (e as CustomEvent<number>).detail;
      if (typeof value === 'number' && value !== widthRef.current) apply(value);
    };
    window.addEventListener(SIDER_WIDTH_EVENT, onExternal);
    return () => window.removeEventListener(SIDER_WIDTH_EVENT, onExternal);
  }, [apply]);

  const onDragStart = useCallback((e :React.MouseEvent | React.TouchEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;
    // 阻止拖动时选中文字 / 触发父级点击
    e.preventDefault();
    dragRef.current = { startX: point.clientX, startWidth: widthRef.current };
    setDragging(true);
  }, []);

  const resize = useCallback((next :number) => {
    apply(next);
    setSiderWidth(widthRef.current);
  }, [apply]);

  const reset = useCallback(() => resize(SIDER_WIDTH_DEFAULT), [resize]);

  return { width, dragging, onDragStart, resize, reset };
};
