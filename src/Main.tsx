import { Layout } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"
import { ThemeProvider } from "./hook/theme-context"
import { AppContextProvider } from "./hook/app-context"
import { default as MainSider } from './layout/main-sider';
import { default as MainContent } from './layout/main-content';
import { listenOpenPage } from "./lib/tauri";

const Main :React.FC = () => {

  const navigate = useNavigate();

  // 托盘菜单「设置 / 帮助 / 应用列表」-> 前端页面跳转
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenOpenPage((page) => {
      navigate('/' + page, { replace: true });
    }).then((un) => {
      unlisten = un;
    });
    return () => {
      unlisten?.();
    };
  }, [navigate]);

  // ctrl + h 进入帮助页面
  document.addEventListener('keydown',(e) => {
    // 当按下ctrl、alt、shift键时e对应的ctrlKey、altKey、shiftKey是为true的。Mac电脑的 command 键是metaKey
    if((e.ctrlKey || e.metaKey) && e.code === 'KeyH') {
      navigate('Help', { replace: true });
    }
    // 
    if((e.altKey || e.metaKey) && e.code === 'KeyS') {
      navigate('Setting', { replace: true });
    }
  });

  return (
    <ThemeProvider>
      <AppContextProvider>
        <></>
        <Layout style={ { height: '100vh' } }>
          <MainSider />
          <MainContent />
        </Layout>
      </AppContextProvider>
    </ThemeProvider>
  );
};

export default Main;