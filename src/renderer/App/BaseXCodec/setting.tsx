import { Select, Form, Divider, notification } from "antd";
import { getDefaultCode,setDefaultCode } from "./lib";
import { useState } from "react";
import { codeList } from "./data";
import { arrayToOptions } from "../../lib/array"

const BaseXCodecSetting = () => {

  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码

  return (
    <>
      <Divider orientation="left" plain>BaseX 编解码</Divider>
      <Form.Item label="默认编码">
        <Select
          value={ code }
          style={{ width: 240 }}
          onChange={ (v: string) => { setCode(v); setDefaultCode(v); } }
          options={ arrayToOptions(codeList) }
        />
      </Form.Item>
    </>
  );
}

export default BaseXCodecSetting;