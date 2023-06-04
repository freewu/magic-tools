import { Checkbox, Form, Input, Divider, message, Space,Tag } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { emptyResult, HashResult } from "./data"
import sha256 from 'crypto-js/sha256';
import sha1 from 'crypto-js/sha1';
import sha512 from 'crypto-js/sha512';
import md5 from 'crypto-js/md5';
import sha3 from 'crypto-js/sha3';
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { getPasswordList } from "./lib"

const Hash = () => {

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
        "md5": upperLowerFormat(hash["md5"],!checked),
        "md516": upperLowerFormat(hash["md516"],!checked),
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
      calcHash(value);
    } else {
      setHash(emptyResult);
    }
  }

  const calcHash = (value :string) => {
    setValue(value);
    value = value.trim();
    const result = {
      "md5": upperLowerFormat(md5(value).toString(),checked),
      "md516": "",
      "sha1": upperLowerFormat(sha1(value).toString(),checked),
      "sha256": upperLowerFormat(sha256(value).toString(),checked),
      "sha512": upperLowerFormat(sha512(value).toString(),checked),
      "sha3": upperLowerFormat(sha3(value).toString(),checked),
    };
    // 处理 16 位 md5 
    result["md516"] = upperLowerFormat(result["md5"].substring(8,24),checked); // 取 9-24 位
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
        placeholder="输入需要计算 Hash 值的内容"
        autoSize={{ minRows: 5, maxRows: 5 }}
      />
      <Checkbox onChange={onChange} checked={ checked }>大写字符显示</Checkbox>

      <Divider dashed />

      <Form name="basic"labelCol={{ span: 3 }}autoComplete="off">
        <Form.Item label="MD5 (16位)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.md516 } />
        </Form.Item>
        <Form.Item label="MD5 (32位)">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.md5 } />
        </Form.Item>
        <Form.Item label="SHA1">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha1 } />
        </Form.Item>
        <Form.Item label="SHA3">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha3 } />
        </Form.Item>
        <Form.Item label="SHA256">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha256 }/>
        </Form.Item>
        <Form.Item label="SHA512">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { hash.sha512 }/>
        </Form.Item>
      </Form>

    </div>
  );
}

export default Hash;