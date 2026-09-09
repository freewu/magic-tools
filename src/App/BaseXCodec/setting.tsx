import { Select, Form, Divider, notification } from "antd";
import { getDefaultCode,setDefaultCode } from "./lib";
import { useState } from "react";
import { codeList } from "./data";
import { arrayToOptions } from "../../lib/array"


import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";
export const BaseXCodecSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码

  return (
    <>
      <Divider orientation="left" plain>{ st('BaseX 编解码') }</Divider>
      <Form.Item label={ st('默认编码') }>
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