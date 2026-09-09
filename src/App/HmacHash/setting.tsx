import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { getDefaultPassphrase, setDefaultPassphrase } from "./lib";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const HmacHashSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥

  return (
    <>
      <Divider orientation="left" plain>{ st('HmacHash 值计算') }</Divider>
      <Form.Item label={ st('默认密钥') }>
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