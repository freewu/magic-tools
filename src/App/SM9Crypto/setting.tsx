import { Form, Divider, Input, Space, Button } from "antd";
import React, { useState } from "react";
import { getSm9Defaults, setSm9Default, clearSm9Defaults } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

// SM9 默认密钥设置 (与 SM9 页「密钥生成」共用同一 localStorage 槽位)
export const SM9CryptoSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const init = getSm9Defaults();
  const [ id, setId ] = useState(init.id);                     // 默认用户 ID
  const [ encMaster, setEncMaster ] = useState(init.encMaster); // 加密主私钥
  const [ encUser, setEncUser ] = useState(init.encUser);       // 加密用户私钥
  const [ signMaster, setSignMaster ] = useState(init.signMaster); // 签名主私钥
  const [ signUser, setSignUser ] = useState(init.signUser);    // 签名用户私钥
  const [ status, setStatus ] = useState({} as Record<string, InputStatus>);

  /** 留空 = 不配置; 否则必须为偶数长度 HEX */
  const onHexChange = (
    key :'encMaster' | 'encUser' | 'signMaster' | 'signUser',
    setter :(v :string) => void,
  ) => (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setter(v);
    const cleaned = v.replace(/[\s:]/g, '');
    const ok = cleaned === '' || (cleaned.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(cleaned));
    if (ok) {
      setSm9Default(key, cleaned);
      setStatus((p) => ({ ...p, [key]: '' }));
    } else {
      setStatus((p) => ({ ...p, [key]: 'error' }));
    }
  };

  const onIdChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setId(v);
    setSm9Default('id', v);
  };

  const clear = () => {
    clearSm9Defaults();
    setId('');
    setEncMaster('');
    setEncUser('');
    setSignMaster('');
    setSignUser('');
    setStatus({});
  };

  const area = { fontFamily: "monospace", fontSize: 12, width: "100%", maxWidth: 520 } as const;

  return (
    <>
      <Divider orientation="left" plain>{ st('SM9 加解密') }</Divider>
      <Form.Item label={ st('默认用户 ID') }>
        <Input
          style={ { width: "100%", maxWidth: 520 } }
          onChange={ onIdChange }
          value={ id }
          placeholder={ st('例如 alice@example.com; 解密/验签需与加密/签名时一致') }
        />
      </Form.Item>
      <Form.Item label={ st('默认加密主私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.encMaster }
          rows={ 2 }
          style={ area }
          onChange={ onHexChange('encMaster', setEncMaster) }
          value={ encMaster }
          placeholder={ st('用于导出主公钥与提取用户私钥; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认加密用户私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.encUser }
          rows={ 3 }
          style={ area }
          onChange={ onHexChange('encUser', setEncUser) }
          value={ encUser }
          placeholder={ st('SM9 页「解密」使用; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认签名主私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.signMaster }
          rows={ 2 }
          style={ area }
          onChange={ onHexChange('signMaster', setSignMaster) }
          value={ signMaster }
          placeholder={ st('用于导出签名主公钥; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label={ st('默认签名用户私钥 (DER HEX)') }>
        <Input.TextArea
          status={ status.signUser }
          rows={ 3 }
          style={ area }
          onChange={ onHexChange('signUser', setSignUser) }
          value={ signUser }
          placeholder={ st('SM9 页「签名验签」使用; 留空表示不配置') }
        />
      </Form.Item>
      <Form.Item label=" ">
        <Space style={ { width: "100%" } }>
          <Button size="small" danger onClick={ clear }>{ st('清空默认密钥') }</Button>
          <span style={ { color: "#999" } }>{ st('默认密钥保存在浏览器本地, 打开 SM9 页会自动带出') }</span>
        </Space>
      </Form.Item>
    </>
  );
}

export default SM9CryptoSetting;
