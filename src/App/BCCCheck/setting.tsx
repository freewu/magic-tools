import { Form, Select, Divider } from "antd";
import { useState } from "react";
import { getDefaultInputMode, setDefaultInputMode } from "./lib";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const BCCCheckSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ mode, setMode ] = useState<'hex' | 'ascii'>(getDefaultInputMode());

  return (
    <>
      <Divider orientation="left" plain>{ st('BCC 校验') }</Divider>
      <Form.Item label={ st('默认输入格式') }>
        <Select
          style={ { width: 240 } }
          value={ mode }
          onChange={ (v :'hex' | 'ascii') => { setMode(v); setDefaultInputMode(v); } }
          options={ [
            { label: st('ASCII / 文本'), value: 'ascii' },
            { label: st('HEX (十六进制)'), value: 'hex' },
          ] }
        />
      </Form.Item>
    </>
  );
}
