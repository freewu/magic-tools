import { Form, Divider, Checkbox } from "antd";
import { useState } from "react";
import { getDefaultUpper, setDefaultUpper } from "./lib"


import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";
export const KeccakHashSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ upper, setUpper ] = useState(getDefaultUpper());

  return (
    <>
      <Divider orientation="left" plain>{ st('Keccak Hash 值计算') }</Divider>
      <Form.Item label={ st('结果大写展示') }>
        <Checkbox
          checked={ upper }
          onChange={ (e) => { const v = e.target.checked; setUpper(v); setDefaultUpper(v); } }
        >{ st('默认使用大写字符展示结果') }</Checkbox>
      </Form.Item>
    </>
  );
}
