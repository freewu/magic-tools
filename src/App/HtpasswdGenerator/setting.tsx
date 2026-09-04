import { Form, InputNumber, Select, Divider, Space } from "antd";
import { HTPASSWD_METHODS, type HtpasswdMethod } from "./data";
import { getDefaultMethod, setDefaultMethod, getBcryptRounds, setBcryptRounds } from "./lib";
import { useState } from "react";

export const HtpasswdGeneratorSetting = () => {
  const [ method, setMethod ] = useState<HtpasswdMethod>(getDefaultMethod()); // 默认加密方式
  const [ rounds, setRounds ] = useState(getBcryptRounds()); // bcrypt 默认成本

  return (
    <>
      <Divider orientation="left" plain>htpasswd 生成</Divider>
      <Form.Item label="默认加密方式">
        <Select
          value={ method }
          style={ { width: 240 } }
          onChange={ (value :HtpasswdMethod) => { setMethod(value); setDefaultMethod(value); } }
          options={ HTPASSWD_METHODS.map((v) => ({ value: v.value, label: v.label })) }
        />
      </Form.Item>
      <Form.Item label="bcrypt 成本">
        <Space>
          <InputNumber
            min={ 4 }
            max={ 15 }
            value={ rounds }
            onChange={ (value :number | null) => {
              const r = (value === null) ? 10 : value;
              setRounds(r);
              setBcryptRounds(r);
            } }
          />
          <span style={ { color: "#999" } }>迭代 2^cost 次, 默认 10</span>
        </Space>
      </Form.Item>
    </>
  );
}
