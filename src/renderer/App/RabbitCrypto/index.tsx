import { Select, Divider, Button,Input, Space, message,Row } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { arrayToOptions } from "../../lib/array"
import * as CryptoJS from 'crypto-js';
import { codeList } from "./data";
import { getDefaultIV, getDefaultCode, getDefaultPassphrase } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

const RabbitCrypto = () => {

  const genDefaultPassphraseStatus = () :InputStatus => {
    const p = getDefaultPassphrase();
    return ( 8 === p.length)? '' : 'error';
  }

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 偏移量
  const [ passphrase, setPassphrase] = useState(getDefaultPassphrase()); // 秘钥
  const [ ivStatus, setIVStatus ] = useState( ((getDefaultIV().length !== 8)? 'error' : '') as InputStatus); // 偏移量提醒
  const [ passphraseStatus, setPassphraseStatus ] = useState(genDefaultPassphraseStatus()); // 密钥提醒

  const isCanDo = (value :string) :boolean => {
    // 需要加密的内容为空
    if(value.trim() === "") return false;
    // 密钥不符合
    if('' !== passphraseStatus) return false;
    // 偏移量不符合
    if('' !== ivStatus) return false;

    return true;
  }

  // 加密处理
  const encode = () => {
    if(!isCanDo(encodeValue)) return ;
    try {
      const value = CryptoJS.Rabbit.encrypt(
        encodeValue,
        CryptoJS.enc.Utf8.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
        {
          iv: CryptoJS.enc.Utf8.parse(iv),
        }
      );
      switch(code) {
        case "Base64": return setDecodeValue(CryptoJS.enc.Base64.stringify(value.ciphertext));
        case "HEX": return setDecodeValue(CryptoJS.enc.Hex.stringify(value.ciphertext));
      }
    } catch (error) {
      console.log(error);
      //notice.error(e);
    }
  };

  // 解密处理 
  const decode = () => {
    if(!isCanDo(decodeValue)) return ;
    try {
      const value = CryptoJS.Rabbit.decrypt(
        (code === "Base64")? decodeValue : CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(decodeValue)), // 需传入 base64的值 
        CryptoJS.enc.Utf8.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
        {
          iv: CryptoJS.enc.Utf8.parse(iv),
        }
      );
      // 解密处理
      const result = value.toString(CryptoJS.enc.Utf8);
      if("" === result) {
        notice.error("解密失败");
      }
      return setEncodeValue(result);
    } catch (error) {
      console.log(error);
      //notice.error(error);
    }
  };

  // 清除内容 有选择变化,清除结果?
  const clear = () => {
    setEncodeValue('');
    setDecodeValue('');
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  // 偏移量 IV 输入处理
  const onIVChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIV(v); 
    if(v.length == 8) { // IV长度必须为 8 64位
      setIVStatus("");
    } else {
      setIVStatus("error");
    }
  }

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    if(v.length == 16) { // 密钥长度必须为 16  128位
      setPassphraseStatus("");
    } else {
      setPassphraseStatus("error");
    }
  }

  return (
    <div>
      { contextHolder }

      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>编码:</label>
          <Select
            value={ code }
            style={{ width: 120 }}
            onChange={ (v :string) => { setCode(v) } }
            options={ arrayToOptions(codeList) }
          />
          <label>密钥:</label>
          <Input
            allowClear
            maxLength = { 16 }
            status={ passphraseStatus }
            style={ { width: 200 } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length } / { 16 }
          <label>偏移量(IV):</label>
          <Input 
            allowClear
            status={ ivStatus }
            maxLength={ 8 }
            style={ { width: 200 } }
            onChange={ onIVChange }
            value= { iv } />
          { iv.length } / { 8 }
        </Space>
      </Row>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="需要进行 Rabbit 加密的内容"
        autoSize={{ minRows: 8}}
      />

      <Button 
        onClick={ encode }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >加密</Button>
      <Button 
        onClick={ decode }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >解密</Button>
      <Button 
        onClick={ () =>clear() }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="需要进行 Rabbit 解密的内容"
        autoSize={{ minRows: 8}}
      />
    </div>
  )
}
export default RabbitCrypto;