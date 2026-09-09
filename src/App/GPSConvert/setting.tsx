import { Select, Form, Divider } from "antd";
import { getDefaultType, setDefaultType } from "./lib";
import { useState } from "react";
import { typeList } from "./data";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import gpsLang from "./lang";
import { row as _r, rowT } from "../Setting/rows-lang";

export const GPSConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (key: string, fallback: string) => tr(gpsLang, locale, key, fallback);
  const [ type, setType ] = useState(getDefaultType()); // 默认坐标类型

  // // 应用列表
  // const getAppList = () => {
  //   const result = [{ value: 'AppStore', label: st('应用中心') }];
  //   appList.forEach((v) => {
  //     result.push({ value: v.key, label:  v.label });
  //   });
  //   return result;
  // };

  return (
    <>
      <Divider orientation="left" plain>{ st('GPS坐标转换') }</Divider>
      <Form.Item label={ st('默认坐标类型') }>
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
