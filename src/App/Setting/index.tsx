import { theme } from "antd";
import { SettingOutlined, SafetyOutlined, CalculatorOutlined, SwapOutlined, MoreOutlined, CodeOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect, type ReactNode, type UIEvent } from "react";
import "./setting.css";
import { itemList } from "./data";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  system: <SettingOutlined />,
  crypto: <SafetyOutlined />,
  'value-calc': <CalculatorOutlined />,
  convert: <SwapOutlined />,
  codec: <CodeOutlined />,
  misc: <MoreOutlined />,
};

const STORAGE_KEY = 'setting-active-category';

// 读取上次浏览的分类, 无则默认第一个
const readSaved = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && itemList.some((i) => i.key === saved)) return saved;
  } catch (e) { /* ignore */ }
  return itemList[0]?.key ?? '';
};

const Setting = () => {
  const { token } = theme.useToken();
  const [ active, setActive ] = useState<string>(readSaved);
  const [ hoverKey, setHoverKey ] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lockScrollRef = useRef(false); // 程序滚动期间忽略 spy, 防来回抖动

  const persist = (key: string) => {
    try { localStorage.setItem(STORAGE_KEY, key); } catch (e) { /* ignore */ }
  };

  // 初始定位到上次浏览的分类
  useEffect(() => {
    const wrap = scrollRef.current;
    if (!wrap) return;
    const el = blockRefs.current.get(active);
    if (el) {
      wrap.scrollTop = Math.max(0, el.offsetTop - wrap.offsetTop - 8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 左侧点击: 切换高亮 + 平滑滚动到对应分类块
  const switchTo = (key: string) => {
    setActive(key);
    persist(key);
    const wrap = scrollRef.current;
    const el = blockRefs.current.get(key);
    if (!wrap || !el) return;
    lockScrollRef.current = true;
    wrap.scrollTo({ top: Math.max(0, el.offsetTop - wrap.offsetTop - 8), behavior: 'smooth' });
    window.setTimeout(() => { lockScrollRef.current = false; }, 700);
  };

  // 右侧滚动: 自动切换左侧高亮 (VSCode 设置式锚点跟随)
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    if (lockScrollRef.current) return;
    const wrap = e.currentTarget;
    const line = wrap.scrollTop + 96; // 判定线: 该位置经过哪个分类块
    let cur: string | null = null;
    for (const item of itemList) {
      const el = blockRefs.current.get(item.key);
      if (el && el.offsetTop - wrap.offsetTop <= line) cur = item.key;
    }
    if (cur && cur !== active) {
      setActive(cur);
      persist(cur);
    }
  };

  return (
    <div style={ { height: '100%', display: 'flex', overflow: 'hidden' } }>
      {/* 左侧分类栏 (VSCode 设置样式) */}
      <div
        style={ {
          width: 200, flex: 'none', overflowY: 'auto', padding: '12px 8px',
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        } }
      >
        <div style={ { fontSize: 11, fontWeight: 700, color: token.colorTextTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 10px 8px' } }>
          设置
        </div>
        <div style={ { display: 'flex', flexDirection: 'column', gap: 2 } }>
          { itemList.map((item) => {
            const isActive = item.key === active;
            const isHover = item.key === hoverKey;
            return (
              <div
                key={ item.key }
                onClick={ () => switchTo(item.key) }
                onMouseEnter={ () => setHoverKey(item.key) }
                onMouseLeave={ () => setHoverKey((k) => (k === item.key ? null : k)) }
                role="menuitem"
                aria-current={ isActive ? 'page' : undefined }
                style={ {
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '8px 10px', borderRadius: 6, position: 'relative',
                  background: isActive ? token.colorPrimaryBg : isHover ? token.colorFillTertiary : 'transparent',
                  color: isActive ? token.colorPrimary : token.colorText,
                  fontWeight: isActive ? 600 : 400,
                } }
              >
                { isActive && (
                  <span style={ { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, background: token.colorPrimary } } />
                ) }
                <span style={ { fontSize: 15, display: 'inline-flex' } }>{ CATEGORY_ICONS[item.key] ?? null }</span>
                <span style={ { fontSize: 13 } }>{ item.label }</span>
              </div>
            );
          }) }
        </div>
      </div>

      {/* 右侧: 所有分类连排, 滚动时左侧 tab 自动切换 */}
      <div
        ref={ scrollRef }
        onScroll={ onScroll }
        style={ { flex: 1, minWidth: 0, overflowY: 'auto', background: token.colorBgLayout, padding: '4px 16px 0', position: 'relative' } }
      >
        { itemList.map((item) => (
          <div
            key={ item.key }
            ref={ (el) => {
              if (el) blockRefs.current.set(item.key, el);
              else blockRefs.current.delete(item.key);
            } }
            style={ { paddingBottom: 22 } }
          >
            <div style={ { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, padding: '14px 2px 8px', color: token.colorText } }>
              <span style={ { fontSize: 15, display: 'inline-flex' } }>{ CATEGORY_ICONS[item.key] ?? null }</span>
              { item.label }
            </div>
            <div style={ { background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, padding: '6px 16px 16px' } }>
              { item.children }
            </div>
          </div>
        )) }
        <div style={ { height: 24 } } />
      </div>
    </div>
  );
}

export default Setting;
