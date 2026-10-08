import { Space, Tooltip } from "antd";
import React,{ useState, useContext } from "react";
import { useNavigate } from "react-router-dom"
import "./appstore.css"
import Icon from '@ant-design/icons';
import { DesktopOutlined, GlobalOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { AppContext } from "../../hook/app-context";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import { useFavorites } from "../../hook/use-favorites";
import { toggleFavorite } from "../../lib/favorite";
import appstoreLang from "./lang";

export type AppItemProps = {
  uri: string, // 
  icon: any,
  label: string,
  desktop?: boolean, // 仅桌面版可用 (浏览器演示版无法提供该能力)
  web?: boolean, // 仅 Web 版可用 (桌面版内嵌 WebView 无法提供该能力)
}

const AppItem = ({ uri, label, icon, desktop, web } :AppItemProps) => {

  const navigate = useNavigate();
  const { app, setApp } = useContext(AppContext)!
  const { locale } = useLocale();
  const favorites = useFavorites();
  const faved = favorites.includes(uri);

  const colClick = ( e:any ) => {
    const uri = e.currentTarget.getAttribute('data-uri');
    // 左边栏需要选中相关应用
    setApp(uri);
    navigate("/" + uri, { replace: true })
  }

  // 星标点击: 收藏 / 取消收藏 (阻止冒泡, 不触发卡片跳转)
  const onStarClick = ( e:React.MouseEvent ) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(uri);
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
      {/* 仅 Web 标识 (桌面版内嵌 WebView 无法提供该能力, 页面内会给出提示并禁用录制按钮) */}
      { web && (
        <Tooltip title={ tr(appstoreLang, locale, 'webOnly', '仅 Web') }>
          <span className="app-web-badge">
            <GlobalOutlined />
            <span className="app-web-badge-text">{ tr(appstoreLang, locale, 'webOnly', '仅 Web') }</span>
          </span>
        </Tooltip>
      ) }
      {/* 收藏星标: 卡片右上角, 点击收藏 / 取消收藏 */}
      <Tooltip title={ tr(appstoreLang, locale, faved ? 'unfavorite' : 'favorite', faved ? '取消收藏' : '收藏') }>
        <button
          type="button"
          className={ 'app-star' + (faved ? ' app-star-on' : '') }
          aria-label={ tr(appstoreLang, locale, faved ? 'unfavorite' : 'favorite', faved ? '取消收藏' : '收藏') }
          aria-pressed={ faved }
          onClick={ onStarClick }
          onPointerDown={ (e) => e.stopPropagation() }
        >
          { faved ? <StarFilled /> : <StarOutlined /> }
        </button>
      </Tooltip>
      <Space>
        {/* { icon } */}
        { label }
      </Space>
    </div>
  );
}

export default AppItem;
