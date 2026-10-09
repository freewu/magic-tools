import { Select, Form, Divider, Input, Space } from "antd";
import React,{ useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { algorithmList, codeList } from "./data";
import { checkFixedHex, getDefaultAlgorithm, getDefaultCode, getDefaultIV, getDefaultKey, ivLenOf, keyLenOf, setDefaultAlgorithm, setDefaultCode, setDefaultIV, setDefaultKey } from "./lib";
import type { ZucAlgorithm, ZucCode } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

import { useLocale } from "../../hook/locale-context";
import { row as _r } from "../Setting/rows-lang";

export const ZucCryptoSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ algorithm, setAlgorithm ] = useState<ZucAlgorithm>(getDefaultAlgorithm()); // 默认算法
  const [ code, setCode ] = useState(getDefaultCode()); // 默认编码
  const [ key, setKey ] = useState(getDefaultKey()); // 默认密钥 (HEX)
  const [ iv, setIV ] = useState(getDefaultIV()); // 默认偏移量 IV (HEX)

  // 密钥 / IV 长度随算法变化 (字节), 输入为 HEX 故位数 = 字节数 * 2
  const keyDigits = keyLenOf(algorithm) * 2;
  const ivDigits = ivLenOf(algorithm) * 2;
  const keyStatus :InputStatus = (checkFixedHex(key, keyDigits / 2).ok || key === '')? '' : 'error';
  const ivStatus :InputStatus = (checkFixedHex(iv, ivDigits / 2).ok || iv === '')? '' : 'error';

  // 切换算法: 长度已不匹配的默认密钥 / IV 一并清空, 避免工具页带出用不了的值
  const onAlgorithmChange = (v :ZucAlgorithm) => {
    setAlgorithm(v);
    setDefaultAlgorithm(v);
    if(!checkFixedHex(key, keyLenOf(v)).ok) { setKey(''); setDefaultKey(''); }
    if(!checkFixedHex(iv, ivLenOf(v)).ok) { setIV(''); setDefaultIV(''); }
  };

  // 密钥输入处理: 空值或定长 HEX 才写入默认值 (半成品不落库)
  const onKeyChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setKey(v);
    if(v === '' || checkFixedHex(v, keyDigits / 2).ok) setDefaultKey(v);
  };

  // 偏移量 IV 输入处理
  const onIVChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIV(v);
    if(v === '' || checkFixedHex(v, ivDigits / 2).ok) setDefaultIV(v);
  };

  return (
    <>
      <Divider orientation="left" plain>{ st('祖冲之序列密码') }</Divider>
      <Form.Item label={ st('默认算法') }>
        <Select
          value={ algorithm }
          style={{ width: 240 }}
          onChange={ onAlgorithmChange }
          options={ arrayToOptions(algorithmList) }
        />
      </Form.Item>
      <Form.Item label={ st('默认编码') }>
        <Select
          value={ code }
          style={{ width: 240 }}
          onChange={ (v :ZucCode) => { setCode(v); setDefaultCode(v); } }
          options={ arrayToOptions(codeList) }
        />
      </Form.Item>
      <Form.Item label={ st('默认密钥') }>
        <Space style={{ width: "100%" }}>
          <Input
            status= { keyStatus }
            maxLength = { keyDigits }
            allowClear
            style={ { width: "100%", maxWidth: 520 } }
            onChange={ onKeyChange }
            value= { key } />
          { key.length? key.length + " / " + keyDigits : null }
        </Space>
      </Form.Item>
      <Form.Item label={ st('默认偏移量(IV)') }>
        <Space style={{ width: "100%" }}>
          <Input
            status= { ivStatus }
            maxLength = { ivDigits }
            allowClear
            style={ { width: "100%", maxWidth: 520 } }
            onChange={ onIVChange }
            value= { iv } />
          { iv.length? iv.length + " / " + ivDigits : null }
        </Space>
      </Form.Item>
    </>
  );
}
