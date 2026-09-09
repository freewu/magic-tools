import { Select, Form, Divider } from "antd";
import { useState } from "react";
import { typeList } from "./data";
import { getDefaultInputFormat, setDefaultInputFormat } from "./lib";
import { getDefaultOutputFormat, setDefaultOutputFormat } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const ConfigConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ inputFormat, setInputFormat ] = useState(getDefaultInputFormat()); // 默认输入格式
  const [ outputFormat, setOutputFormat ] = useState(getDefaultOutputFormat()); // 默认输出格式

  return (
    <>
      <Divider orientation="left" plain>{ st('配置转换') }</Divider>
      <Form.Item label={ st('默认输入格式') }>
        <Select
          value={ inputFormat }
          style={{ width: 240 }}
          onChange={ (v :string) => { setInputFormat(v); setDefaultInputFormat(v); } }
          options={ typeList }
        />
      </Form.Item>
      <Form.Item label={ st('默认输出格式') }>
        <Select
          value={ outputFormat }
          style={{ width: 240 }}
          onChange={ (v :string) => { setOutputFormat(v); setDefaultOutputFormat(v); } }
          options={ typeList }
        />
      </Form.Item>
    </>
  );
}