import { Layout } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom"
import { AppContextProvider } from "./hook/app-context"
import { default as MainSider } from './layout/main-sider';
import { default as MainContent } from './layout/main-content';

const Main :React.FC = () => {

  const navigate = useNavigate();

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
    <AppContextProvider>
      <></>
      <Layout>
        <MainSider />
        <MainContent />
      </Layout>
    </AppContextProvider>
  );
};

export default Main;