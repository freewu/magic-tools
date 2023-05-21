import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme } from "antd";
import { useState } from "react";;
const { Sider, Content } = Layout;
import "./Main.css"
import { useNavigate,Routes, Route, Link } from "react-router-dom"
import { appList } from "./App";
// lazy 需要配合 Suspense 使用
import { lazy, Suspense } from "react";

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
  const [ collapsed, setCollapsed ] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const navigate = useNavigate()
  
  // menu 点击处理
  const menuClick = ( e:any ) => {
    navigate(e.key, { replace: true })
  }

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <Button
            title = { collapsed ? "展开" : "收起" }
            type="link"
            icon={ collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '18px',
            }}
        />
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
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
            {
              appList.map((item, index) => {
                return <Route path={ "/" + item.key } element={ lazyLoad(item.key) }></Route>
              })
            }
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Main;