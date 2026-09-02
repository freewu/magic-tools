import { Select, Form, Divider, Input, Space } from "antd";
import React, { useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { codeList } from "./data";
import { getDefaultCode, getDefaultRound, setDefaultCode, setDefaultRound } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

export const XTEACryptoSetting = () => {

  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ round, setRound ] = useState(getDefaultRound()); // 默认循环次数
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥
  const [ passphraseStatus, setPassphraseStatus ] = useState((16 === getDefaultPassphrase().length)? '' as InputStatus : 'error' as InputStatus); // 密钥提醒
  const [ roundStatus, setRoundStatus ] = useState((/^[1-9]\d{0,2}$/.test(getDefaultRound()))? '' as InputStatus : 'error' as InputStatus); // 循环次数提醒

  // 密钥 Passphrase 输入处理 (允许为空或 16 位)
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    if(v.length === 0 || v.length === 16) {
      setDefaultPassphrase(v);
      setPassphraseStatus("");
    } else {
      setPassphraseStatus("error");
    }
  }

  // 循环次数输入处理 (允许为空或 1 ~ 999)
  const onRoundChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, '');
    setRound(v);
    if(v === '' || /^[1-9]\d{0,2}$/.test(v)) {
      setDefaultRound(v);
      setRoundStatus("");
    } else {
      setRoundStatus("error");
    }
  }

  return (
    <>
      <Divider orientation="left" plain>XTEA 加解密</Divider>
      <Form.Item label="默认编码">
        <Select
          value={ code }
          style={{ width: 240 }}
          onChange={ (v :string) => { setCode(v); setDefaultCode(v); } }
          options={ arrayToOptions(codeList) }
        />
      </Form.Item>
      <Form.Item label="默认循环次数">
        <Input
          status={ roundStatus }
          maxLength={ 3 }
          value={ round }
          style={{ width: 240 }}
          onChange={ onRoundChange }
        />
      </Form.Item>
      <Form.Item label="默认密钥">
        <Space>
          <Input
            status={ passphraseStatus }
            showCount
            maxLength= { 16 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
        </Space>
      </Form.Item>
    </>
  );
}
