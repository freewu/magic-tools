import { Space, Tooltip } from "antd";
import React,{ useState, useContext } from "react";
import { useNavigate } from "react-router-dom"
import "./appstore.css"
import Icon from '@ant-design/icons';
import { DesktopOutlined } from "@ant-design/icons";
import { AppContext } from "../../hook/app-context";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import appstoreLang from "./lang";

export type AppItemProps = {
  uri: string, // 
  icon: any,
  label: string,
  desktop?: boolean, // 仅桌面版可用 (浏览器演示版无法提供该能力)
}

const AppItem = ({ uri, label, icon, desktop } :AppItemProps) => {

  const navigate = useNavigate();
  const { app, setApp } = useContext(AppContext)!
  const { locale } = useLocale();

  const colClick = ( e:any ) => {
    const uri = e.currentTarget.getAttribute('data-uri');
    // 左边栏需要选中相关应用
    setApp(uri);
    navigate("/" + uri, { replace: true })
  }

  return (
    <div className="app" onClick={ colClick } data-uri={ uri }>
      {/* 仅桌面版标识 (浏览器演示版下页面内会给出提示并禁用请求按钮) */}
      { desktop && (
        <Tooltip title={ tr(appstoreLang, locale, 'desktopOnly', '仅桌面版') }>
          <span className="app-desktop-badge">
            <DesktopOutlined />
            <span className="app-desktop-badge-text">{ tr(appstoreLang, locale, 'desktopOnly', '仅桌面版') }</span>
          </span>
        </Tooltip>
      ) }
      <Space>
        {/* { icon } */}
        { label }
      </Space>
    </div>
  );
}

export default AppItem;
