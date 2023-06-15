import { Space } from "antd";
import React,{ useState, useContext } from "react";
import { useNavigate } from "react-router-dom"
import "./appstore.css"
import Icon from '@ant-design/icons';
import { AppContext } from "../../hook/app-context";

export type AppItemProps = {
  uri: string, // 
  icon: any,
  label: string,
}

const AppItem = ({ uri, label, icon } :AppItemProps) => {

  const navigate = useNavigate();
  const { app, setApp } = useContext(AppContext)!

  const colClick = ( e:any ) => {
    const uri = e.currentTarget.getAttribute('data-uri');
    // 左边栏需要选中相关应用
    setApp(uri);
    navigate("/" + uri, { replace: true })
  }

  return (
    <div className="app" onClick={ colClick } data-uri={ uri }>
      <Space>
        {/* { icon } */}
        { label }
      </Space>
    </div>
  );
}

export default AppItem;