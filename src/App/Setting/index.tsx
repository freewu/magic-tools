import { theme } from "antd";
import { SettingOutlined, SafetyOutlined, CalculatorOutlined, SwapOutlined, MoreOutlined } from '@ant-design/icons';
import { useState, type ReactNode } from "react";
import "./setting.css";
import { itemList } from "./data";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  system: <SettingOutlined />,
  crypto: <SafetyOutlined />,
  'value-calc': <CalculatorOutlined />,
  convert: <SwapOutlined />,
  misc: <MoreOutlined />,
};

const STORAGE_KEY = 'setting-active-category';

const Setting = () => {
  const { token } = theme.useToken();
  const [ active, setActive ] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && itemList.some((i) => i.key === saved)) return saved;
      const def = itemList[0]?.key ?? '';
      localStorage.setItem(STORAGE_KEY, def);
      return def;
    } catch (e) { /* ignore */ }
    return itemList[0]?.key ?? '';
  });
  const [ hoverKey, setHoverKey ] = useState<string | null>(null);
  const current = itemList.find((i) => i.key === active) ?? itemList[0];

  const switchTo = (key: string) => {
    setActive(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch (e) { /* ignore */ }
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

      {/* 右侧设置内容区 */}
      <div style={ { flex: 1, minWidth: 0, overflowY: 'auto', background: token.colorBgLayout, padding: '6px 16px 16px' } }>
        <div style={ { fontSize: 20, fontWeight: 700, padding: '12px 2px 6px', color: token.colorText } }>
          { current?.label ?? '' }
        </div>
        <div style={ { background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, padding: '6px 16px 16px' } }>
          { current?.children }
        </div>
      </div>
    </div>
  );
}

export default Setting;
