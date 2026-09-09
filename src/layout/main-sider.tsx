import { AppContext } from "../hook/app-context";
import { useLocale, LOCALE_IDS, LOCALE_LABELS, LOCALE_FLAG } from "../hook/locale-context";
import type { LocaleId } from "../i18n/lang";
import { tr, trTpl } from "../i18n/lang";
import shell from "../i18n/shell";
import { MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined, SettingOutlined, CheckOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Layout, Menu, Space } from "antd";
import React, { useMemo, useState, useContext } from "react";
const { Sider } = Layout;
import { useNavigate } from "react-router-dom"
import { appList, genMenuList } from "../App";
import { appNameOf } from "../App/app-i18n";
import { getSiderFlag } from "../lib/setting";
import { openUrl } from "../lib/tauri";
import { useUpdate } from "./update-context";
import { getVersion } from "../version";
import "./layout.css";

const MainSider: React.FC = () => {

  const { app, setApp } = useContext(AppContext)!
  const { hasUpdate, latest, dismiss } = useUpdate();
  const { locale, setLocale } = useLocale();
  const [ collapsed, setCollapsed ] = useState(!getSiderFlag());
  const navigate = useNavigate();

  // menu 点击处理
  const menuClick = ( e:any ) => {
    setApp(e.key);
    navigate(e.key, { replace: true });
  }

  // 语言切换下拉 (托盘「语言」同构): 简 / 繁 / EN, 选项为「文字 + 旗标图片 (assets/lang)」
  const langMenu = {
    items: LOCALE_IDS.map((id) => ({
      key: id,
      label: (
        <span style={ { display: 'inline-flex', alignItems: 'center', gap: 6 } }>
          <span>{ LOCALE_LABELS[id] }</span>
          <img
            src={ LOCALE_FLAG[id] }
            alt={ LOCALE_LABELS[id] }
            style={ { width: 18, height: 14, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' } }
          />
        </span>
      ),
      icon: id === locale ? <CheckOutlined /> : undefined,
    })),
    onClick: ({ key }: { key: string }) => setLocale(key as LocaleId),
  };

  // 菜单分类名 + 工具名随语言实时重算 (分类徽标逻辑与原 genMenuList 一致)
  const menuItems = useMemo(() => {
    return genMenuList(appList).map((g) => ({
      key: g.key,
      icon: g.icon,
      label: (
        <span className="menu-group-label">
          <span>{ tr(shell, locale, 'cat.' + g.key, g.name) }</span>
          { g.children.length > 0 && <Badge count={ g.children.length } size="small" overflowCount={ 999 } style={ { backgroundColor: '#1677ff' } } /> }
        </span>
      ),
      children: g.children.map((c) => ({
        key: c.key,
        icon: c.icon,
        label: appNameOf(locale, c.key, c.label),
      })),
    }));
  }, [locale]);

  return (
  <Sider trigger={null} collapsible collapsed={ collapsed } style={ { height: '100%' } }>
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%' } }>
      <Space style={ { padding: '4px 8px', flexShrink: 0 } }>
        <Button
            title = { collapsed ? tr(shell, locale, 'sider.expand', '展开') : tr(shell, locale, 'sider.collapse', '收起') }
            type="link"
            icon={ collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed) }
            style={{
              fontSize: '18px',
              width: "24px"
            }}
        />
        <Button
            title = { appNameOf(locale, 'AppStore', '应用中心') }
            type="link"
            icon={ <AppstoreOutlined />}
            onClick={() => { setApp('AppStore'); navigate('AppStore', { replace: true }); } }
            style={{
              fontSize: '18px',
              width: "24px"
            }}
        />
      </Space>

      <div className="demo-logo-vertical" style={ { flexShrink: 0 } } />

      {/* 菜单区: 滚动占满中部, 底部留给设置按钮 */}
      <div style={ { flex: 1, minHeight: 0, overflowY: 'auto', background: '#001529' } }>
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={ collapsed }
          selectedKeys= { [ app ] }
          // activeKey={ '' }
          onClick = { menuClick }
          items={ menuItems }
        />
      </div>

      {/* 底部区: 展开时左侧版本号 (有新版本时右上角呼吸角标, 点击进帮助; 角标点击直达更新页),
          右侧紧贴的语言切换 + 设置图标; 折叠时两图标紧贴靠左下角 */}
      <div style={ {
        flexShrink: 0,
        background: '#001529',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'flex-start' : 'space-between',
        gap: 0,
      } }>
        { !collapsed && (
          <div
            onClick={ () => { setApp('Help'); navigate('Help', { replace: true }); } }
            style={ {
              cursor: 'pointer',
              position: 'relative',
              lineHeight: 1,
              padding: '6px 0',
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            } }
          >
            v{ getVersion() }
            { hasUpdate && (
              <span
                title={ trTpl(shell, locale, 'update.dot', { v: latest?.version ?? '' }) }
                onClick={ (e) => {
                  e.stopPropagation();
                  if (latest) void openUrl(latest.url);
                  dismiss();
                } }
                className="update-badge-dot"
                style={ {
                  position: 'absolute',
                  top: 2,
                  right: -8,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ff4d4f',
                  cursor: 'pointer',
                } }
              />
            ) }
          </div>
        ) }
        <Dropdown menu={ langMenu } trigger={ ['click'] } placement="top">
          <Button
            title={ tr(shell, locale, 'lang', '界面语言') }
            type="text"
            style={ {
              color: 'rgba(255,255,255,0.85)',
              fontSize: '15px',
              height: 34,
              width: 34,
              padding: 0,
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            } }
          >
            <img
              src={ LOCALE_FLAG[locale] }
              alt=""
              style={ { width: 20, height: 15, objectFit: 'cover', borderRadius: 2 } }
            />
          </Button>
        </Dropdown>
        <Button
            title={ appNameOf(locale, 'Setting', '设置') }
            type="text"
            icon={ <SettingOutlined /> }
            onClick={ () => { setApp('Setting'); navigate('Setting', { replace: true }); } }
            style={ {
              color: 'rgba(255,255,255,0.85)',
              fontSize: '15px',
              height: 34,
              width: 34,
              padding: 0,
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            } }
        />
      </div>
    </div>
  </Sider>
  )
};

export default MainSider;
