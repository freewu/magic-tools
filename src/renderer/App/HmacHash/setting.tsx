import { Select, Form, Divider, Input, Space, Checkbox } from "antd";
import React,{ useState } from "react";
import { getDefaultPassphrase, setDefaultPassphrase } from "./lib";
import { getDefaultShowUppercase,setDefaultShowUppercase } from "./lib"

export const HmacHashSetting = () => {

  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥
  const [ showUppercase, setShowUpperase ] = useState(getDefaultShowUppercase());

  return (
    <>
      <Divider orientation="left" plain>HmacHash 值计算</Divider>
      <Form.Item label="默认密钥">
        <Space>
          <Input 
            allowClear
            style={ { width: "520px" } }
            onChange={ (e) => { setPassphrase(e.target.value); setDefaultPassphrase(e.target.value); } }
            value= { passphrase } />
        </Space>
      </Form.Item>
      <Form.Item label="结果大写字符展示" >
        <Checkbox 
          onChange={ () => { setShowUpperase(!showUppercase); setDefaultShowUppercase(!showUppercase);  } } 
          checked={ showUppercase } />
      </Form.Item>
    </>
  );
}