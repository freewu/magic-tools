import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { modeList, paddingList, codeList } from "./data";
import { getDefaultMode, setDefaultMode } from "./lib";
import { getDefaultPadding, setDefaultPadding } from "./lib";
import { getDefaultCode, setDefaultCode } from "./lib";
import { getDefaultIV, setDefaultIV } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase, genPassphraseLimitLength } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

const AppStoreSetting = () => {

  const [ mode, setMode ] = useState(getDefaultMode()); // 默认 mode
  const [ padding, setPadding ] = useState(getDefaultPadding()); // 默认填充
  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 默认偏移量
  const [ ivStatus, setIVStatus ] = useState('' as InputStatus); // 偏移量提醒
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥
  const [ passphraseStatus, setPassphraseStatus ] = useState('' as InputStatus); // 密钥提醒
  const [ passphraseLimitLength, setPassphraseLimitLength ] = useState(genPassphraseLimitLength(getDefaultPassphrase().length)); // 密钥长度要求 16 / 24 / 32 
 
  // 偏移量 IV 输入处理
  const onIVChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIV(v); 
    if(v.length === 0 || v.length == 16) { // IV长度必须为 0 
      setDefaultIV(v);
      setIVStatus("");
    } else {
      setIVStatus("error");
    }
  }

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v); 
    // Passphrase 长度必须为 0 / 16 (128位) / 24(192位) / 32(256位)
    if(v.length === 0 || v.length == 16 || v.length == 24 || v.length == 32) {
      setDefaultPassphrase(v);
      setPassphraseStatus("");
    } else {
      setPassphraseStatus("error");
    }
    // 根据密钥长度变化需要变量密钥长度提示
    setPassphraseLimitLength(genPassphraseLimitLength(v.length));
  }

  return (
    <>
      <Divider orientation="left" plain>AES 加解密</Divider>
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
            maxLength = { 16 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onIVChange }
            value= { iv } />
          { iv.length? iv.length + " / 16" : null }
        </Space>
      </Form.Item>
      <Form.Item label="默认密钥">
        <Space>
          <Input 
            status= { passphraseStatus }
            maxLength= { 32 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length? passphrase.length + " / " + passphraseLimitLength  : null }
        </Space>
      </Form.Item>
    </>
  );
}

export default AppStoreSetting;