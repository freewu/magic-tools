import { Form, Divider, Input, Space, Button } from "antd";
import React, { useState } from "react";
import { vigenereKeyValid, getDefaultKey, setDefaultKey } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// 维吉尼亚密码默认密钥设置
export const VigenereCryptoSetting = () => {

  const [ key, setKey ] = useState(getDefaultKey()); // 默认密钥
  const [ keyStatus, setKeyStatus ] = useState('' as InputStatus);

  const onChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setKey(v);
    if (vigenereKeyValid(v)) { // 空或纯英文字母均合法
      setDefaultKey(v);
      setKeyStatus('');
    } else {
      setKeyStatus('error');
    }
  };

  const clear = () => {
    setKey('');
    setDefaultKey('');
  };

  return (
    <>
      <Divider orientation="left" plain>维吉尼亚加解密</Divider>
      <Form.Item label="默认密钥">
        <Space>
          <Input
            value={ key }
            status={ keyStatus }
            onChange={ onChange }
            placeholder="英文字母, 例如 LEMON (留空表示不配置)"
            style={ { width: 300, fontFamily: "monospace" } }
            allowClear
          />
          <Button size="small" danger onClick={ clear }>清空</Button>
        </Space>
      </Form.Item>
    </>
  );
}

export default VigenereCryptoSetting;
