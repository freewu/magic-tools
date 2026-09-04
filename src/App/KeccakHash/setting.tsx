import { Form, Divider, Checkbox } from "antd";
import { useState } from "react";
import { getDefaultUpper, setDefaultUpper } from "./lib"

export const KeccakHashSetting = () => {
  const [ upper, setUpper ] = useState(getDefaultUpper());

  return (
    <>
      <Divider orientation="left" plain>Keccak Hash 值计算</Divider>
      <Form.Item label="结果大写展示">
        <Checkbox
          checked={ upper }
          onChange={ (e) => { const v = e.target.checked; setUpper(v); setDefaultUpper(v); } }
        >默认使用大写字符展示结果</Checkbox>
      </Form.Item>
    </>
  );
}
