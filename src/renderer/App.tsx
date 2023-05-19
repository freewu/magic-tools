import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined 
} from '@ant-design/icons';
import {  Button, Layout, Menu, theme  } from "antd";
import {  useState  } from "react";;
const { Header, Sider, Content } = Layout;
import "./App.css"

const App = () => {
  const [ collapsed, setCollapsed ] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
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
          items={[
            {
              key: '1',
              icon: <UserOutlined />,
              label: 'nav 1',
            },
            {
              key: '2',
              icon: <VideoCameraOutlined />,
              label: 'nav 2',
            },
            {
              key: '3',
              icon: <UploadOutlined />,
              label: 'nav 3',
            },
          ]}
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
          Content
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;