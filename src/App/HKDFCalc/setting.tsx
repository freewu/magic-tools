import { Form, Divider, Select, InputNumber } from "antd";
import React, { useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { hashAlgoList } from "./data";
import { getDefaultAlgo, setDefaultAlgo, getDefaultLength, setDefaultLength } from "./lib";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const HKDFCalcSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ algo, setAlgo ] = useState(getDefaultAlgo());
  const [ length, setLength ] = useState(getDefaultLength());

  return (
    <>
      <Divider orientation="left" plain>{ st('HKDF 计算') }</Divider>
      <Form.Item label={ st('默认散列算法') }>
        <Select
          value={ algo }
          style={{ width: 240 }}
          onChange={ (v :string) => { setAlgo(v); setDefaultAlgo(v); } }
          options={ arrayToOptions(hashAlgoList) }
        />
      </Form.Item>
      <Form.Item label={ st('默认输出长度') }>
        <InputNumber
          addonAfter={ st('字节') }
          min={ 1 }
          max={ 8160 }
          style={{ width: 240 }}
          onChange={ (v :number | null) => {
            if (v != null && v >= 1 && v <= 8160) { setLength(v); setDefaultLength(v); }
          } }
          value={ length }
        />
      </Form.Item>
    </>
  );
}
