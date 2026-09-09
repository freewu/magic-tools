import { Form, Select, Divider } from "antd";
import { useState } from "react";
import { getDefaultInputMode, setDefaultInputMode, getDefaultAlgo, setDefaultAlgo } from "./lib";
import { CRC_ALGOS } from "./data";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const CRCCheckSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ mode, setMode ] = useState<'hex' | 'ascii'>(getDefaultInputMode());
  const [ algo, setAlgo ] = useState<string>(getDefaultAlgo());

  return (
    <>
      <Divider orientation="left" plain>{ st('CRC 校验') }</Divider>
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
      <Form.Item label={ st('默认校验算法') }>
        <Select
          showSearch
          style={ { width: 260 } }
          value={ algo }
          onChange={ (v :string) => { setAlgo(v); setDefaultAlgo(v); } }
          options={ CRC_ALGOS.map((a) => ({ label: a.name, value: a.name })) }
          placeholder={ st('选择 CRC 算法') }
        />
      </Form.Item>
    </>
  );
}
