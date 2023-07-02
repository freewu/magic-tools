import { Select, Form, Divider } from "antd";
import { getDefaultType,setDefaultType } from "./lib";
import { useState } from "react";
import { typeList } from "./data";

const ByteConvertSetting = () => {
  const [ app, setApp ] = useState(getDefaultType()); // 默认展示的 app

  const onChangeDefaultType = (value: string) => {
    setApp(value);
    setDefaultType(value);
  };

  return (
    <>
      <Divider orientation="left" plain>字节转换</Divider>
      <Form.Item label="默认类型">
        <Select
          value={ app }
          style={{ width: 240 }}
          onChange={ onChangeDefaultType }
          options={ typeList }
        />
      </Form.Item>
    </>
  );
}

export default ByteConvertSetting;