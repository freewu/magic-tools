import { Checkbox, Form, Input, Divider, message, Space, Tag, Button } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { emptyResult } from "./data"
import RipeMD160 from 'crypto-js/ripemd160';
import HmacSHA256 from 'crypto-js/';

import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { getPasswordList } from "../Hash/lib"

const RipeMDCalc = () => {

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(false);
  const [ hash, setHash ] = useState(emptyResult);
  const [ notice, contextHolder] = message.useMessage();

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
        "ripemd160": upperLowerFormat(hash["ripemd160"],!checked),
        "ripemd128": upperLowerFormat(hash["ripemd128"],!checked),
        "ripemd256": upperLowerFormat(hash["ripemd256"],!checked),
        "ripemd320": upperLowerFormat(hash["ripemd320"],!checked),
      };
      setHash(result);
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setValue(value);
    if (value.trim() != "") {
      calcHash(value);
    } else {
      setHash(emptyResult);
    }
  }

  const calcHash = (value :string) => {
    setValue(value);
    value = value.trim();
    const result = {
      "ripemd160": upperLowerFormat(RipeMD160(value).toString(), checked),
      // "ripemd128": upperLowerFormat(RipeMD160(value, { length: 128 }).toString(),checked),
      // "ripemd256": upperLowerFormat(RipeMD160(value, { length: 256 }).toString(),checked),
      // "ripemd320": upperLowerFormat(RipeMD160(value, { length: 320 }).toString(),checked),
      "ripemd128": upperLowerFormat("---", checked),
      "ripemd256": upperLowerFormat("---", checked),
      "ripemd320": upperLowerFormat("---", checked),
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
                    onClick={ () => { calcHash(password) } } >{ password }</Tag>
                )
              }
           })
        }
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder="输入需要计算 RipeMD 值的内容"
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Space>
        <Button 
          onClick={ () => { setValue(''); setHash(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
        <Checkbox onChange={onChange} checked={ checked }>大写字符显示</Checkbox>
      </Space>

      <Divider dashed />

      <Form name="basic"labelCol={{ span: 3 }}autoComplete="off">
        <Form.Item label="RipeMD-160">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.ripemd160 } />
        </Form.Item>
        <Form.Item label="RipeMD-128">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.ripemd128 } />
        </Form.Item>
        <Form.Item label="RipeMD-256">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { hash.ripemd256 } />
        </Form.Item>
        <Form.Item label="RipeMD-320">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { hash.ripemd320 }/>
        </Form.Item>
      </Form>

    </div>
  );
}

export default RipeMDCalc;