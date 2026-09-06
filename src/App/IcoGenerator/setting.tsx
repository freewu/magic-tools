import { Form, Select, Divider } from "antd";
import { useState } from "react";
import { getDefaultSize, setDefaultSize } from "./lib";
import { ICO_SIZES } from "./data";

export const IcoGeneratorSetting = () => {
  const [ size, setSize ] = useState(getDefaultSize()); // 默认生成尺寸

  return (
    <>
      <Divider orientation="left" plain>ICO 生成</Divider>
      <Form.Item label="默认生成尺寸">
        <Select
          value={ size }
          style={ { width: 160 } }
          onChange={ (value) => { setSize(value); setDefaultSize(value); } }
          options={ ICO_SIZES.map((v) => ({ value: v, label: v + ' × ' + v })) }
        />
      </Form.Item>
    </>
  );
}
