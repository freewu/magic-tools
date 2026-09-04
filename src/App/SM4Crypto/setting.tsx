import { Select, Form, Divider, Input, Space } from "antd";
import React, { useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { modeList, paddingList, codeList } from "./data";
import { getDefaultMode, setDefaultMode } from "./lib";
import { getDefaultPadding, setDefaultPadding } from "./lib";
import { getDefaultCode, setDefaultCode } from "./lib";
import { getDefaultIV, setDefaultIV } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase, sm4KeyValid, sm4IvValid } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

export const SM4CryptoSetting = () => {

  const [ mode, setMode ] = useState(getDefaultMode()); // 默认 mode
  const [ padding, setPadding ] = useState(getDefaultPadding()); // 默认填充
  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 默认偏移量
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥
  const [ ivStatus, setIVStatus ] = useState('' as InputStatus); // 偏移量提醒
  const [ passphraseStatus, setPassphraseStatus ] = useState('' as InputStatus); // 密钥提醒

  // 偏移量 IV 输入处理
  const onIVChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIV(v);
    if(sm4IvValid(v)) { // 空 / 16 字符 / 32 位 HEX 均视为合法
      setDefaultIV(v);
      setIVStatus('');
    } else {
      setIVStatus('error');
    }
  }

  // 密钥输入处理 (16 字符 UTF-8 或 32 位 HEX)
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    if(sm4KeyValid(v)) {
      setDefaultPassphrase(v);
      setPassphraseStatus('');
    } else {
      setPassphraseStatus('error');
    }
  }

  return (
    <>
      <Divider orientation="left" plain>SM4 加解密</Divider>
      <Form.Item label="默认模式">
        <Select
          value={ mode }
          style={{ width: 240 }}
          onChange={ (v :string) => { setMode(v); setDefaultMode(v); } }
          options={ arrayToOptions(modeList) }
        />
      </Form.Item>
      <Form.Item label="默认填充">
        <Select
          value={ padding }
          style={{ width: 240 }}
          onChange={ (v :string) => { setPadding(v); setDefaultPadding(v); } }
          options={ arrayToOptions(paddingList) }
        />
      </Form.Item>
      <Form.Item label="默认编码">
        <Select
          value={ code }
          style={{ width: 240 }}
          onChange={ (v :string) => { setCode(v); setDefaultCode(v); } }
          options={ arrayToOptions(codeList) }
        />
      </Form.Item>
      <Form.Item label="默认偏移量(IV)">
        <Space>
          <Input
            status= { ivStatus }
            maxLength = { 32 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onIVChange }
            value= { iv } />
          { iv.length? iv.length + " / 16" : null }
        </Space>
      </Form.Item>
      <Form.Item label="默认密钥 (16 字符或 32 位 HEX)">
        <Space>
          <Input
            status= { passphraseStatus }
            maxLength= { 32 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length? passphrase.length + " / 16" : null }
        </Space>
      </Form.Item>
    </>
  );
}

export default SM4CryptoSetting;