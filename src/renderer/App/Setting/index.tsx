import { Tabs } from "antd";
import "./setting.css";
import { itemList } from "./data";

const Setting = () => {
  return (
    <div style={ { height: '100%', overflowY: "auto" } }>
      <Tabs items={ itemList } />
    </div>
  );
}

export default Setting;