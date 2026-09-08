import { AppContext } from "../hook/app-context";
import { MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space } from "antd";
import React,{ useState,useContext } from "react";
const { Sider, Content } = Layout;
import { useNavigate } from "react-router-dom"
import { appList, genMenuList } from "../App";
import { getSiderFlag } from "../lib/setting";
import { openUrl } from "../lib/tauri";
import { useUpdate } from "./update-context";
import { getVersion } from "../version";
import "./layout.css";

const MainSider: React.FC = () => {

  const { app, setApp } = useContext(AppContext)!
  const { hasUpdate, latest, dismiss } = useUpdate();
  const [ collapsed, setCollapsed ] = useState(!getSiderFlag());
  const navigate = useNavigate();

  // menu 点击处理
  const menuClick = ( e:any ) => {
    setApp(e.key);
    navigate(e.key, { replace: true });
  }

  return (
  <Sider trigger={null} collapsible collapsed={ collapsed } style={ { height: '100%' } }>
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%' } }>
      <Space style={ { padding: '4px 8px', flexShrink: 0 } }>
        <Button
            title = { collapsed ? "展开" : "收起" }
            type="link"
            icon={ collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed) }
            style={{
              fontSize: '18px',
              width: "24px"
            }}
        />
        <Button
            title = { "应用中心" }
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
          items={ genMenuList(appList) }
        />
      </div>

      {/* 底部区: 展开时左侧显示版本号 (有新版本时右上角呼吸角标, 点击进帮助; 角标点击直达更新页), 右侧设置图标; 折叠时仅设置图标居中 */}
      <div style={ {
        flexShrink: 0,
        background: '#001529',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
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
                title={ `有新版 v${latest?.version} 可用, 点击查看更新内容并下载` }
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
        <Button
            title={ "设置" }
            type="text"
            icon={ <SettingOutlined /> }
            onClick={ () => { setApp('Setting'); navigate('Setting', { replace: true }); } }
            style={ {
              color: 'rgba(255,255,255,0.85)',
              fontSize: '15px',
              height: 34,
              width: collapsed ? '100%' : 34,
              padding: 0,
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