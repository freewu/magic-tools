// 我的收藏 (系统级页面): 展示已收藏的应用, 支持搜索 / 取消收藏 / 清空 / 拖动排序
// 收藏来源: 应用中心每个应用卡片右上角的星标; 悬浮入口 (FavoritesFab) 可直达本页
//
// 拖动排序采用 Pointer Events (而非 HTML5 原生拖放): Tauri/WebView2 下
// 窗口默认开启 dragDropEnabled 会拦截 HTML5 拖放事件, 原生 dragstart/drop 不会派发到页面;
// Pointer Events 不受影响 (悬浮入口也用同一机制), 同时天然支持触屏.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Input, Popconfirm, Space, Typography } from 'antd';
import { ClearOutlined, HolderOutlined, SearchOutlined } from '@ant-design/icons';
import { appList } from '../index';
import { default as AppItem } from '../AppStore/app-item';
import { matchQuery } from '../AppStore/lib';
import { appNameOf } from '../app-i18n';
import { useLocale } from '../../hook/locale-context';
import { tr, trTpl } from '../../i18n/lang';
import { useFavorites } from '../../hook/use-favorites';
import { clearFavorites, moveFavorite } from '../../lib/favorite';
import favoritesLang from './lang';
import '../AppStore/appstore.css';
import './favorites.css';

const { Text } = Typography;

// 移动超过该像素才视为拖动 (避免把普通点击误判为拖动)
const DRAG_THRESHOLD = 5;

type DragState = {
  key: string;      // 正在拖动的卡片 key (用于高亮)
  index: number;    // 当前所在索引 (随拖动实时更新)
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;  // 是否已越过阈值进入拖动状态
};

const Favorites = () => {
  const { locale } = useLocale();
  const favorites = useFavorites();
  // 搜索关键词: 匹配应用名 (三语) / 目录名
  const [ query, setQuery ] = useState<string>('');
  // 拖动排序: 高亮正在拖动的卡片
  const [ draggingKey, setDraggingKey ] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  // 拖动期间挂在 window 上的监听清理函数 (卸载兜底)
  const cleanupRef = useRef<(() => void) | null>(null);
  // 本次指针交互是否发生过拖动: 拖动结束后紧接着的 click 需要被吞掉, 避免误跳转
  const movedRef = useRef(false);

  // 卸载时兜底清理拖动监听
  useEffect(() => () => cleanupRef.current?.(), []);

  // 收藏列表 -> 应用卡片 (按收藏顺序展示, 名称随语言; 过滤已下线/不存在的 app key)
  const items = useMemo(
    () => favorites
      .map((key) => appList.find((a) => a.key === key))
      .filter((a): a is (typeof appList)[number] => Boolean(a))
      .map((a) => ({ ...a, label: appNameOf(locale, a.key, a.label) })),
    [favorites, locale]
  );

  // 关键词过滤 (空关键词保留全部)
  const visible = useMemo(
    () => items.filter((a) => matchQuery(query, [
      a.label,
      appNameOf('en', a.key, a.label),
      appNameOf('zh-TW', a.key, a.label),
      a.key,
    ])),
    [items, query]
  );

  // 仅在「未搜索 (列表=完整收藏)」且收藏数 > 1 时允许拖动排序, 避免过滤视图下顺序歧义
  const canDrag = query.trim() === '' && items.length > 1;

  // 命中测试: 返回指针所在卡片在列表中的索引 (指针落在卡片间空隙时返回 null)
  const indexAtPoint = (x: number, y: number) :number | null => {
    const list = listRef.current;
    if (!list) return null;
    const nodes = list.querySelectorAll<HTMLElement>('.favorites-sortable');
    for (let i = 0; i < nodes.length; i += 1) {
      const r = nodes[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  };

  const onPointerDown = (index: number, key: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag) return;
    // 仅响应鼠标左键 (触屏 / 笔的 button 恒为 0)
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const st: DragState = { key, index, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, active: false };
    dragRef.current = st;

    // 用 window 级监听而非 setPointerCapture: 后者可能把后续 click 重定向到捕获元素,
    // 导致卡片自身的点击跳转失效; window 监听不受此影响, 也不怕指针移出卡片
    const onMove = (ev: PointerEvent) => {
      const s = dragRef.current;
      if (!s || s.pointerId !== ev.pointerId) return;
      if (!s.active) {
        const moved = Math.abs(ev.clientX - s.startX) >= DRAG_THRESHOLD
          || Math.abs(ev.clientY - s.startY) >= DRAG_THRESHOLD;
        if (!moved) return;
        s.active = true;
        movedRef.current = true;
        setDraggingKey(s.key);
      }
      // 指针落在哪张卡片上就把它挪到该位置 (实时重排)
      const idx = indexAtPoint(ev.clientX, ev.clientY);
      if (idx != null && idx !== s.index) {
        moveFavorite(s.index, idx);
        s.index = idx;
      }
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      cleanupRef.current = null;
    };
    const onUp = (ev: PointerEvent) => {
      const s = dragRef.current;
      if (!s || s.pointerId !== ev.pointerId) return;
      dragRef.current = null;
      setDraggingKey(null);
      cleanup();
    };
    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // 每次指针按下 (捕获阶段, 星级按钮 stopPropagation 也拦不住) 重置「刚拖动过」标记:
  // movedRef 只需覆盖「本次手势 pointerup 后紧接着补发的那次 click」, 下次按下前即可安全清空
  const onPointerDownCapture = () => {
    movedRef.current = false;
  };

  // 拖动结束后浏览器仍会派发一次 click: 捕获阶段拦截, 避免打开应用
  const onClickCapture = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  return (
    <div className="favorites" style={ { height: '100%', display: 'flex', flexDirection: 'column' } }>
      {/* 顶部工具栏: 左=搜索框, 右=收藏总数 + 清空 */}
      <div className="appstore-toolbar">
        <Input
          size="small"
          allowClear
          value={ query }
          style={ { width: 220 } }
          prefix={ <SearchOutlined /> }
          placeholder={ tr(favoritesLang, locale, 'search', '搜索收藏的应用') }
          onChange={ (e) => setQuery(e.target.value) }
        />
        <Space size={ 12 } className="favorites-toolbar-right">
          { canDrag && (
            <Text type="secondary" className="favorites-drag-hint">
              <HolderOutlined /> { tr(favoritesLang, locale, 'dragHint', '拖动卡片可调整顺序') }
            </Text>
          ) }
          <Text type="secondary" className="appstore-toolbar-count">
            { trTpl(favoritesLang, locale, 'count', { n: items.length }) }
          </Text>
          { items.length > 0 && (
            <Popconfirm
              title={ tr(favoritesLang, locale, 'clearConfirm', '确定清空全部收藏吗？') }
              okText={ tr(favoritesLang, locale, 'clear', '清空收藏') }
              cancelText={ tr(favoritesLang, locale, 'cancel', '取消') }
              onConfirm={ clearFavorites }
            >
              <Button size="small" danger icon={ <ClearOutlined /> }>
                { tr(favoritesLang, locale, 'clear', '清空收藏') }
              </Button>
            </Popconfirm>
          ) }
        </Space>
      </div>

      <div
        ref={ listRef }
        className="appstore"
        style={ { flex: 1, minHeight: 0, overflowY: 'auto' } }
      >
        {
          visible.map((item, index) => (
            <div
              key={ item.key }
              className={ 'favorites-sortable'
                + (canDrag ? ' favorites-sortable-draggable' : '')
                + (draggingKey === item.key ? ' favorites-sortable-dragging' : '') }
              onPointerDownCapture={ canDrag ? onPointerDownCapture : undefined }
              onPointerDown={ canDrag ? onPointerDown(index, item.key) : undefined }
              onClickCapture={ canDrag ? onClickCapture : undefined }
            >
              <AppItem
                uri={ item.key }
                icon={ item.icon }
                label={ item.label }
                desktop={ item.desktop }
                web={ item.web }
              />
              { canDrag && (
                <span
                  className="favorites-drag-handle"
                  title={ tr(favoritesLang, locale, 'dragHandle', '拖动排序') }
                  aria-hidden="true"
                >
                  <HolderOutlined />
                </span>
              ) }
            </div>
          ))
        }
        {
          // 尚未收藏任何应用
          items.length === 0 && (
            <div className="appstore-empty favorites-empty">
              <Empty
                image={ Empty.PRESENTED_IMAGE_SIMPLE }
                description={
                  <span className="favorites-empty-text">
                    <span className="favorites-empty-title">{ tr(favoritesLang, locale, 'empty', '还没有收藏的应用') }</span>
                    <span className="favorites-empty-hint">{ tr(favoritesLang, locale, 'emptyHint', '前往「应用中心」，点击应用右上角的星标即可收藏') }</span>
                  </span>
                }
              />
            </div>
          )
        }
        {
          // 有收藏但当前搜索无匹配
          items.length > 0 && visible.length === 0 && (
            <div className="appstore-empty">
              <Empty image={ Empty.PRESENTED_IMAGE_SIMPLE } description={ tr(favoritesLang, locale, 'noMatch', '没有匹配的收藏') } />
            </div>
          )
        }
      </div>
    </div>
  );
}

export default Favorites;
