import { Form, Divider, InputNumber, Space, Button } from "antd";
import React, { useState } from "react";
import { getDefaultShift, setDefaultShift } from "./lib";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

// 凯撒密码默认位移量设置
export const CaesarCryptoSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ shift, setShift ] = useState<number | null>(getDefaultShift()); // 默认位移量

  const onChange = (v :number | null) => {
    setShift(v);
    if (v !== null && Number.isInteger(v)) {
      setDefaultShift(v);
    }
  };

  const reset = () => {
    setShift(3);
    setDefaultShift(3);
  };

  return (
    <>
      <Divider orientation="left" plain>{ st('凯撒加解密') }</Divider>
      <Form.Item label={ st('默认位移量') }>
        <Space>
          <InputNumber
            value={ shift }
            min={ -25 }
            max={ 25 }
            onChange={ onChange }
            style={ { width: 140 } }
          />
          <Button size="small" onClick={ reset }>{ st('恢复默认 (3)') }</Button>
        </Space>
      </Form.Item>
    </>
  );
}

export default CaesarCryptoSetting;
