// app 全局传递
// - 当前打开的应用 (app): 侧边栏选中态 / 标签页高亮
// - 最近打开的应用标签 (tabs): 内容区顶部 Tab 列表, 支持切换 / 关闭
// - app 与路由地址(useLocation)保持同步: 菜单/应用中心/托盘/后退前进都会触发
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultApp } from "../lib/setting";
import { appList } from "../App";

// 标签持久化 key (重启后恢复最近打开的应用)
const TABS_STORAGE_KEY = "recent-tabs";
// 最多保留的标签数量 (超出时丢弃最早的)
const MAX_TABS = 12;

// 创建 context，约定数据类型，设置初始值
export const AppContext = createContext<{
    app: string,
    setApp: (app :string)=>void,
    // 最近打开的应用标签列表 (key 数组, 越靠右打开越晚)
    tabs: string[],
    // 关闭指定标签; 若关闭的是当前应用, 自动切换到最近打开的其他标签
    closeTab: (key :string)=>void,
    // 关闭左侧 / 右侧 / 其他标签 (key 本身保留打开)
    closeLeft: (key :string)=>void,
    closeRight: (key :string)=>void,
    closeOthers: (key :string)=>void,
} | null>(null)

// 固定页面 (不在 appList 中, 同样允许出现在标签里)
const FIXED_PAGE_KEYS = ['Setting', 'AppStore', 'Help'];
// 当前有效的页面 key 集合 (防止恢复到旧版本/加载遗漏产生的无效标签 -> 点开无响应)
const validPageKeys = new Set([...appList.map((i) => i.key), ...FIXED_PAGE_KEYS]);

// 从 localStorage 恢复标签列表
const readTabs = () :string[] => {
    try {
        const raw = localStorage.getItem(TABS_STORAGE_KEY);
        if(!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.filter((k :unknown) => typeof k === 'string' && validPageKeys.has(k)) : [];
    } catch (e) {
        console.error('read recent tabs failed:', e);
        return [];
    }
}

// 当前 hash 路由对应的 app key
const routeKeyOf = (pathname :string) => {
    const key = pathname.replace(/^\//, '');
    return key === '' ? getDefaultApp() : key;
}

// ContextProvide组件
export const AppContextProvider: React.FC<{ children: React.ReactNode[] }> = (props) => {

    const location = useLocation();
    const navigate = useNavigate();

    // 初始化: 优先跟随当前路由地址 (刷新/直达链接场景)
    const [ app, setApp ] = useState(() => routeKeyOf(location.pathname))
    const [ tabs, setTabs ] = useState<string[]>(() => readTabs())

    // 路由变化 (菜单点击/应用中心/托盘/浏览器前进后退) -> 同步当前应用
    useEffect(() => {
        setApp(routeKeyOf(location.pathname));
    }, [location.pathname])

    // 路由变化 -> 记录到最近打开标签 (去重, 超上限丢弃最早)
    useEffect(() => {
        const key = routeKeyOf(location.pathname);
        setTabs((prev) => {
            if (prev.includes(key)) return prev;
            const next = [...prev, key];
            return next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next;
        });
    }, [location.pathname])

    // 标签变化 -> 持久化 (重启后恢复)
    useEffect(() => {
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    }, [tabs])

    // 关闭标签: 若关闭的是当前应用则跳转到最后一个剩余标签
    const closeTab = useCallback((key :string) => {
        setTabs((prev) => prev.filter((k) => k !== key));
        // 关闭的是当前打开的应用
        if (key === app) {
            navigate('/' + (tabs.filter((k) => k !== key).pop() ?? getDefaultApp()), { replace: true });
        }
    }, [app, tabs, navigate])

    // 关闭左侧: 保留 key 及其右侧标签
    const closeLeft = useCallback((key :string) => {
        const idx = tabs.indexOf(key);
        if(idx <= 0) return;
        if(tabs.slice(0, idx).includes(app)) navigate('/' + key, { replace: true });
        setTabs(tabs.slice(idx));
    }, [tabs, app, navigate])

    // 关闭右侧: 保留 key 及其左侧标签
    const closeRight = useCallback((key :string) => {
        const idx = tabs.indexOf(key);
        if(idx < 0 || idx === tabs.length - 1) return;
        if(app !== key && tabs.indexOf(app) > idx) navigate('/' + key, { replace: true });
        setTabs(tabs.slice(0, idx + 1));
    }, [tabs, app, navigate])

    // 关闭其他: 仅保留 key 标签
    const closeOthers = useCallback((key :string) => {
        if(tabs.length <= 1) return;
        if(app !== key) navigate('/' + key, { replace: true });
        setTabs([key]);
    }, [tabs, app, navigate])

    return (
        <AppContext.Provider value={{ app, setApp, tabs, closeTab, closeLeft, closeRight, closeOthers }}>
            {props.children}
        </AppContext.Provider>
    );
};
