import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";

import { getDefaultURL, setDefaultURL } from "./lib";


export const WebSocketClientSetting = () => {

  const [ url, setUrl ] = useState(getDefaultURL()); // 默认连接地址

  return (
    <>
      <Divider orientation="left" plain>WebSocket 调试</Divider>
      <Form.Item label="默认连接地址">
        <Input 
          allowClear
          style={ { width: "520px" } }
          onChange={ (e) => { setUrl(e.target.value); setDefaultURL(e.target.value); }   }
          value= { url } />
      </Form.Item>
    </>
  );
}