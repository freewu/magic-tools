import { Select, Form, Divider } from "antd";
import { useState } from "react";
import { getDefaultType, setDefaultType } from "./lib";
import { codeList } from "./data"
import type { BCDType } from "./data";

export const BCDCodecSetting = () => {

  const [ type, setType ] = useState(getDefaultType()); // 默认码型

  return (
    <>
      <Divider orientation="left" plain>BCD 编解码</Divider>
      <Form.Item label="默认码型">
        <Select
          value={ type }
          style={{ width: 180 }}
          onChange={ (v: string) => { setType(v as BCDType); setDefaultType(v as BCDType); } }
          options={ codeList }
        />
      </Form.Item>
    </>
  );
}
