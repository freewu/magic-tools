import { AppContext } from "../hook/app-context";
import React,{ useState,useContext } from "react";
import { Layout,theme } from "antd";
const { Sider, Content } = Layout;
import { Routes, Route, Navigate } from "react-router-dom"
import { appList } from "../App";
// lazy 需要配合 Suspense 使用
import { lazy, Suspense } from "react";
import { getDefaultApp } from "../lib/setting";
import "./layout.css"

const MainContent :React.FC = () => {

  const { app, setApp } = useContext(AppContext)!
  const defaultApp = getDefaultApp();
  const { token: { colorBgContainer } } = theme.useToken();

  // 快速导入工具函数
  const lazyLoad = (moduleName: string) => {
    const Module = lazy(() => import(`../App/${moduleName}`));
    return (
      <>
      <Suspense fallback={<div>应用正在加载中...</div>}>
        <Module />
      </Suspense>
      </>
    );
  };

  return (
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
              return <Route path={ "/" + item.key } key={item.key} element={ lazyLoad(item.key) }></Route>
            })
          }
          // 默认显示应用
          <Route path="*" element={<Navigate to={"/" + defaultApp } replace />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default MainContent;