import { Checkbox, Form, Input, Divider, message, Space, Tag, Button } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard, debounce } from "./../../lib"
import { openFile } from "../../lib/file"
import { emptyResult } from "./data"

import HmacSHA256 from 'crypto-js/hmac-sha256';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import HmacSHA512 from 'crypto-js/hmac-sha512';
import HmacMD5 from 'crypto-js/hmac-md5';
import HmacSHA3 from 'crypto-js/hmac-sha3';
import HmacRipeMD160 from 'crypto-js/hmac-ripemd160';
import HmacSHA224 from 'crypto-js/hmac-sha224';
import HmacSHA384 from 'crypto-js/hmac-sha384';

import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { getPasswordList } from "../Hash/lib";
import "./hmac-hash.css";
import { getDefaultPassphrase, getDefaultShowUppercase } from "./lib"

const HmacHash = () => {

  const genFormHeight = () => {
    return (window.innerHeight - 300) + "px";
  };

  const [ height, setHeight ] = useState(genFormHeight()); // 窗口大小高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genFormHeight()) },100) );

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(getDefaultShowUppercase());
  const [ hash, setHash ] = useState(emptyResult);
  const [ notice, contextHolder] = message.useMessage();
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 密钥

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

  const onChange = (e :CheckboxChangeEvent) => {
    setChecked(!checked);
    // 如果加密内容不为空，处理 hash 值的大小问题
    if ( value.trim() != "") {
      const result = {
        "md5": upperLowerFormat(hash["md5"],!checked),
        "sha1": upperLowerFormat(hash["sha1"],!checked),
        "sha256": upperLowerFormat(hash["sha256"],!checked),
        "sha512": upperLowerFormat(hash["sha512"],!checked),
        "sha3": upperLowerFormat(hash["sha3"],!checked),
        "sha224": upperLowerFormat(hash["sha224"],!checked),
        "sha384": upperLowerFormat(hash["sha384"],!checked),
        "ripemd160": upperLowerFormat(hash["ripemd160"],!checked),
      };
      setHash(result);
    }
  };

  const changeValue = (value :string) => {
    setValue(value);
    if (value.trim() != "") {
      calcHash(value,passphrase);
    } else {
      setHash(emptyResult);
    }
  }

  const calcHash = (value :string,passphrase :string) => {
    setValue(value);
    value = value.trim();
    const result = {
      "md5": upperLowerFormat(HmacMD5(value,passphrase).toString(),checked),
      "md516": "",
      "sha1": upperLowerFormat(HmacSHA1(value,passphrase).toString(),checked),
      "sha256": upperLowerFormat(HmacSHA256(value,passphrase).toString(),checked),
      "sha512": upperLowerFormat(HmacSHA512(value,passphrase).toString(),checked),
      "sha3": upperLowerFormat(HmacSHA3(value,passphrase).toString(),checked),
      "sha224": upperLowerFormat(HmacSHA224(value,passphrase).toString(),checked),
      "sha384": upperLowerFormat(HmacSHA384(value,passphrase).toString(),checked),
      "ripemd160": upperLowerFormat(HmacRipeMD160(value,passphrase).toString(),checked),
    };
    setHash(result);
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
                    onClick={ () => { calcHash(password, passphrase) } } >{ password }</Tag>
                )
              }
           })
        }
      </Space>

      <TextArea
        className="textarea"
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ (e) => { changeValue(e.target.value) } }
        placeholder="输入需要计算 Hash 值的内容 或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, changeValue ); } }
      />

      <Space>
        <Button 
          onClick={ () => { setValue(''); setHash(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
        <Checkbox onChange={onChange} checked={ checked }>结果大写字符显示</Checkbox>
        <Input
          placeholder="密钥"
          allowClear
          style={ { width: "240px" } }
          onChange={ (e) => { 
            setPassphrase( e.target.value.trim() );
            if(value.trim() !== '') calcHash(value, e.target.value.trim()) 
          } }
          value= { passphrase } />
      </Space>

      <Divider dashed />
      
      <div className="hash-form textarea" style={ { height: height, overflowY: "auto",paddingRight: 12 } } >
        <Form name="basic"labelCol={{ span: 4 }}autoComplete="off">
          <Form.Item label="Hmac-MD5">
            <Input readOnly showCount onClick={ inputClick } value= { hash.md5 } />
          </Form.Item>
          <Form.Item label="Hmac-SHA1">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha1 } />
          </Form.Item>
          <Form.Item label="Hmac-RipeMD160">
            <Input readOnly showCount onClick={ inputClick } value= { hash.ripemd160 } />
          </Form.Item>
          <Form.Item label="Hmac-SHA256">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha256 } />
          </Form.Item>
          <Form.Item label="Hmac-SHA3">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha3 } title={ hash.sha3 } />
          </Form.Item>
          <Form.Item label="Hmac-SHA224">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha224 } />
          </Form.Item>
          <Form.Item label="Hmac-SHA384">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha384 } title={ hash.sha384 } />
          </Form.Item>
          <Form.Item label="Hmac-SHA512">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha512 } title={ hash.sha512 } />
          </Form.Item>
        </Form>
      </div>

    </div>
  );
}

export default HmacHash;