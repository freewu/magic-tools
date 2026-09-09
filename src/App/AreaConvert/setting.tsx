import { Select, Form, Divider } from "antd";
import { getDefaultUnitType,setDefaultUnitType, getTypeList } from "./lib";
import { useState } from "react";
import { typeList, unitTypeList } from "./data";
import { getDefaultMSType,setDefaultMSType } from "./lib";
import { getDefaultIUType,setDefaultIUType } from "./lib";
import { getDefaultCNType,setDefaultCNType } from "./lib";
import { getDefaultJPType,setDefaultJPType } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import areaLang from "./lang";
import { row as _r, rowT } from "../Setting/rows-lang";


export const AreaConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (key: string, fallback: string) => tr(areaLang, locale, key, fallback);
  
  const [ type, setType ] = useState(getDefaultUnitType()); // 默认制式
  const [ msType, setMSType ] = useState(getDefaultMSType()); // 默认公制单位
  const [ iuType, setIUType ] = useState(getDefaultIUType()); // 默认英制单位
  const [ cnType, setCNType ] = useState(getDefaultCNType()); // 默认市制单位
  const [ jpType, setJPType ] = useState(getDefaultJPType()); // 默认日式单位

  return (
    <>
      <Divider orientation="left" plain>{ st('面积转换') }</Divider>
      <Form.Item label={ st('默认制式') }>
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultUnitType(value); } }
          options={ unitTypeList.map(i => ({ ...i, label: t('ut_' + i.value, i.label) })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认公制单位') }>
        <Select
          value={ msType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setMSType(value); setDefaultMSType(value); } }
          options={ getTypeList('ms').map(i => ({ ...i, label: t('u_' + i.value.replace(/-/g, '_'), i.label) })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认英制单位') }>
        <Select
          value={ iuType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setIUType(value); setDefaultIUType(value); } }
          options={ getTypeList('iu').map(i => ({ ...i, label: t('u_' + i.value.replace(/-/g, '_'), i.label) })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认市制单位') }>
        <Select
          value={ cnType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setCNType(value); setDefaultCNType(value); } }
          options={ getTypeList('cn').map(i => ({ ...i, label: t('u_' + i.value.replace(/-/g, '_'), i.label) })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认日式单位') }>
        <Select
          value={ jpType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setJPType(value); setDefaultJPType(value); } }
          options={ getTypeList('jp').map(i => ({ ...i, label: t('u_' + i.value.replace(/-/g, '_'), i.label) })) }
        />
      </Form.Item>
    </>
  );
}
