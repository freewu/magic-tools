import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme } from "antd";
import { useState } from "react";;
const { Sider, Content } = Layout;
import "./Main.css"
import { useNavigate,Routes, Route, Link } from "react-router-dom"
import { appList } from "./App";

import { lazy, Suspense } from "react";

// const Demo1 = () => {
//   return <div>
//       <main>
//         <h2>Welcome to the demo1 page</h2>
//       </main>
//       <nav>
//         <ol>
//           demo1
//         </ol>
//       </nav>
//   </div>
// }
import { default as Demo1 } from "./App/Demo1"
console.log(Demo1);

// 快速导入工具函数
const lazyLoad = (moduleName: string) => {
  const Module = lazy(() => import(`./App/${moduleName}`));
  //const Module = lazy(() => import(`./App/Demo1`));
  console.log(Module); 
  return (
    <Suspense fallback={<div>正在加载...</div>}>
      <Module />
    </Suspense>
  );
};

const Main = () => {
  const [ collapsed, setCollapsed ] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const navigate = useNavigate()
  const menuClick = ( e:any ) => {
    navigate(e.key, { replace: true })
  }

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <Button
            title = { collapsed ? "展开" : "收起" }
            type="link"
            icon={ collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '18px',
            }}
        />
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          onClick = { menuClick }
          items={ appList }
        />
      </Sider>
      <Layout>
        <Content
          style={{
            margin: '12px 12px',
            padding: 24,
            minHeight: 500,
            background: colorBgContainer,
          }}
        >
          <Routes>
            {
              appList.map((item, index) => {
                console.log(item);
                return <Route path={ "/" + item.key } element={ lazyLoad(item.key) }></Route>
                //return <Route path={ "/" + item.key } element={ <Demo1 /> }></Route>
              })
            }
            {/* <Route path="/" element={<Home />}></Route>
            <Route path="/about" element={<About />}></Route> */}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Main;