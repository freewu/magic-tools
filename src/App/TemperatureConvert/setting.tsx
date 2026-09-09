import { Select, Form, Divider } from "antd";
import { getDefaultType,setDefaultType } from "./lib";
import { useState } from "react";
import { typeList } from "./data";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import tempLang from "./lang";
import { row as _r, rowT } from "../Setting/rows-lang";

export const TemperatureConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (key: string, fallback: string) => tr(tempLang, locale, key, fallback);

  const [ type, setType ] = useState(getDefaultType()); // 默认展示类型

  return (
    <>
      <Divider orientation="left" plain>{ st('温度转换') }</Divider>
      <Form.Item label={ st('默认类型') }>
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultType(value); } }
          options={ typeList.map((it) => ({ ...it, label: t('unit_' + it.value, it.label) })) }
        />
      </Form.Item>
    </>
  );
}
