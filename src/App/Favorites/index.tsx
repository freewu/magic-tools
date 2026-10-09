// 我的收藏 (系统级页面): 展示已收藏的应用, 支持搜索 / 取消收藏 / 清空 / 拖动排序
// 收藏来源: 应用中心每个应用卡片右上角的星标; 悬浮入口 (FavoritesFab) 可直达本页
//
// 拖动排序采用 Pointer Events (而非 HTML5 原生拖放): Tauri/WebView2 下
// 窗口默认开启 dragDropEnabled 会拦截 HTML5 拖放事件, 原生 dragstart/drop 不会派发到页面;
// Pointer Events 不受影响 (悬浮入口也用同一机制), 同时天然支持触屏.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Divider, Empty, Input, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { AppstoreOutlined, ClearOutlined, HolderOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { appList } from '../index';
import { APP_TYPES } from '../app-types';
import { default as AppItem } from '../AppStore/app-item';
import { matchQuery } from '../AppStore/lib';
import { appNameOf } from '../app-i18n';
import { useLocale } from '../../hook/locale-context';
import { tr, trTpl } from '../../i18n/lang';
import shell from '../../i18n/shell';
import { useFavorites } from '../../hook/use-favorites';
import { clearFavorites, moveFavorite } from '../../lib/favorite';
import { GROUP_BY_TYPE_EVENT, getDefaultGroupByType } from './lib';
import favoritesLang from './lang';
import '../AppStore/appstore.css';
import './favorites.css';

const { Text } = Typography;

// 移动超过该像素才视为拖动 (避免把普通点击误判为拖动)
const DRAG_THRESHOLD = 5;

// 拖动过程中挂在 body 上的类名: 用于把整页光标统一成「抓着手」(grabbing),
// 因为拖动时指针会滑过其它卡片, 仅靠某个元素的 cursor 无法稳定生效
const DRAGGING_BODY_CLASS = 'favorites-dragging';

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
  // 按类型分组展示: 默认值取自设置 (默认关闭), 页面按钮可即时切换并写回设置
  const [ groupByType, setGroupByType ] = useState<boolean>(() => getDefaultGroupByType());
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

  // 设置页修改「收藏按类型展示」默认值时实时同步到本页
  // (标签页保活: 切走/切回不会重建组件, 故用事件而非重新读取)
  useEffect(() => {
    const onChange = (e :Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setGroupByType(typeof detail === 'boolean' ? detail : getDefaultGroupByType());
    };
    window.addEventListener(GROUP_BY_TYPE_EVENT, onChange);
    return () => window.removeEventListener(GROUP_BY_TYPE_EVENT, onChange);
  }, []);

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

  // 仅在「未搜索 (列表=完整收藏)」且收藏数 > 1 时允许拖动排序, 避免过滤视图下顺序歧义;
  // 按类型分组视图下卡片跨组移动无法表达顺序, 故一并禁用
  const canDrag = query.trim() === '' && items.length > 1 && !groupByType;

  // 按类型分组 (仅包含命中当前搜索的收藏; 顺序与分类名取自 APP_TYPES / shell 词典)
  const grouped = useMemo(
    () => groupByType
      ? APP_TYPES
        .map(({ key, name }) => ({
          key,
          name: tr(shell, locale, 'cat.' + key, name),
          children: visible.filter((a) => a.type === key),
        }))
        .filter((g) => g.children.length > 0)
      : [],
    [ groupByType, visible, locale ]
  );

  // 切换分组展示: 仅影响当前页面的即时视图, 不写回设置
  // (持久化的默认值由「设置 → 系统 → 收藏按类型展示」决定)
  const toggleGroupByType = () => setGroupByType((v) => !v);

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
        document.body.classList.add(DRAGGING_BODY_CLASS);
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
      document.body.classList.remove(DRAGGING_BODY_CLASS);
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

  // 单个收藏卡片 (含拖动排序包装层; 分组视图下 canDrag=false, 不可拖动)
  const renderCard = (item :typeof visible[number], index :number) => (
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
  );

  return (
    <div className="favorites" style={ { height: '100%', display: 'flex', flexDirection: 'column' } }>
      {/* 顶部工具栏: 左=搜索框, 右=按类型展示开关 + 收藏总数 + 清空 */}
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
          <Tooltip title={ tr(favoritesLang, locale, 'groupHint', '按应用类型分组展示收藏') }>
            <Button
              size="small"
              type={ groupByType ? 'primary' : 'default' }
              aria-pressed={ groupByType }
              icon={ groupByType ? <AppstoreOutlined /> : <UnorderedListOutlined /> }
              onClick={ toggleGroupByType }
            >{ tr(favoritesLang, locale, 'groupByType', '按类型展示') }</Button>
          </Tooltip>
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
          groupByType
            ? grouped.map((g) => (
              <div className="appstore-group" key={ g.key }>
                <Divider dashed orientation="left" plain className="appstore-group-divider">
                  <span className="appstore-group-name">{ g.name }</span>
                  <span className="appstore-group-count">( { g.children.length } )</span>
                </Divider>
                { g.children.map((item, i) => renderCard(item, i)) }
              </div>
            ))
            : visible.map((item, index) => renderCard(item, index))
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
