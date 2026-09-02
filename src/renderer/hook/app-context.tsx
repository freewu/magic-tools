// app 全局传递
// - 当前打开的应用 (app): 侧边栏选中态 / 标签页高亮
// - 最近打开的应用标签 (tabs): 内容区顶部 Tab 列表, 支持切换 / 关闭
// - app 与路由地址(useLocation)保持同步: 菜单/应用中心/托盘/后退前进都会触发
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultApp } from "../lib/setting";

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
} | null>(null)

// 从 localStorage 恢复标签列表
const readTabs = () :string[] => {
    try {
        const raw = localStorage.getItem(TABS_STORAGE_KEY);
        if(!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.filter((k :unknown) => typeof k === 'string') : [];
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

    return (
        <AppContext.Provider value={{ app, setApp, tabs, closeTab }}>
            {props.children}
        </AppContext.Provider>
    );
};
