import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { codeList } from "./data";
import { getDefaultCode, setDefaultCode } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase } from "./lib";

const RabbitCryptoSetting = () => {

  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    setDefaultPassphrase(v);
  }

  return (
    <>
      <Divider orientation="left" plain>RC4 加解密</Divider>
      <Form.Item label="默认编码">
        <Select
          value={ code }
          style={{ width: 240 }}
          onChange={ (v :string) => { setCode(v); setDefaultCode(v); } }
          options={ arrayToOptions(codeList) }
        />
      </Form.Item>
      <Form.Item label="默认密钥">
        <Space>
          <Input
            showCount
            maxLength= { 256 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
        </Space>
      </Form.Item>
    </>
  );
}

export default RabbitCryptoSetting;