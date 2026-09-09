import { Form, Select, Divider } from "antd";
import { useState } from "react";
import { getDefaultSize, setDefaultSize } from "./lib";
import { ICO_SIZES } from "./data";
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const IcoGeneratorSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ size, setSize ] = useState(getDefaultSize()); // 默认生成尺寸

  return (
    <>
      <Divider orientation="left" plain>{ st('ICO 生成') }</Divider>
      <Form.Item label={ st('默认生成尺寸') }>
        <Select
          value={ size }
          style={ { width: 160 } }
          onChange={ (value) => { setSize(value); setDefaultSize(value); } }
          options={ ICO_SIZES.map((v) => ({ value: v, label: v + ' × ' + v })) }
        />
      </Form.Item>
    </>
  );
}
