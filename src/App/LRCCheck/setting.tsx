import { Form, Select, Divider } from "antd";
import { useState } from "react";
import { getDefaultInputMode, setDefaultInputMode } from "./lib";

export const LRCCheckSetting = () => {
  const [ mode, setMode ] = useState<'hex' | 'ascii'>(getDefaultInputMode());

  return (
    <>
      <Divider orientation="left" plain>LRC 校验</Divider>
      <Form.Item label="默认输入格式">
        <Select
          style={ { width: 240 } }
          value={ mode }
          onChange={ (v :'hex' | 'ascii') => { setMode(v); setDefaultInputMode(v); } }
          options={ [
            { label: 'ASCII / 文本', value: 'ascii' },
            { label: 'HEX (十六进制)', value: 'hex' },
          ] }
        />
      </Form.Item>
    </>
  );
}
