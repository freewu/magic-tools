import { Form, Divider, Select, InputNumber, Switch } from "antd";
import React, { useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { kmacAlgoList } from "./data";
import { getDefaultAlgo, setDefaultAlgo, getDefaultLength, setDefaultLength, getDefaultXof, setDefaultXof } from "./lib";

export const KMACCalcSetting = () => {

  const [ algo, setAlgo ] = useState(getDefaultAlgo());
  const [ length, setLength ] = useState(getDefaultLength());
  const [ xof, setXof ] = useState(getDefaultXof());

  return (
    <>
      <Divider orientation="left" plain>KMAC 计算</Divider>
      <Form.Item label="默认算法">
        <Select
          value={ algo }
          style={{ width: 240 }}
          onChange={ (v :string) => { setAlgo(v); setDefaultAlgo(v); } }
          options={ arrayToOptions(kmacAlgoList) }
        />
      </Form.Item>
      <Form.Item label="默认输出长度">
        <InputNumber
          addonAfter="字节"
          min={ 1 }
          max={ 8192 }
          style={{ width: 240 }}
          onChange={ (v :number | null) => {
            if (v != null && v >= 1 && v <= 8192) { setLength(v); setDefaultLength(v); }
          } }
          value={ length }
        />
      </Form.Item>
      <Form.Item label="默认 XOF 模式">
        <Switch
          checked={ xof }
          onChange={ (on :boolean) => { setXof(on); setDefaultXof(on); } }
          checkedChildren="XOF"
          unCheckedChildren="普通"
        />
      </Form.Item>
    </>
  );
}
