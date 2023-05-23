// 获取侧边栏展示状态 true 展开 false 关闭 
export function getSiderFlag()  {
    const siderFlag = localStorage.getItem('sider-flag');
    return (siderFlag === "true")? true : false;
}

// 获取默认显示的 App
export function getDefaultApp()  {
    const defaultApp = localStorage.getItem('default-app');
    // 如果没有设置默认展示的应用，默认显示应用中心
    return (defaultApp === null)? "AppStore" : defaultApp;
}