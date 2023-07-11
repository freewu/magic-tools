import { Select, Form, Divider } from "antd";
import { useState } from "react";
import { typeList } from "./data";
import { getDefaultInputFormat, setDefaultInputFormat } from "./lib";
import { getDefaultOutputFormat, setDefaultOutputFormat } from "./lib";

export const ConfigConvertSetting = () => {

  const [ inputFormat, setInputFormat ] = useState(getDefaultInputFormat()); // 默认输入格式
  const [ outputFormat, setOutputFormat ] = useState(getDefaultOutputFormat()); // 默认输出格式

  return (
    <>
      <Divider orientation="left" plain>配置转换</Divider>
      <Form.Item label="默认输入格式">
        <Select
          value={ inputFormat }
          style={{ width: 240 }}
          onChange={ (v :string) => { setInputFormat(v); setDefaultInputFormat(v); } }
          options={ typeList }
        />
      </Form.Item>
      <Form.Item label="默认输出格式">
        <Select
          value={ outputFormat }
          style={{ width: 240 }}
          onChange={ (v :string) => { setOutputFormat(v); setDefaultOutputFormat(v); } }
          options={ typeList }
        />
      </Form.Item>
    </>
  );
}