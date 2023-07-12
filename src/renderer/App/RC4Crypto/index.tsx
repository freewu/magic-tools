import { Select, Divider, Button,Input, Space, message,Row } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const  { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import * as CryptoJS from 'crypto-js';
import { codeList } from "./data";
import { getDefaultCode, getDefaultPassphrase } from "./lib";
import "./rc4-crypto.css"

const RC4Crypto = () => {

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ passphrase, setPassphrase] = useState(getDefaultPassphrase()); // 秘钥

  const isCanDo = (value :string) :boolean => {
    // 需要加密的内容为空
    if(value.trim() === "") return false;
    return true;
  }

  // 加密处理
  const encode = () => {
    if(!isCanDo(encodeValue)) return ;
    try {
      const value = CryptoJS.RC4.encrypt(
        encodeValue,
        CryptoJS.enc.Utf8.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
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
      const value = CryptoJS.RC4.decrypt(
        (code === "Base64")? decodeValue : CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(decodeValue)), // 需传入 base64的值 
        CryptoJS.enc.Utf8.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
      );
      // 解密处理
      const result = value.toString(CryptoJS.enc.Utf8);
      if("" === result) {
        notice.error("解密失败");
      }
      return setEncodeValue(result);
    } catch (error) {
      console.log(error);
      notice.error("解密失败");
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

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
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
            showCount
            allowClear
            maxLength = { 256 }
            style={ { width: 587 } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
        </Space>
      </Row>

      <TextArea
        className="textarea"
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="输入需要进行 RC4 加密的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
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
        className="textarea"
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 CR4 解密的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  )
}
export default RC4Crypto;