import { Checkbox, Form, Input, Divider, message, Space,Tag, Button } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { emptyResult, HashResult } from "./data"
import HmacSHA256 from 'crypto-js/hmac-sha256';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import HmacSHA512 from 'crypto-js/hmac-sha512';
import HmacMD5 from 'crypto-js/hmac-md5';
import HmacSHA3 from 'crypto-js/hmac-sha3';
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { getPasswordList } from "../Hash/lib"

const HmacHash = () => {

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(false);
  const [ hash, setHash ] = useState(emptyResult);
  const [ notice, contextHolder] = message.useMessage();
  const [ passphrase, setPassphrase ] = useState(''); // 密钥


  const inputStyle = { cursor: "pointer" };

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    notice.success("复制到粘贴板成功！！！");
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
      };
      setHash(result);
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
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
                    key={ password }
                    color={ calcTagColor(index) } style={ inputStyle } 
                    onClick={ () => { calcHash(password, passphrase) } } >{ password }</Tag>
                )
              }
           })
        }
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder="输入需要计算 Hash 值的内容"
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Space>
        <Button 
          onClick={ () => { setValue(''); setHash(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
        <Checkbox onChange={onChange} checked={ checked }>大写字符显示</Checkbox>
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

      <Form name="basic"labelCol={{ span: 3 }}autoComplete="off">
        <Form.Item label="Hmac-MD5">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.md5 } />
        </Form.Item>
        <Form.Item label="Hmac-SHA1">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha1 } />
        </Form.Item>
        <Form.Item label="Hmac-SHA3">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha3 } />
        </Form.Item>
        <Form.Item label="Hmac-SHA256">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha256 }/>
        </Form.Item>
        <Form.Item label="Hmac-SHA512">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha512 }/>
        </Form.Item>
      </Form>

    </div>
  );
}

export default HmacHash;