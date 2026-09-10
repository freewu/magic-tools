import { Divider, Form, Select } from "antd";
import { useState } from "react";
import { colorTypeList } from "./data";
import { getDefaultColorType, setDefaultColorType } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import colorLang from "./lang";
import { row as _r } from "../Setting/rows-lang";

/** 颜色格式转换默认值设置 (挂载到 设置 → 类型转换) */
export const ColorConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (key: string, fallback: string) => tr(colorLang, locale, key, fallback);
  const [ colorType, setColorType ] = useState(() => getDefaultColorType()); // 默认选中的颜色类型

  return (
    <>
      <Divider orientation="left" plain>{ st('颜色格式转换') }</Divider>
      <Form.Item label={ st('默认选中类型') }>
        <Select
          style={{ width: 280 }}
          value={ colorType }
          onChange={ (value: string) => { setColorType(value); setDefaultColorType(value); } }
          options={ colorTypeList.map((item) => ({ value: item.value, label: t('type_' + item.value, item.label) })) }
        />
      </Form.Item>
    </>
  );
};

export default ColorConvertSetting;
