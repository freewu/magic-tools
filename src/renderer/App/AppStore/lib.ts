const DEFAULT_APP_ITEM = 'appstore:default-app';

// 获取默认显示的 App
export function getDefaultApp() :string  {
    const defaultApp = localStorage.getItem(DEFAULT_APP_ITEM);
    // 如果没有设置默认展示的应用，默认显示应用中心
    return (defaultApp === null)? "AppStore" : defaultApp;
}

// 设置默认显示的应用
export function setDefaultApp(app: string) : void  {
    localStorage.setItem(DEFAULT_APP_ITEM,app);
}