import { Form, Divider, Select } from "antd";
import React, { useState } from "react";
import { bitLenList } from "./data";
import { getDefaultBits, setDefaultBits } from "./lib";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const CMACCalcSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ bits, setBits ] = useState<128 | 192 | 256>(getDefaultBits());

  return (
    <>
      <Divider orientation="left" plain>{ st('CMAC 计算') }</Divider>
      <Form.Item label={ st('默认密钥长度') }>
        <Select
          value={ bits }
          style={{ width: 240 }}
          onChange={ (v :128 | 192 | 256) => { setBits(v); setDefaultBits(v); } }
          options={ bitLenList.map((b) => ({ label: `AES-${b}`, value: b })) }
        />
      </Form.Item>
    </>
  );
}
