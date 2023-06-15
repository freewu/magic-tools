
import { appList, genMenuList } from "../index";
import { useState } from "react";
import "./appstore.css"
import { default as AppType } from "./app-type";
import { debounce } from "../../lib";

const AppStore = () => {
  const genHeight = () => {
    return (window.innerHeight - 70) + "px";
  };

  const [ height, setHeight ] = useState(genHeight()); // 窗口大小高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genHeight()) },100) );

  return (
    <div className="appstore" style={ { height: height, overflowY: "auto" } }>
    {
      genMenuList(appList).map((parent, index) => {
        return (
          <AppType 
            uri= { parent.key } 
            key= { parent.key + index } 
            label=  {parent.label } 
            icon= { parent.label } 
            children={ parent.children }/>
        );
      })
    }
    </div>
  );
}

export default AppStore;