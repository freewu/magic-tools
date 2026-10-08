// 收藏悬浮入口 (FAB)
// - 固定悬浮在内容区之上, 可拖动到任意位置 (鼠标 / 触摸), 松手后持久化位置
// - 与侧边栏宽度拖拽一样监听 window 级指针事件, 移出自身范围仍可继续拖动
// - 单击进入「我的收藏」; 右键可复位到默认位置; 拖动结束的那次 click 不触发跳转
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Badge, Tooltip } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../hook/app-context';
import { useLocale } from '../hook/locale-context';
import { tr } from '../i18n/lang';
import { useFavorites } from '../hook/use-favorites';
import { FAB_POS_DEFAULT, clamp01, getFabPos, setFabPos } from '../lib/fab';
import type { FabPos } from '../lib/fab';
import favoritesLang from '../App/Favorites/lang';
import './favorites-fab.css';

// 悬浮入口尺寸 (px); 可拖动范围 = 视口尺寸 - 该值, 保证按钮始终完整可见
export const FAB_SIZE = 46;
// 位移阈值 (px): 小于该值视为点击, 否则视为拖动
const DRAG_THRESHOLD = 4;

type DragState = { pointerId :number, startX :number, startY :number, origin :FabPos, moved :boolean };

const FavoritesFab :React.FC = () => {
  const navigate = useNavigate();
  const appCtx = useContext(AppContext);
  const { locale } = useLocale();
  const favorites = useFavorites();
  const [ pos, setPosState ] = useState<FabPos>(() => getFabPos());
  const [ dragging, setDragging ] = useState(false);
  const [ viewport, setViewport ] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  // ref 镜像: window / pointer 事件回调内需读到最新值
  const posRef = useRef(pos);
  const dragRef = useRef<DragState | null>(null);
  const movedRef = useRef(false);

  const applyPos = useCallback((p :FabPos) => {
    posRef.current = p;
    setPosState(p);
  }, []);

  // 窗口尺寸变化时重算可拖动范围 (比例坐标不变, 按钮不会跑到视口外)
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const maxX = Math.max(0, viewport.w - FAB_SIZE);
  const maxY = Math.max(0, viewport.h - FAB_SIZE);
  const left = pos.x * maxX;
  const top = pos.y * maxY;

  const onPointerDown = (e :React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origin: posRef.current, moved: false };
    movedRef.current = false;
    setDragging(true);
  };

  const onPointerMove = (e :React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    movedRef.current = true;
    const nx = maxX <= 0 ? 0 : clamp01((drag.origin.x * maxX + dx) / maxX);
    const ny = maxY <= 0 ? 0 : clamp01((drag.origin.y * maxY + dy) / maxY);
    applyPos({ x: nx, y: ny });
  };

  const endDrag = (e :React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* jsdom 等环境可能未实现 */ }
    // 拖动过才持久化 (单击不写 localStorage)
    if (drag.moved) setFabPos(posRef.current);
  };

  const onClick = () => {
    // 拖动结束时浏览器仍会派发一次 click, 此处吞掉, 避免误跳转
    if (movedRef.current) { movedRef.current = false; return; }
    appCtx?.setApp('Favorites');
    navigate('/Favorites', { replace: true });
  };

  // 右键复位到默认位置
  const onContextMenu = (e :React.MouseEvent) => {
    e.preventDefault();
    applyPos(FAB_POS_DEFAULT);
    setFabPos(FAB_POS_DEFAULT);
  };

  const count = favorites.length;
  const title = tr(favoritesLang, locale, 'fab', '打开我的收藏（可拖动到任意位置）');

  return (
    <Tooltip title={ title } placement="left">
      <button
        type="button"
        className={ 'favorites-fab' + (dragging ? ' favorites-fab-dragging' : '') }
        style={ { left, top } }
        onPointerDown={ onPointerDown }
        onPointerMove={ onPointerMove }
        onPointerUp={ endDrag }
        onPointerCancel={ endDrag }
        onClick={ onClick }
        onContextMenu={ onContextMenu }
        aria-label={ title }
      >
        <Badge count={ count } size="small" offset={ [ 2, -2 ] }>
          { count > 0 ? <StarFilled /> : <StarOutlined /> }
        </Badge>
      </button>
    </Tooltip>
  );
};

export default FavoritesFab;
