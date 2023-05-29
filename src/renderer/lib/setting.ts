// 获取侧边栏展示状态 true 展开 false 关闭 
export function getSiderFlag()  {
  const siderFlag = localStorage.getItem('sider-flag');
  return (siderFlag === "true")? true : false;
}

// 获取默认展示的 app
import { getDefaultApp } from "../App/AppStore/lib"
export {
  getDefaultApp
}