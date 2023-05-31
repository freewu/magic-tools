import { Select, Divider, Button,Input, Space, message,Row } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { arrayToOptions } from "../../lib/array"
import aes from 'crypto-js/aes';
import * as CryptoJS from 'crypto-js';
import { modeList, paddingList, codeList, capacityList } from "./data";
import { getDefaultIV, getDefaultCode, getDefaultMode, getDefaultPadding, getDefaultPassphrase,genCapacity } from "./lib";
import { getPadding, getMode } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

const AESCrypto = () => {

  const genDefaultPassphraseStatus = () :InputStatus => {
    const p = getDefaultPassphrase();
    return ( (genCapacity(p.length) / 8) === p.length)? '' : 'error';
  }

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ mode, setMode ] = useState(getDefaultMode()); // 模式
  const [ padding, setPadding ] = useState(getDefaultPadding()); // 填充
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 偏移量
  const [ passphrase, setPassphrase] = useState(getDefaultPassphrase()); // 秘钥
  const [ capacity, setCapacity ] = useState(genCapacity(getDefaultPassphrase().length)); // 位数
  const [ ivDisabled, setIVDisabled ] = useState(getDefaultMode() == 'ECB'); // iv 是否可用 ECB 模式下不需要 iv
  const [ ivStatus, setIVStatus ] = useState( ((getDefaultIV().length !== 16)? 'error' : '') as InputStatus); // 偏移量提醒
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
      const value = CryptoJS.AES.encrypt(
        encodeValue,
        CryptoJS.enc.Hex.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
        {
          mode: getMode(mode),
          padding: getPadding(padding),
          iv: ('ECB' === mode)? CryptoJS.enc.Hex.parse('') : CryptoJS.enc.Hex.parse(iv),
        }
      );
      switch(code) {
        case "Base64": return setDecodeValue(CryptoJS.enc.Base64.stringify(value.ciphertext));
        case "HEX": return setDecodeValue(CryptoJS.enc.Hex.stringify(value.ciphertext));
      }
    } catch (e :any) {
      console.log(e);
      notice.error(e);
    }
  };

  // 解密处理 
  const decode = () => {
    if(!isCanDo(decodeValue)) return ;
    try {
      const value = aes.decrypt(
        decodeValue,
        CryptoJS.enc.Hex.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
        {
          mode: getMode(mode),
          padding: getPadding(padding),
          iv: ('ECB' === mode)? CryptoJS.enc.Hex.parse('') : CryptoJS.enc.Hex.parse(iv),
        }
      );
      switch(code) {
        case "Base64": return setEncodeValue(value.toString(CryptoJS.enc.Base64));
        case "HEX": return setEncodeValue(value.toString(CryptoJS.enc.Hex));
      }
    } catch (e :any) {
      console.log(e);
      notice.error(e);
    }
  };

  // 清除内容 有选择变化,清除结果?
  const clear = () => {
    setEncodeValue('');
    setDecodeValue('');
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    notice.success("复制到粘贴板成功！！！");
  };

  // 偏移量 IV 输入处理
  const onIVChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIV(v); 
    if(v.length == 16) { // IV长度必须为 0 
      setIVStatus("");
    } else {
      setIVStatus("error");
    }
  }
 
  // 模式切换
  const onModeChange = (v :string) => { 
    setMode(v);
    setIVDisabled( v == 'ECB'); 
  } 

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v); 
    // Passphrase 和位数要求不一致
    setPassphraseStatus((v.length == (capacity / 8))? "" : "error");
  }

  return (
    <div>
      { contextHolder }

      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>模式:</label>
          <Select
            value={ mode }
            style={{ width: 120 }}
            onChange={ onModeChange }
            options={ arrayToOptions(modeList) }
          />
          <label>填充:</label>
          <Select
            value={ padding }
            style={{ width: 120 }}
            onChange={ (v :string) => { setPadding(v) } }
            options={ arrayToOptions(paddingList) }
          />
          <label>编码:</label>
          <Select
            value={ code }
            style={{ width: 120 }}
            onChange={ (v :string) => { setCode(v) } }
            options={ arrayToOptions(codeList) }
          />
          <label>偏移量(IV):</label>
          <Input 
            allowClear
            status={ ivStatus }
            maxLength={ 16 }
            style={ { width: "260px" } }
            disabled={ ivDisabled }
            onChange={ onIVChange }
            value= { iv } />
          { iv.length } / { 16 }
        </Space>
      </Row>
      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>位数:</label>
          <Select
            value={ capacity }
            style={{ width: 120 }}
            onChange={ (e:number) => { setCapacity(e) } }
            options={ arrayToOptions(capacityList) }
          />
          <label>密钥:</label>
          <Input
            allowClear
            maxLength = { 32 }
            status={ passphraseStatus }
            style={ { width: "630px"} }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length } / { capacity / 8 }
        </Space>
      </Row>
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="需要进行 AES 加密的内容"
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
        placeholder="需要进行 AES 解密的内容"
        autoSize={{ minRows: 8}}
      />
    </div>
  )
}
export default AESCrypto;