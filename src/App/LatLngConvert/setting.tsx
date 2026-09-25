import { Select, Form, Divider } from "antd";
import { useState } from "react";
import { formatList, orderList, type FormatValue, type OrderValue } from "./data";
import { getDefaultFormat, setDefaultFormat, getDefaultOrder, setDefaultOrder } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import llLang from "./lang";
import { row as _r } from "../Setting/rows-lang";

export const LatLngConvertSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (key: string, fallback: string) => tr(llLang, locale, key, fallback);

  const [ format, setFormat ] = useState<FormatValue>(getDefaultFormat());
  const [ order, setOrder ] = useState<OrderValue>(getDefaultOrder());

  return (
    <>
      <Divider orientation="left" plain>{ st('经纬度格式转换') }</Divider>
      <Form.Item label={ st('默认输入格式') }>
        <Select
          value={ format }
          style={{ width: 240 }}
          onChange={ (value: FormatValue) => { setFormat(value); setDefaultFormat(value); } }
          options={ formatList.map((i) => ({ ...i, label: t('fmt_' + i.value, i.label) })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认书写顺序') }>
        <Select
          value={ order }
          style={{ width: 240 }}
          onChange={ (value: OrderValue) => { setOrder(value); setDefaultOrder(value); } }
          options={ orderList.map((i) => ({ ...i, label: t('order_' + i.value, i.label) })) }
        />
      </Form.Item>
    </>
  );
};
