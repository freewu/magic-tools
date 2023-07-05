import { Tabs, Form, Switch } from "antd";
import { useState } from "react";
import "./setting.css";
import { debounce } from "../../lib";
import { itemList } from "./data";

const Setting = () => {
  const genSettingFormHeight = () => {
    return (window.innerHeight - 70) + "px";
  };

  const [ height, setHeight ] = useState(genSettingFormHeight()); // 窗口大小高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genSettingFormHeight()) },100) );

  return (
    <div style={ { height: height, overflowY: "auto" } }>
      <Tabs items={ itemList } />
    </div>
  );
}

export default Setting;