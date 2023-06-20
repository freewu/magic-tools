import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { codeList } from "./data";
import { getDefaultCode, getDefaultRound, setDefaultCode, setDefaultRound } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase, genPassphraseLimitLength } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

const RabbitCryptoSetting = () => {

  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码偏移量
  const [ round, setRound ] = useState(getDefaultRound()); // 默认循环次数
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥
  const [ passphraseStatus, setPassphraseStatus ] = useState('' as InputStatus); // 密钥提醒
  const [ passphraseLimitLength, setPassphraseLimitLength ] = useState(genPassphraseLimitLength(getDefaultPassphrase().length)); // 密钥长度要求 16

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v); 
    // Passphrase 长度必须为 0 / 8
    if(v.length === 0 || v.length == 16) {
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
      <Divider orientation="left" plain>TEA 加解密</Divider>
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
          maxLength={ 3 }
          value={ round }
          style={{ width: 240 }}
          onChange={ (e) => { 
            const v = e.target.value.trim();
            if (v == "") {
              setRound(''); 
              setDefaultRound('');
            } else {
              const a = parseInt(v);
              // 只允许偶数
              if( a % 2 === 0 ) { 
                setRound(v); 
                setDefaultRound(v);
              } 
            }
          } }
        />
      </Form.Item>
      <Form.Item label="默认密钥">
        <Space>
          <Input 
            status= { passphraseStatus }
            maxLength= { 16 }
            allowClear
            style={ { width: "520px" } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length? passphrase.length + " / " + 16  : null }
        </Space>
      </Form.Item>
    </>
  );
}

export default RabbitCryptoSetting;