import { Checkbox, Form, Input, Divider, message, Space, Tag, Button, InputNumber, Select, Row } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import { hashAlgoList } from "./data"
import { getDefaultHashAlgo,getDefaultIteration,getDefaultKeyLength,getDefaultSalt} from "./lib"
import { genValuePlaceholder, getHashAlgo, getDefaultShowUppercase } from "./lib"

import * as CryptoJS from 'crypto-js';

import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { getPasswordList } from "../Hash/lib";
import "./pbkdf2.css";

const PBKDF2Calc = () => {


  const [ value, setValue ] = useState(''); // 需要计算 hash 值的内容
  const [ algo, setAlgo ] = useState(getDefaultHashAlgo()); // 使用的 Hash 算法
  const [ salt, setSalt ] = useState(getDefaultSalt()); // 盐值
  const [ iter, setIter ] = useState(getDefaultIteration()); // 迭代次数
  const [ keyLength, setKeyLength ] = useState(getDefaultKeyLength()); // 推导密钥长度(位)
  const [ checked, setChecked ] = useState(getDefaultShowUppercase());
  const [ result, setResult ] = useState('');
  const [ notice, contextHolder] = message.useMessage();
  const [ valuePlaceholder, setValuePlaceholder ] = useState(genValuePlaceholder(getDefaultHashAlgo())); // 计算内容提示

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const upperLowerFormat = (str :string,flag :boolean) => {
    if(flag) return str.toUpperCase();
    return str.toLowerCase();
  }

  // 结果内容展示 大小写切换
  const onCheckChange = (e :CheckboxChangeEvent) => {
    setChecked(!checked);
    // 如果加密内容不为空，处理 hash 值的大小问题
    if ( value.trim() != "") {
      setResult(upperLowerFormat(result, !checked));
    }
  };

  // 需要计算的内容变更
  const changeValue = (value :string) => {
    setValue(value);
    if (value.trim() != "") {
      calcHash(value, salt,algo,iter,keyLength);
    } else {
      setResult('');
    }
  }

  // 计算 PBKDF2 Hash 值
  const calcHash = (value :string,salt :string,algo :string,iter :number,keyLength :number) => {
    setValue(value);
    value = value.trim();

    const r = CryptoJS.PBKDF2(value,salt,{ 
      keySize : keyLength / 8,
      iterations: iter,
      hasher: getHashAlgo(algo)
    })
    /**
      switch(code) {
        case "Base64": return setDecodeValue(CryptoJS.enc.Base64.stringify(value.ciphertext));
        case "HEX": return setDecodeValue(CryptoJS.enc.Hex.stringify(value.ciphertext));
      }
     */
    setResult(upperLowerFormat(CryptoJS.enc.Hex.stringify(r), checked));
  }

  const calcTagColor = (index :number) => {
    switch(index % 4) {
      case 1: return '#2db7f5';
      case 2: return '#87d068';
      case 3: return '#108ee9';
    }
    return '#ff5500';
  }

  return (
    <div>
      {contextHolder}
      
      <Space size={[0, 8]} wrap>
        {
           getPasswordList()?.map((password, index) => {
              // 只展示 10 个
              if(index < 10) {
                return (
                  <Tag 
                    className="hash-tag"
                    key={ password }
                    color={ calcTagColor(index) }
                    onClick={ () => { calcHash( password, salt,algo,iter,keyLength) } } >{ password }</Tag>
                )
              }
           })
        }
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ (e) => { changeValue(e.target.value) } }
        placeholder= { valuePlaceholder }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, changeValue ); } }
      />

      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>盐值:</label>
          <Input
            showCount
            placeholder="盐值(Salt)"
            allowClear
            style={ { width: 735 } }
            onChange={ 
              (e) => { 
                const v = e.target.value.trim();
                setSalt( v );
                if(value.trim() !== '') calcHash(value, v,algo,iter,keyLength);
              } 
            }
            value= { salt } />
        </Space>
      </Row>

      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>算法:</label>
          <Select
            value={ algo }
            style={{ width: 120 }}
            onChange={ (v:string) => { 
              setValuePlaceholder(genValuePlaceholder(v));
              setAlgo(v);
              if(value.trim() !== '') calcHash(value, salt,v,iter,keyLength);
            } }
            options={ arrayToOptions(hashAlgoList) }
          />
          <label>迭代次数:</label>
          <InputNumber
            addonAfter="次"
            min = { 1 }
            max = { 100000 }
            style={ { width: 120 } }
            onChange={ (v :number | null) => { 
              if(v != null) {
                if(v >= 1 && v <= 100000) {
                  setIter(v);
                  if(value.trim() !== '') calcHash(value, salt,algo,v,keyLength);
                }
              } 
            } }
            value= { iter } />
          <label>推导密钥长度:</label>
          <InputNumber
            addonAfter="位"
            min = { 16 }
            max = { 2048 }
            style={ { width: 120 } }
            onChange={ (v :number | null) => { 
              if(v != null) {
                if(v >= 16 && v <= 2048) {
                  setKeyLength(v);
                  if(value.trim() !== '') calcHash(value, salt,algo,iter,v);
                }
              } 
            } }
            value= { keyLength } />     
          <Checkbox onChange={ onCheckChange } checked={ checked }>大写字符显示</Checkbox>
          <Button 
            onClick={ () => { setValue(''); setResult(''); } }
            style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
          >清除</Button>
        </Space>
      </Row>

      <Divider dashed />

      <TextArea
        showCount
        readOnly
        onDoubleClick={ inputClick }
        title="双击复制结果到粘贴板"
        style={ { margin: "5px 0 5px 0" }}
        value= { result }
        placeholder="计算结果"
        autoSize={{ minRows: 10, maxRows: 15 }}
      />
      
    </div>
  );
}

export default PBKDF2Calc;