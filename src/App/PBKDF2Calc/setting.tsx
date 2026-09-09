import { Select, Form, Divider, Input, InputNumber } from "antd";
import React,{ useState } from "react";
import { arrayToOptions } from "../../lib/array"
import { hashAlgoList } from "./data";
import { getDefaultHashAlgo, setDefaultHashAlgo } from "./lib";
import { getDefaultSalt, setDefaultSalt } from "./lib";
import { getDefaultIteration, setDefaultIteration } from "./lib";
import { getDefaultKeyLength, setDefaultKeyLength } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

export const PBKDF2CalcSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ algo, setAlgo ] = useState(getDefaultHashAlgo()); //  Hash 算法
  const [ salt, setSalt ] = useState(getDefaultSalt()); // 盐值
  const [ iter, setIter ] = useState(getDefaultIteration()); // 迭代次数
  const [ keyLength, setKeyLength ] = useState(getDefaultKeyLength()); // 推导密钥的长度

  return (
    <>
      <Divider orientation="left" plain>{ st('PBKDF2 值计算') }</Divider>
      {/* <Form.Item label={ st('默认 Hash 算法') }>
        <Select
          value={ algo }
          style={{ width: 240 }}
          onChange={ (v :string) => { setAlgo(v); setDefaultHashAlgo(v); } }
          options={ arrayToOptions(hashAlgoList) }
        />
      </Form.Item> */}
      <Form.Item label={ st('默认盐值(Salt)') }>
        <Input 
          showCount
          allowClear
          style={ { width: "100%", maxWidth: 520 } }
          onChange={ (e) => { setSalt(e.target.value); setDefaultSalt(e.target.value); } }
          value= { salt } />
      </Form.Item>
      <Form.Item label={ st('迭代次数') }>
        <InputNumber
          addonAfter="次"
          min = { 1 }
          max = { 100000 }
          style={ { width: 200 } }
          onChange={ (v :number | null) => { 
            if(v != null) {
              if(v >= 1 && v <= 100000) {
                setDefaultIteration(v);
                setIter(v);
              }
            } 
          } }
          value= { iter } />
      </Form.Item>
      <Form.Item label={ st('推导密钥长度') }>
        <InputNumber
          addonAfter="位"
          placeholder= { st('推荐 128 / 256 / 512') }
          title= { st('推荐 128 / 256 / 512') }
          min = { 16 }
          max = { 2048 }
          style={ { width: 200 } }
          onChange={ (v :number | null) => { 
            if(v != null) {
              if(v >= 16 && v <= 1024) {
                setDefaultKeyLength(v);
                setKeyLength(v);
              }
            } 
          } }
          value= { keyLength } />
      </Form.Item>
    </>
  );
}