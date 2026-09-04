import { Form, Divider, InputNumber, Checkbox, message } from "antd";
import { useState } from "react";
import { getDefaultShakeBits, setDefaultShakeBits, getDefaultUpper, setDefaultUpper } from "./lib"

export const SHA3HashSetting = () => {
  const [ shakeBits, setShakeBits ] = useState(getDefaultShakeBits());
  const [ upper, setUpper ] = useState(getDefaultUpper());
  const [ notice, contextHolder ] = message.useMessage();

  const changeShakeBits = (v :number | null) => {
    if (v != null && Number.isInteger(v) && v >= 8 && v % 8 === 0) {
      setShakeBits(v);
      setDefaultShakeBits(v);
      notice.success("已保存");
    }
  };

  return (
    <>
      {contextHolder}
      <Divider orientation="left" plain>SHA3 Hash 值计算</Divider>
      <Form.Item label="默认 SHAKE 输出长度">
        <InputNumber
          min={ 8 }
          max={ 8192 }
          step={ 8 }
          style={ { width: 140 } }
          title="打开页面时 SHAKE128/256 的输出长度 (bit), 须为 8 的整数倍"
          value={ shakeBits }
          onChange={ changeShakeBits }
        />
      </Form.Item>
      <Form.Item label="结果大写展示">
        <Checkbox
          checked={ upper }
          onChange={ (e) => { const v = e.target.checked; setUpper(v); setDefaultUpper(v); } }
        >默认使用大写字符展示结果</Checkbox>
      </Form.Item>
    </>
  );
}
