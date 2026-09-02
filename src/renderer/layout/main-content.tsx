import { AppContext } from "../hook/app-context";
import React,{ useState,useContext } from "react";
import { Breadcrumb, Dropdown, Layout, Tabs, theme } from "antd";
const { Content } = Layout;
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { appList, genMenuList } from "../App";
// lazy 需要配合 Suspense 使用
import { lazy, Suspense } from "react";
import { getDefaultApp } from "../lib/setting";
import "./layout.css"

// 非工具类固定页面 (不在 appList 中): key -> 页面名称
const PAGE_NAMES: Record<string,string> = {
  "AppStore": "应用中心",
  "Setting": "设置",
  "Help": "帮助页面",
};

const MainContent :React.FC = () => {

  const { app, tabs, closeTab, closeLeft, closeRight, closeOthers } = useContext(AppContext)!
  const defaultApp = getDefaultApp();
  const navigate = useNavigate();
  const { token: { colorBgContainer } } = theme.useToken();

  // 类型分组 -> 分组名称 (面包屑的类型)
  const groupLabels = new Map(genMenuList(appList).map((g) => [g.key, g.label]));

  // 页面 key -> 应用名称
  const pageName = (key :string) => {
    const info = appList.find((item) => item.key === key);
    return info ? info.label : (PAGE_NAMES[key] ?? key);
  };

  // 面包屑: <类型> / <应用名称> (固定页面只显示页面名称)
  const crumbItems = () => {
    const key = app;
    const info = appList.find((item) => item.key === key);
    if (info) {
      return [
        { title: groupLabels.get(info.type) ?? '其它' },
        { title: info.label },
      ];
    }
    return PAGE_NAMES[key] ? [{ title: PAGE_NAMES[key] }] : [{ title: key }];
  };

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

  // 标签右键菜单: 关闭左侧 / 关闭右侧 / 关闭其他
  const tabMenuItems = (key :string) => {
    const idx = tabs.indexOf(key);
    return [
      { key: 'left',  label: '关闭左侧', disabled: idx <= 0 },
      { key: 'right', label: '关闭右侧', disabled: idx < 0 || idx === tabs.length - 1 },
      { key: 'others', label: '关闭其他', disabled: tabs.length <= 1 },
    ];
  };
  const tabActions: Record<string, (key :string) => void> = { left: closeLeft, right: closeRight, others: closeOthers };
  const tabLabel = (key :string) => (
    <Dropdown
      menu={{
        items: tabMenuItems(key),
        onClick: ({ key: action }) => { tabActions[String(action)]?.(key); },
      }}
      trigger={['contextMenu']}
    >
      <span>{ pageName(key) }</span>
    </Dropdown>
  );

  return (
    <Layout style={ { height: '100%' } }>
      {/* 顶部: 最近打开应用标签 + 面包屑 */}
      <div className="page-head">
        <Tabs
          className="page-tabs"
          type="editable-card"
          size="small"
          hideAdd
          activeKey={ tabs.includes(app) ? app : (tabs.length > 0 ? tabs[tabs.length - 1] : undefined) }
          items={ tabs.map((key) => ({ key, label: tabLabel(key), closable: true })) }
          onChange={ (key) => { if(key !== app) navigate('/' + key, { replace: true }); } }
          onEdit={ (targetKey, action) => {
            if(action === 'remove' && typeof targetKey === 'string') closeTab(targetKey);
          } }
        />
        <Breadcrumb className="page-breadcrumb" items={ crumbItems() } />
      </div>
      <Content
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          margin: '0 12px 12px 12px',
          padding: 24,
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