import { Form, Divider, Input, Space, Button } from "antd";
import React, { useState } from "react";
import { hillKeyShapeValid, getDefaultKey, setDefaultKey } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// 希尔密码默认密钥设置
export const HillCryptoSetting = () => {

  const [ key, setKey ] = useState(getDefaultKey()); // 默认密钥
  const [ keyStatus, setKeyStatus ] = useState('' as InputStatus);

  const onChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setKey(v);
    if (hillKeyShapeValid(v)) { // 空或 4/9 个字母均合法
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
      <Divider orientation="left" plain>希尔加解密</Divider>
      <Form.Item label="默认密钥">
        <Space>
          <Input
            value={ key }
            status={ keyStatus }
            onChange={ onChange }
            placeholder="4 个字母 = 2×2 (如 HILL) / 9 个字母 = 3×3 (如 GYBNQKURP), 留空表示不配置"
            style={ { width: 340, fontFamily: "monospace" } }
            allowClear
          />
          <Button size="small" danger onClick={ clear }>清空</Button>
        </Space>
      </Form.Item>
    </>
  );
}

export default HillCryptoSetting;
