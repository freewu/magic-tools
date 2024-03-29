import { Select, Form, Divider } from "antd";
import { getDefaultType,setDefaultType } from "./lib";
import { useState } from "react";
import { typeList } from "./data";

export const TemperatureConvertSetting = () => {

  const [ type, setType ] = useState(getDefaultType()); // 默认展示类型

  return (
    <>
      <Divider orientation="left" plain>温度转换</Divider>
      <Form.Item label="默认类型">
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultType(value); } }
          options={ typeList }
        />
      </Form.Item>
    </>
  );
}
