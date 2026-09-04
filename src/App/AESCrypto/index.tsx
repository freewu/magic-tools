import { Select, Divider, Button,Input, Space, message,Row, Tooltip } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import * as CryptoJS from 'crypto-js';
import { modeList, paddingList, codeList, capacityList } from "./data";
import { getDefaultIV, getDefaultCode, getDefaultMode, getDefaultPadding, getDefaultPassphrase,genCapacity } from "./lib";
import { getPadding, getMode } from "./lib";
import { aesGcmEncrypt, aesGcmDecrypt, bytesToHex, hexToBytes, bytesToBase64, base64ToBytes } from "./gcm";
import type { InputStatus } from "antd/es/_util/statusUtils";

// 偏移量长度要求: GCM 建议 12 字节 (96-bit), 其它块模式 16 字节
const ivRequiredLen = (m :string) => (m === 'GCM' ? 12 : 16);

// 字符串 -> UTF-8 字节
const utf8Bytes = (s :string) :Uint8Array => new TextEncoder().encode(s);

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
  const [ ivStatus, setIVStatus ] = useState( (() => {
    const m = getDefaultMode();
    if(m === 'ECB') return '' as InputStatus;
    return (getDefaultIV().length === ivRequiredLen(m))? '' as InputStatus : 'error' as InputStatus;
  })() ); // 偏移量提醒
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
      if(mode === 'GCM') {
        // GCM: 纯 TS 引擎, 输出 = 密文 || 16 字节认证标签
        const out = aesGcmEncrypt(utf8Bytes(passphrase), utf8Bytes(iv), utf8Bytes(encodeValue));
        return setDecodeValue((code === "Base64")? bytesToBase64(out) : bytesToHex(out));
      }
      const value = CryptoJS.AES.encrypt(
        encodeValue,
        CryptoJS.enc.Utf8.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
        {
          mode: getMode(mode),
          padding: getPadding(padding),
          iv: ('ECB' === mode)? CryptoJS.enc.Utf8.parse('') : CryptoJS.enc.Utf8.parse(iv),
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
      if(mode === 'GCM') {
        // GCM: 输入 = 密文 || 16 字节认证标签 (Base64/HEX)
        const data = (code === "Base64")? base64ToBytes(decodeValue) : hexToBytes(decodeValue);
        const plain = aesGcmDecrypt(utf8Bytes(passphrase), utf8Bytes(iv), data);
        return setEncodeValue(new TextDecoder().decode(plain));
      }
      const value = CryptoJS.AES.decrypt(
        (code === "Base64")? decodeValue : CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(decodeValue)), // 需传入 base64的值 
        CryptoJS.enc.Utf8.parse(passphrase), // passphrase, 不能直接传string 要不然会 CryptoJS 会加 salt
        {
          mode: getMode(mode),
          padding: getPadding(padding),
          iv: ('ECB' === mode)? CryptoJS.enc.Utf8.parse('') : CryptoJS.enc.Utf8.parse(iv),
        }
      );
      const result = value.toString(CryptoJS.enc.Utf8);
      if("" === result) {
        notice.error("解密失败");
      }
      return setEncodeValue(result);
    } catch (error) {
      // GCM 的认证失败等异常需要给出明确提示
      if(mode === 'GCM' && error instanceof Error) {
        notice.error(error.message);
      } else {
        console.log(error);
      }
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
    setIVStatus(v.length === ivRequiredLen(mode)? "" : "error");
  }

  // 位数切换
  const onCapacityChange = (e:number) => { 
    setCapacity(e);
    if ((e / 8) == passphrase.length) {
      setPassphraseStatus('')
    } else {
      setPassphraseStatus('error');
    }
  }
 
  // 模式切换
  const onModeChange = (v :string) => { 
    setMode(v);
    setIVDisabled( v == 'ECB'); 
    // 切换后按新模式的 IV 长度要求重新校验
    setIVStatus((v == 'ECB')? '' : ((iv.length === ivRequiredLen(v))? '' : 'error'));
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
          {
            (mode === 'GCM')
              ? (
                <Tooltip title="GCM 为认证加密模式, 无需填充; 输出 / 输入格式为 密文 + 16 字节认证标签">
                  <Select
                    value={ padding }
                    style={{ width: 120 }}
                    disabled
                    options={ arrayToOptions(paddingList) }
                  />
                </Tooltip>
              )
              : (
                <Select
                  value={ padding }
                  style={{ width: 120 }}
                  onChange={ (v :string) => { setPadding(v) } }
                  options={ arrayToOptions(paddingList) }
                />
              )
          }
          <label>偏移量(IV):</label>
          <Input 
            allowClear
            status={ ivStatus }
            maxLength={ ivRequiredLen(mode) }
            style={ { width: 320 } }
            disabled={ ivDisabled }
            onChange={ onIVChange }
            value= { iv } />
          { iv.length } / { ivRequiredLen(mode) }
          { (mode === 'GCM') && <span style={ { color: "#999", fontSize: 12 }}>输出为 密文+16字节认证标签, IV 建议 12 字节</span> }
        </Space>
      </Row>
      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>编码:</label>
          <Select
            value={ code }
            style={{ width: 120 }}
            onChange={ (v :string) => { setCode(v) } }
            options={ arrayToOptions(codeList) }
          />
          <label>位数:</label>
          <Select
            value={ capacity }
            style={{ width: 120 }}
            onChange={ onCapacityChange }
            options={ arrayToOptions(capacityList) }
          />
          <label>密钥:</label>
          <Input
            allowClear
            maxLength = { 32 }
            status={ passphraseStatus }
            style={ { width: 355 } }
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
        placeholder="输入需要进行 AES 加密的内容  或 拖拽文件到框内打开"
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
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 AES 解密的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  )
}
export default AESCrypto;