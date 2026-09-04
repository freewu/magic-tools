import { Form, Divider, Input, Space, Button } from "antd";
import React, { useState } from "react";
import { getDefaultPublicKey, setDefaultPublicKey, isPublicPem } from "./lib";
import { getDefaultPrivateKey, setDefaultPrivateKey, isPrivatePem } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// RSA 默认密钥设置 (与 RSA 页「密钥管理」共用 localStorage, 生成/保存会覆盖此处)
export const RSACryptoSetting = () => {

  const [ publicPem, setPublicPem ] = useState(getDefaultPublicKey()); // 默认公钥
  const [ privatePem, setPrivatePem ] = useState(getDefaultPrivateKey()); // 默认私钥
  const [ pubStatus, setPubStatus ] = useState('' as InputStatus);
  const [ priStatus, setPriStatus ] = useState('' as InputStatus);

  const onPublicChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setPublicPem(v);
    if(v.trim() === '' || isPublicPem(v)) { // 空 = 不配置
      setDefaultPublicKey(v);
      setPubStatus('');
    } else {
      setPubStatus('error');
    }
  };

  const onPrivateChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setPrivatePem(v);
    if(v.trim() === '' || isPrivatePem(v)) {
      setDefaultPrivateKey(v);
      setPriStatus('');
    } else {
      setPriStatus('error');
    }
  };

  const clear = () => {
    setPublicPem('');
    setPrivatePem('');
    setDefaultPublicKey('');
    setDefaultPrivateKey('');
  };

  return (
    <>
      <Divider orientation="left" plain>RSA 加解密</Divider>
      <Form.Item label="默认公钥 (SPKI PEM)">
        <Input.TextArea
          status={ pubStatus }
          rows={ 5 }
          style={ { fontFamily: "monospace", fontSize: 12, width: "520px" } }
          onChange={ onPublicChange }
          placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n留空表示不配置; 用于「RSA 加解密」页加密"
          value={ publicPem }
        />
      </Form.Item>
      <Form.Item label="默认私钥 (PKCS#8 PEM)">
        <Input.TextArea
          status={ priStatus }
          rows={ 7 }
          style={ { fontFamily: "monospace", fontSize: 12, width: "520px" } }
          onChange={ onPrivateChange }
          placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n留空表示不配置; 用于解密, 请妥善保管"
          value={ privatePem }
        />
      </Form.Item>
      <Form.Item label=" ">
        <Space>
          <Button size="small" danger onClick={ clear }>清空默认密钥</Button>
          <span style={ { color: "#999" } }>公钥 + 私钥均配置后, 打开 RSA 页将自动进入「加解密」</span>
        </Space>
      </Form.Item>
    </>
  );
}

export default RSACryptoSetting;
