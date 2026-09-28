import { Divider, Form, Select } from "antd";
import { useState } from "react";
import { BOM_KEYS, getDefaultBom, setDefaultBom, type BomKey } from "./lib";
import { bomLabel } from "./data";
import { useLocale } from "../../hook/locale-context";
import { row as _r } from "../Setting/rows-lang";

export const BOMCheckSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ bom, setBom ] = useState<BomKey>(getDefaultBom());

  return (
    <>
      <Divider orientation="left" plain>{ st('BOM 检查') }</Divider>
      <Form.Item label={ st('默认 BOM 类型') }>
        <Select
          value={ bom }
          style={ { width: 240 } }
          onChange={ (value: BomKey) => { setBom(value); setDefaultBom(value); } }
          options={ BOM_KEYS.map((k) => ({ value: k, label: bomLabel(k) })) }
        />
      </Form.Item>
    </>
  );
};
