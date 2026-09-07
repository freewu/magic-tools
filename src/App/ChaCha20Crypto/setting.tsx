import { Select, Form, Divider, Input, Space, InputNumber } from "antd";
import React, { useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { codeList, COUNTER_MAX } from "./data";
import { getDefaultCode, setDefaultCode } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase } from "./lib";
import { getDefaultNonce, setDefaultNonce } from "./lib";
import { getDefaultCounter, setDefaultCounter } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

export const ChaCha20CryptoSetting = () => {

  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥口令
  const [ passphraseStatus, setPassphraseStatus ] = useState(getDefaultPassphrase().trim() !== '' ? '' : 'error' as InputStatus);
  const [ nonce, setNonce ] = useState(getDefaultNonce()); // 默认 nonce
  const [ nonceStatus, setNonceStatus ] = useState('' as InputStatus);
  const [ counter, setCounter ] = useState(getDefaultCounter()); // 默认计数器

  return (
    <>
      <Divider orientation="left" plain>ChaCha20 加解密</Divider>
      <Form.Item label="默认编码">
        <Space>
          <Select
            value={ code }
            style={{ width: 160 }}
            onChange={ (v :string) => { setCode(v as 'HEX' | 'Base64'); setDefaultCode(v); } }
            options={ arrayToOptions(codeList) }
          />
        </Space>
      </Form.Item>
      <Form.Item label="默认密钥口令">
        <Space>
          <Input
            allowClear
            status={ passphraseStatus }
            style={{ width: 300 }}
            onChange={ (e) => {
              const v = e.target.value.trim();
              setPassphrase(v);
              setPassphraseStatus(v !== '' ? '' : 'error');
              setDefaultPassphrase(v);
            } }
            value={ passphrase }
            placeholder="口令经 SHA-256 派生为 32 字节密钥"
          />
        </Space>
      </Form.Item>
      <Form.Item label="默认 Nonce">
        <Space>
          <Input
            allowClear
            status={ nonceStatus }
            maxLength={ 24 }
            style={{ width: 300 }}
            onChange={ (e) => {
              const v = e.target.value;
              setNonce(v);
              setNonceStatus(/^[0-9a-fA-F]{24}$/u.test(v.trim()) ? '' : 'error');
              setDefaultNonce(v);
            } }
            value={ nonce }
            placeholder="24 位 HEX (12 字节)"
          />
          <span style={{ color: '#999' }}>24 位 HEX 或 12 字符</span>
        </Space>
      </Form.Item>
      <Form.Item label="默认计数器">
        <InputNumber
          min={ 0 }
          max={ COUNTER_MAX }
          step={ 1 }
          precision={ 0 }
          style={{ width: 160 }}
          onChange={ (v :number | null) => {
            if (v != null && v >= 0 && v <= COUNTER_MAX) { setCounter(v); setDefaultCounter(v); }
          } }
          value={ counter }
        />
      </Form.Item>
    </>
  );
}
