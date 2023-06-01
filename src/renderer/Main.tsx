import { MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme, Space } from "antd";
import { useState, } from "react";
const { Sider, Content } = Layout;
import "./Main.css"
import { useNavigate,Routes, Route, Navigate } from "react-router-dom"
import { appList } from "./App";
// lazy 需要配合 Suspense 使用
import { lazy, Suspense } from "react";
import { getSiderFlag, getDefaultApp } from "./lib/setting";

// 快速导入工具函数
const lazyLoad = (moduleName: string) => {
  const Module = lazy(() => import(`./App/${moduleName}`));
  return (
    <Suspense fallback={<div>应用正在加载中...</div>}>
      <Module />
    </Suspense>
  );
};

const Main = () => {
  const defaultApp = getDefaultApp();
  const [ collapsed, setCollapsed ] = useState(!getSiderFlag());
  const [ app, setApp ] = useState(defaultApp);
  const { token: { colorBgContainer } } = theme.useToken();
  const navigate = useNavigate();

  // menu 点击处理
  const menuClick = ( e:any ) => {
    setApp(e.key);
    navigate(e.key, { replace: true });
  }

  // ctrl + h 进入帮助页面
  document.addEventListener('keydown',(e) => {
    // 当按下ctrl、alt、shift键时e对应的ctrlKey、altKey、shiftKey是为true的。Mac电脑的 command 键是metaKey
    if((e.ctrlKey || e.metaKey) && e.code === 'KeyH') {
      navigate('Help', { replace: true });
    }
  })

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={ collapsed }>
        <Space>
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
              title = { "设置" }
              type="link"
              icon={ <SettingOutlined /> }
              onClick={ () => { setApp(''); navigate('Setting', { replace: true }); } }
              style={{
                fontSize: '18px',
                width: "24px"
              }}
          />
          <Button
              title = { "应用中心" }
              type="link"
              icon={ <AppstoreOutlined />}
              onClick={() => { setApp(''); navigate('AppStore', { replace: true }); } }
              style={{
                fontSize: '18px',
                width: "24px"
              }}
          />
        </Space>

        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          activeKey={ app }
          onClick = { menuClick }
          items={ appList }
        />
      </Sider>
      <Layout>
        <Content
          style={{
            margin: '12px 12px',
            padding: 24,
            minHeight: 500,
            background: colorBgContainer,
          }}
        >
          <Routes>
            // 应用中心
            <Route path={ "/AppStore" } element={ lazyLoad("AppStore") }></Route>
            // 设置
            <Route path={ "/Setting" } element={ lazyLoad("Setting") }></Route>
            // 帮助页面
            <Route path={ "/Help" } element={ lazyLoad("Help") }></Route>
            {
              appList.map((item, index) => {
                return <Route path={ "/" + item.key } element={ lazyLoad(item.key) }></Route>
              })
            }
            // 默认显示应用
            <Route path="*" element={<Navigate to={"/" + defaultApp } replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Main;