import { AppContext } from "../hook/app-context";
import { MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space } from "antd";
import React,{ useState,useContext } from "react";
const { Sider, Content } = Layout;
import { useNavigate } from "react-router-dom"
import { appList, AppItem } from "../App";
import { getSiderFlag } from "../lib/setting";
import "./layout.css";

const MainSider: React.FC = () => {

  const { app, setApp } = useContext(AppContext)!
  const [ collapsed, setCollapsed ] = useState(!getSiderFlag());
  const navigate = useNavigate();

  // menu 点击处理
  const menuClick = ( e:any ) => {
    setApp(e.key);
    navigate(e.key, { replace: true });
  }

  /*
      key,
    icon,
    children,
    label,
    type,
  */

  let menuList = new Map([
    ["codec", { key: 'codec',  label: '编解码',  icon: '', children: new Array<AppItem> }],
    ["crypto", { key: 'crypto',  label: '加解密',  icon: '', children: new Array<AppItem> }],
    ["convert", { key: 'convert',  label: '类型转换',  icon: '', children: new Array<AppItem> }],
    ["formatter", { key: 'formatter',  label: '格式化',  icon: '', children: new Array<AppItem> }],
    ["value-calc", { key: 'value-calc',  label: '值计算',  icon: '', children: new Array<AppItem> }],
    ["misc", { key: 'misc',  label: '其它',  icon: '', children:[] }],
  ]);

  // 生成
  const genMenuList = (appList :Array<AppItem>) => {
    // todo 收藏
    // 按 app type 分类
    for(let item of appList) {
      if(menuList.has(item.type)) {
        let v = menuList.get(item.type);
        v?.children?.push(item)
        if(v !== undefined) menuList.set(item.type,v);
      }
    }
    return Array.from(menuList.values());
  }

  return (
  <Sider trigger={null} collapsible collapsed={ collapsed }>
    <Space>
      <Button
          title = { collapsed ? "展开" : "收起" }
          type="link"
          icon={ collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed) }
          style={{
            fontSize: '18px',
            width: "24px"
          }}
      />
      <Button
          title = { "设置" }
          type="link"
          icon={ <SettingOutlined /> }
          onClick={ () => { setApp('Setting'); navigate('Setting', { replace: true }); } }
          style={{
            fontSize: '18px',
            width: "24px"
          }}
      />
      <Button
          title = { "应用中心" }
          type="link"
          icon={ <AppstoreOutlined />}
          onClick={() => { setApp('AppStore'); navigate('AppStore', { replace: true }); } }
          style={{
            fontSize: '18px',
            width: "24px"
          }}
      />
    </Space>

    <div className="demo-logo-vertical" />

    <Menu
      theme="dark"
      mode="inline"
      selectedKeys= { [ app ] }
      // activeKey={ '' }
      onClick = { menuClick }
      items={ genMenuList(appList) }
    />
  </Sider>
  )
};

export default MainSider;