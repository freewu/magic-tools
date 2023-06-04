import { Space } from "antd";
import React,{ useState,useContext } from "react";
import { appList } from "../index";
import { useNavigate } from "react-router-dom"
import "./appstore.css"
import Icon from '@ant-design/icons';
import { AppContext } from "../../hook/app-context";

const AppStore = () => {

  const navigate = useNavigate();
  const { app, setApp } = useContext(AppContext)!

  const colClick = ( e:any ) => {
    const uri = e.currentTarget.getAttribute('data-uri');
    // 左边栏需要选中相关应用
    setApp(uri);
    navigate("/" + uri, { replace: true })
  }

  const handStyle = { cursor: "pointer",margin: "5px" };

  return (
    <div className="appstore">
    {
      appList.map((item, index) => {
        if ("" == item.icon) {
          return (
            <div className="app" key={ item.key } onClick={ colClick } style={ handStyle } data-uri={ item.key }>
              <Space>
                { item.label }
              </Space>
            </div>
          );
        } else {
          return (
            <div className="app" onClick={ colClick } style={ handStyle } data-uri={ item.key }>
              <Space>
                { item.icon }
                { item.label }
              </Space>
            </div>
          );
        }
      })
    }
    </div>
  );
}

export default AppStore;