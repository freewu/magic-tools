// // app 全局传递
// // 处理 Appstore 选中 App 后 sider 栏选中状态的问题
// import React,{ useState, createContext } from "react";
// import { getDefaultApp } from "../lib/setting";

// // 创建 context，约定数据类型，设置初始值
// export const AppContext = createContext<{
//   app :string,
//   setApp :(app :string)=>void,
// } | null>(null);

// // ContextProvide组件
// export const AppContextProvider : React.FC<{ children: React.ReactNode }> = (props :any) => {
//   const [ app, setApp ] = useState(getDefaultApp())
//   return (
//     <AppContext.Provider value={ { app, setApp} }>
//       { props.children }
//     </AppContext.Provider>
//   )
// }

import React, { createContext, useState } from "react";
import { getDefaultApp } from "../lib/setting";

// 创建context，约定数据类型，设置初始值
export const AppContext = createContext<{
    app: string,
    setApp: (app :string)=>void,
} | null>(null)

// ContextProvide组件
export const AppContextProvider: React.FC<{ children: React.ReactNode[] }> = (props) => {
  
  const [ app, setApp] = useState(getDefaultApp())

  return (
    <AppContext.Provider value={{ app, setApp }}>
      {props.children}
    </AppContext.Provider>
  );
};