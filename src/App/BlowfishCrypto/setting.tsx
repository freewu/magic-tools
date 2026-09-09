import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { modeList, paddingList, codeList, BLOCK_BYTES } from "./data";
import { getDefaultMode, setDefaultMode } from "./lib";
import { getDefaultPadding, setDefaultPadding } from "./lib";
import { getDefaultCode, setDefaultCode } from "./lib";
import { getDefaultIV, setDefaultIV } from "./lib";
import { getDefaultPassphrase, setDefaultPassphrase, genCapacity } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

// 偏移量(IV) 格式: 块长个字符 (UTF-8) 或 2*块长位 HEX
const ivRequiredLen = () :number => BLOCK_BYTES;

export const BlowfishCryptoSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ mode, setMode ] = useState(getDefaultMode()); // 默认 mode
  const [ padding, setPadding ] = useState(getDefaultPadding()); // 默认填充
  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 默认偏移量
  const [ ivStatus, setIVStatus ] = useState('' as InputStatus); // 偏移量提醒
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 默认密钥
  const [ passphraseStatus, setPassphraseStatus ] = useState('' as InputStatus); // 密钥提醒
  const [ passphraseLimitLength, setPassphraseLimitLength ] = useState(genCapacity(getDefaultPassphrase().length) / 8); // 密钥长度要求 16 / 24 / 32

  // 偏移量 IV 输入处理
  const onIVChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIV(v);
    const ok = v.length === 0 || v.length === ivRequiredLen() || /^[0-9a-fA-F]{16}$/.test(v);
    if (ok) {
      setDefaultIV(v);
      setIVStatus("");
    } else {
      setIVStatus("error");
    }
  }

  // 默认模式切换
  const onModeChange = (v :string) => {
    setMode(v);
    setDefaultMode(v);
    setIVStatus((v === 'ECB' || iv.length === 0 || iv.length === ivRequiredLen() || /^[0-9a-fA-F]{16}$/.test(iv)) ? "" : "error");
  }

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    // Passphrase 长度必须为 0 / 16 (128位) / 24 (192位) / 32 (256位)
    if(v.length === 0 || v.length === 16 || v.length === 24 || v.length === 32) {
      setDefaultPassphrase(v);
      setPassphraseStatus("");
    } else {
      setPassphraseStatus("error");
    }
    setPassphraseLimitLength(genCapacity(v.length) / 8);
  }

  return (
    <>
      <Divider orientation="left" plain>{ st('Blowfish 加解密') }</Divider>
      <Form.Item label={ st('默认模式') }>
        <Select
          value={ mode }
          style={{ width: 240 }}
          onChange={ onModeChange }
          options={ arrayToOptions(modeList) }
        />
      </Form.Item>
      <Form.Item label={ st('默认填充') }>
        <Select
          value={ padding }
          style={{ width: 240 }}
          onChange={ (v :string) => { setPadding(v); setDefaultPadding(v); } }
          options={ arrayToOptions(paddingList) }
        />
      </Form.Item>
      <Form.Item label={ st('默认编码') }>
        <Select
          value={ code }
          style={{ width: 240 }}
          onChange={ (v :string) => { setCode(v); setDefaultCode(v); } }
          options={ arrayToOptions(codeList) }
        />
      </Form.Item>
      <Form.Item label={ st('默认偏移量(IV)') }>
        <Space style={{ width: "100%" }}>
          <Input
            status= { ivStatus }
            maxLength = { BLOCK_BYTES * 2 }
            allowClear
            style={ { width: "100%", maxWidth: 520 } }
            onChange={ onIVChange }
            value= { iv } />
          <span style={ { color: "#999", fontSize: 12 }}>{ rowT(locale, '块长 ${b} 字节: ${l} 个字符 或 ${h} 位 HEX (ECB 无需)', { b: BLOCK_BYTES, l: ivRequiredLen(), h: BLOCK_BYTES * 2 }) }</span>
        </Space>
      </Form.Item>
      <Form.Item label={ st('默认密钥') }>
        <Space style={{ width: "100%" }}>
          <Input
            status= { passphraseStatus }
            maxLength= { 32 }
            allowClear
            style={ { width: "100%", maxWidth: 520 } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length ? passphrase.length + " / " + passphraseLimitLength  : null }
        </Space>
      </Form.Item>
    </>
  );
}

export default BlowfishCryptoSetting;
