import { Form, Divider, InputNumber, Space, Button } from "antd";
import React, { useState } from "react";
import { getDefaultRails, setDefaultRails } from "./lib";

// 栅栏密码默认栏数设置
export const RailFenceCryptoSetting = () => {

  const [ rails, setRails ] = useState<number | null>(getDefaultRails()); // 默认栏数

  const onChange = (v :number | null) => {
    setRails(v);
    if (v !== null && Number.isInteger(v) && v >= 2) {
      setDefaultRails(v);
    }
  };

  const reset = () => {
    setRails(3);
    setDefaultRails(3);
  };

  return (
    <>
      <Divider orientation="left" plain>栅栏加解密</Divider>
      <Form.Item label="默认栏数">
        <Space>
          <InputNumber
            value={ rails }
            min={ 2 }
            max={ 20 }
            onChange={ onChange }
            style={ { width: 140 } }
          />
          <Button size="small" onClick={ reset }>恢复默认 (3)</Button>
        </Space>
      </Form.Item>
    </>
  );
}

export default RailFenceCryptoSetting;
