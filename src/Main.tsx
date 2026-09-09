import { Layout } from "antd";
import React, { useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom"
import { ThemeProvider } from "./hook/theme-context"
import { LocaleProvider } from "./hook/locale-context"
import { AppContextProvider } from "./hook/app-context"
import { default as MainSider } from './layout/main-sider';
import { default as MainContent } from './layout/main-content';
import { UpdateProvider } from './layout/update-context';
import { listenOpenPage } from "./lib/tauri";
import { getVersion } from './version';

const Main :React.FC = () => {

  const navigate = useNavigate();

  // 页面标题带当前版本号 (与 package.json 同步, 免手工维护)
  useEffect(() => {
    document.title = `Magic Tools v${getVersion()}`;
  }, []);

  // 首帧渲染完成后淡出启动加载页: 至少展示约 260ms 避免闪白, 再 380ms 渐隐过渡
  useLayoutEffect(() => {
    const win = window as unknown as { __mtStart?: number };
    const since = performance.now() - (win.__mtStart ?? performance.now());
    const delay = Math.max(0, 260 - since);
    const el = document.getElementById('splash');
    const timer = window.setTimeout(() => {
      if (!el) return;
      el.classList.add('splash-hide');
      window.setTimeout(() => el.remove(), 450);
    }, delay);
    return () => window.clearTimeout(timer);
  }, []);

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
    <LocaleProvider>
      <ThemeProvider>
        <AppContextProvider>
          <UpdateProvider>
            <Layout style={ { height: '100vh' } }>
              <MainSider />
              <MainContent />
            </Layout>
          </UpdateProvider>
        </AppContextProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
};

export default Main;