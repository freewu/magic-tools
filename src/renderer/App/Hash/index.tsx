import { Checkbox, Form, Input, Divider, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"

import sha256 from 'crypto-js/sha256';
import sha1 from 'crypto-js/sha1';
import sha512 from 'crypto-js/sha512';
import md5 from 'crypto-js/md5';
import type { CheckboxChangeEvent } from 'antd/es/checkbox'

const Hash = () => {

  const emptyResult = {
    "md5": "",
    "md516": "",
    "sha1": "",
    "sha256": "",
    "sha512": "",
  };

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(false);
  const [ hash, setHash ] = useState(emptyResult);

  const inputStyle = { cursor: "pointer" };
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    openNotification("bottomRight");
  };

  const [api, contextHolder] = message.useMessage();
  const openNotification = (placement :string ) => {
    api.success("复制到粘贴板成功！！！");
  };

  const upperLowerFormat = (str :string,flag :boolean) => {
    if(flag) return str.toUpperCase();
    return str.toLowerCase();
  }

  const onChange = (e :CheckboxChangeEvent) => {
    const flag = e.target.checked;
    setChecked(e.target.checked);
    // 如果加密内容不为空，处理 hash 值的大小问题
    if ( value.trim() != "") {
      const result = {
        "md5": upperLowerFormat(hash["md5"],flag),
        "md516": upperLowerFormat(hash["md516"],flag),
        "sha1": upperLowerFormat(hash["sha1"],flag),
        "sha256": upperLowerFormat(hash["sha256"],flag),
        "sha512": upperLowerFormat(hash["sha512"],flag),
      };
      setHash(result);
    }
  };

  const calHash = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    if (value != "") {
      const result = {
        "md5": upperLowerFormat(md5(value).toString(),checked),
        "md516": "",
        "sha1": upperLowerFormat(sha1(value).toString(),checked),
        "sha256": upperLowerFormat(sha256(value).toString(),checked),
        "sha512": upperLowerFormat(sha512(value).toString(),checked),
      };
      // 处理 16 位 md5 
      result["md516"] = upperLowerFormat(result["md5"].substring(8,24),checked); // 取 9-24 位
      setHash(result);
    } else {
      setHash(emptyResult);
    }
  }

  return (
    <div>
      {contextHolder}
      <TextArea
        value= { value }
        onChange={ calHash }
        placeholder="输入需要计算 Hash 值的内容"
        autoSize={{ minRows: 3, maxRows: 5 }}
      />
      <Checkbox onChange={onChange} value={ checked }>大写字符显示</Checkbox>

      <Divider dashed />

      <Form name="basic"labelCol={{ span: 3 }}autoComplete="off">
        <Form.Item label="MD5 (16位)">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { hash.md516 } />
        </Form.Item>
        <Form.Item label="MD5 (32位)">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { hash.md5 } />
        </Form.Item>
        <Form.Item label="SHA1">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { hash.sha1 } />
        </Form.Item>
        <Form.Item label="SHA256">
          <Input readOnly style={ inputStyle} onClick={ inputClick } value= { hash.sha256 }/>
        </Form.Item>
        <Form.Item label="SHA512">
          <TextArea readOnly style={ inputStyle} onClick={ inputClick } value= { hash.sha512 }/>
        </Form.Item>
      </Form>

    </div>
  );
}

export default Hash;