import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { getDefaultPassphrase, setDefaultPassphrase } from "./lib";

export const HmacHashSetting = () => {

  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥

  return (
    <>
      <Divider orientation="left" plain>HmacHash 值计算</Divider>
      <Form.Item label="默认密钥">
        <Space style={{ width: "100%" }}>
          <Input 
            allowClear
            style={ { width: "100%", maxWidth: 520 } }
            onChange={ (e) => { setPassphrase(e.target.value); setDefaultPassphrase(e.target.value); } }
            value= { passphrase } />
        </Space>
      </Form.Item>
    </>
  );
}