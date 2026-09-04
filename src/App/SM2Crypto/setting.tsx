import { Form, Divider, Input, Space, Button } from "antd";
import React, { useState } from "react";
import { getDefaultPublicKey, setDefaultPublicKey } from "./lib";
import { getDefaultPrivateKey, setDefaultPrivateKey } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// SM2 默认密钥设置 (与 SM2 页「密钥管理」共用 localStorage, 生成/保存会覆盖此处)
export const SM2CryptoSetting = () => {

  const [ publicKey, setPublicKey ] = useState(getDefaultPublicKey()); // 默认公钥
  const [ privateKey, setPrivateKey ] = useState(getDefaultPrivateKey()); // 默认私钥
  const [ pubStatus, setPubStatus ] = useState('' as InputStatus);
  const [ priStatus, setPriStatus ] = useState('' as InputStatus);

  const isPubValid = (v :string) :boolean => /^04[0-9a-fA-F]{128}$/.test(v.replace(/\s+/g, ''));
  const isPriValid = (v :string) :boolean => /^[0-9a-fA-F]{64}$/.test(v.replace(/\s+/g, ''));

  const onPublicChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setPublicKey(v);
    const cleaned = v.replace(/\s+/g, '');
    if(cleaned === '' || isPubValid(v)) { // 空 = 不配置
      setDefaultPublicKey(cleaned);
      setPubStatus('');
    } else {
      setPubStatus('error');
    }
  };

  const onPrivateChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setPrivateKey(v);
    const cleaned = v.replace(/\s+/g, '');
    if(cleaned === '' || isPriValid(v)) {
      setDefaultPrivateKey(cleaned);
      setPriStatus('');
    } else {
      setPriStatus('error');
    }
  };

  const clear = () => {
    setPublicKey('');
    setPrivateKey('');
    setDefaultPublicKey('');
    setDefaultPrivateKey('');
  };

  return (
    <>
      <Divider orientation="left" plain>SM2 加解密</Divider>
      <Form.Item label="默认公钥 (04‖X‖Y HEX)">
        <Input.TextArea
          status={ pubStatus }
          rows={ 2 }
          style={ { fontFamily: "monospace", fontSize: 12, width: "520px" } }
          onChange={ onPublicChange }
          placeholder="04 开头共 130 位 HEX, 由生成或「从私钥推导公钥」得到; 留空表示不配置"
          value={ publicKey }
        />
      </Form.Item>
      <Form.Item label="默认私钥 (64 位 HEX)">
        <Input.TextArea
          status={ priStatus }
          rows={ 2 }
          style={ { fontFamily: "monospace", fontSize: 12, width: "520px" } }
          onChange={ onPrivateChange }
          placeholder="64 位 HEX; 留空表示不配置; 用于解密, 请妥善保管"
          value={ privateKey }
        />
      </Form.Item>
      <Form.Item label=" ">
        <Space>
          <Button size="small" danger onClick={ clear }>清空默认密钥</Button>
          <span style={ { color: "#999" } }>公钥 + 私钥均配置后, 打开 SM2 页将自动进入「加解密」</span>
        </Space>
      </Form.Item>
    </>
  );
}

export default SM2CryptoSetting;
