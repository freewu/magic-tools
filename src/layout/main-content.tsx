import { AppContext } from "../hook/app-context";
import { useLocale } from "../hook/locale-context";
import { tr } from "../i18n/lang";
import shell from "../i18n/shell";
import { appNameOf } from "../App/app-i18n";
import React,{ useState,useContext } from "react";
import { Breadcrumb, Dropdown, Layout, Tabs, theme } from "antd";
const { Content } = Layout;
import { Navigate, useNavigate } from "react-router-dom"
import { appList, genMenuList } from "../App";
// lazy 需要配合 Suspense 使用
import { Suspense } from "react";
import { getDefaultApp } from "../lib/setting";
import "./layout.css"

// 非工具类固定页面 (不在 appList 中): key -> zh-CN 页面名称 (显示名随语言动态取 lang 包)
const PAGE_NAMES: Record<string,string> = {
  "AppStore": "应用中心",
  "Setting": "设置",
  "Help": "帮助页面",
};

// 内置页面不显示面包屑 (无上级分类层级, 只有 Tabs 标签)
const NO_CRUMB_PAGES = new Set(Object.keys(PAGE_NAMES));

// 页面组件映射 (懒加载): 固定页面 + appList 中的工具应用
// 组件实例按 key 固定, 保证切换 Tab 时页面保持挂载 (填写的数据不丢失)
import { lazyPage } from "../App/app-modules";
const pageComps = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();
for (const key of [...Object.keys(PAGE_NAMES), ...appList.map((i) => i.key)]) {
    pageComps.set(key, lazyPage(key));
}
// 该 key 是否是真实页面 (固定页面或已注册应用)
const validPage = (key :string) => PAGE_NAMES[key] !== undefined || appList.some((i) => i.key === key);

// 单个页面容器: memo 后仅在首次挂载时渲染, 切走/切回不会重建组件 (保活核心)
const KeepAlivePage = React.memo(({ Page } :{ Page :React.ComponentType }) => {
    return <Page />;
});

const MainContent :React.FC = () => {

  const { app, tabs, closeTab, closeLeft, closeRight, closeOthers } = useContext(AppContext)!
  const defaultApp = getDefaultApp();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { token: { colorBgContainer } } = theme.useToken();

  // 类型分组 -> 分组名称 (面包屑的类型; 取纯文本 name, 避免带上菜单里的应用数徽标)
  const groupLabels = new Map(genMenuList(appList).map((g) => [g.key, tr(shell, locale, 'cat.' + g.key, g.name ?? String(g.label))]));

  // 页面 key -> 应用名称 (随当前语言)
  const pageName = (key :string) => {
    const info = appList.find((item) => item.key === key);
    if (info) return appNameOf(locale, key, info.label);
    if (PAGE_NAMES[key]) return appNameOf(locale, key, PAGE_NAMES[key]);
    return key;
  };

  // 面包屑: <类型> / <应用名称> (固定页面只显示页面名称)
  const crumbItems = () => {
    const key = app;
    const info = appList.find((item) => item.key === key);
    if (info) {
      return [
        { title: groupLabels.get(info.type) ?? tr(shell, locale, 'cat.misc', '其它') },
        { title: appNameOf(locale, info.key, info.label) },
      ];
    }
    return PAGE_NAMES[key] ? [{ title: appNameOf(locale, key, PAGE_NAMES[key]) }] : [{ title: key }];
  };

  // 保活容器: 所有已打开标签的页面保持挂载, 仅显示当前页
  // (切换 Tab / 面包屑切换都不再销毁页面, 原页面填写的数据保留)
  const pages = tabs.filter((k) => validPage(k));
  const showKey = validPage(app) ? app : (pages.length > 0 ? pages[pages.length - 1] : '');
  if (validPage(app) && !pages.includes(app)) pages.push(app);

  // 标签右键菜单: 关闭左侧 / 关闭右侧 / 关闭其他 (文案随语言)
  const tabMenuItems = (key :string) => {
    const idx = tabs.indexOf(key);
    return [
      { key: 'left',  label: tr(shell, locale, 'tabs.left', '关闭左侧'), disabled: idx <= 0 },
      { key: 'right', label: tr(shell, locale, 'tabs.right', '关闭右侧'), disabled: idx < 0 || idx === tabs.length - 1 },
      { key: 'others', label: tr(shell, locale, 'tabs.others', '关闭其他'), disabled: tabs.length <= 1 },
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

  // 当前页是否需要面包屑 (内置页面 AppStore / Setting / Help 不显示)
  const hideCrumb = NO_CRUMB_PAGES.has(app);

  return (
    <Layout style={ { height: '100%' } }>
      {/* 顶部: 最近打开应用标签 + 面包屑 (内置页面仅保留标签) */}
      <div className={ hideCrumb ? "page-head page-head--no-crumb" : "page-head" }>
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
        { !hideCrumb && <Breadcrumb className="page-breadcrumb" items={ crumbItems() } /> }
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
        { showKey === '' ? (
          // 非法地址 -> 回到默认应用
          <Navigate to={ "/" + defaultApp } replace />
        ) : (
          <div className="keep-alive">
            {
              pages.map((key) => (
                <div key={ key } className="keep-alive-item" style={ { display: key === showKey ? undefined : 'none' } }>
                  <Suspense fallback={ <div>{ tr(shell, locale, 'loading', '应用正在加载中...') }</div> }>
                    <KeepAlivePage Page={ pageComps.get(key)! } />
                  </Suspense>
                </div>
              ))
            }
          </div>
        ) }
      </Content>
    </Layout>
  )
}

export default MainContent;