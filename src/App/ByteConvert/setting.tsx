import { Select, Form, Divider } from "antd";
import { getDefaultType,setDefaultType } from "./lib";
import { useState } from "react";
import { typeList } from "./data";
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const ByteConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  
  const [ type, setType ] = useState(getDefaultType()); // 默认展示类型

  return (
    <>
      <Divider orientation="left" plain>{ st('字节转换') }</Divider>
      <Form.Item label={ st('默认类型') }>
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultType(value); } }
          options={ typeList }
        />
      </Form.Item>
    </>
  );
}