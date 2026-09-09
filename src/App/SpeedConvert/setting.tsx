import { Select, Form, Divider } from "antd";
import { getDefaultUnitType,setDefaultUnitType, getTypeList } from "./lib";
import { useState } from "react";
import { typeList, unitTypeList } from "./data";
import { getDefaultMSType,setDefaultMSType } from "./lib";
import { getDefaultIUType,setDefaultIUType } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const SpeedConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  
  const [ type, setType ] = useState(getDefaultUnitType()); // 默认制式
  const [ msType, setMSType ] = useState(getDefaultMSType()); // 默认公制单位
  const [ iuType, setIUType ] = useState(getDefaultIUType()); // 默认英制单位

  return (
    <>
      <Divider orientation="left" plain>{ st('速度转换') }</Divider>
      <Form.Item label={ st('默认制式') }>
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultUnitType(value); } }
          options={ unitTypeList }
        />
      </Form.Item>
      <Form.Item label={ st('默认公制单位') }>
        <Select
          value={ msType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setMSType(value); setDefaultMSType(value); } }
          options={ getTypeList('ms') }
        />
      </Form.Item>
      <Form.Item label={ st('默认英制单位') }>
        <Select
          value={ iuType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setIUType(value); setDefaultIUType(value); } }
          options={ getTypeList('iu') }
        />
      </Form.Item>
    </>
  );
}