import { Form, Divider, Input, Space, Button } from "antd";
import React, { useState } from "react";
import { vigenereKeyValid, getDefaultKey, setDefaultKey } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

// 维吉尼亚密码默认密钥设置
export const VigenereCryptoSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ key, setKey ] = useState(getDefaultKey()); // 默认密钥
  const [ keyStatus, setKeyStatus ] = useState('' as InputStatus);

  const onChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setKey(v);
    if (vigenereKeyValid(v)) { // 空或纯英文字母均合法
      setDefaultKey(v);
      setKeyStatus('');
    } else {
      setKeyStatus('error');
    }
  };

  const clear = () => {
    setKey('');
    setDefaultKey('');
  };

  return (
    <>
      <Divider orientation="left" plain>{ st('维吉尼亚加解密') }</Divider>
      <Form.Item label={ st('默认密钥') }>
        <Space>
          <Input
            value={ key }
            status={ keyStatus }
            onChange={ onChange }
            placeholder={ st('英文字母, 例如 LEMON (留空表示不配置)') }
            style={ { width: 300, fontFamily: "monospace" } }
            allowClear
          />
          <Button size="small" danger onClick={ clear }>{ st('清空') }</Button>
        </Space>
      </Form.Item>
    </>
  );
}

export default VigenereCryptoSetting;
