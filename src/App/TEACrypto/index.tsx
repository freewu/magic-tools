import { Select, Button, Input, Space, message, Row } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import { codeList } from "./data";
import { getDefaultCode, getDefaultPassphrase, getDefaultRound, teaEncrypt, teaDecrypt } from "./lib";
import { utf8ToBytes, bytesToUtf8, bytesToHex, hexToBytes, bytesToBase64, base64ToBytes } from "../../lib/codec";
import type { InputStatus } from "antd/es/_util/statusUtils";

const TEACrypto = () => {

  const genDefaultPassphraseStatus = () :InputStatus => {
    const p = getDefaultPassphrase();
    return (16 === p.length)? '' : 'error';
  }

  const genDefaultRoundStatus = () :InputStatus => {
    const r = getDefaultRound();
    return (/^[1-9]\d{0,2}$/.test(r))? '' : 'error';
  }

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ round, setRound ] = useState(getDefaultRound()); // 循环次数
  const [ passphrase, setPassphrase] = useState(getDefaultPassphrase()); // 密钥 (16 字节 = 128 位)
  const [ passphraseStatus, setPassphraseStatus ] = useState(genDefaultPassphraseStatus()); // 密钥提醒
  const [ roundStatus, setRoundStatus ] = useState(genDefaultRoundStatus()); // 循环次数提醒

  const isCanDo = (value :string) :boolean => {
    // 需要处理的内容为空
    if(value.trim() === "") return false;
    // 密钥长度不符合 (必须 16 位)
    if('' !== passphraseStatus) return false;
    // 循环次数不符合 (必须 1 ~ 999)
    if('' !== roundStatus) return false;
    return true;
  }

  // 加密处理
  const encode = () => {
    if(!isCanDo(encodeValue)) return ;
    try {
      const cipher = teaEncrypt(utf8ToBytes(encodeValue), utf8ToBytes(passphrase), parseInt(round));
      switch(code) {
        case "Base64": return setDecodeValue(bytesToBase64(cipher));
        case "HEX": return setDecodeValue(bytesToHex(cipher));
        default: return setDecodeValue(bytesToBase64(cipher));
      }
    } catch (error) {
      console.log(error);
      notice.error("加密失败");
    }
  };

  // 解密处理
  const decode = () => {
    if(!isCanDo(decodeValue)) return ;
    try {
      // 根据编码解析密文
      const cipher = (code === "HEX")? hexToBytes(decodeValue) : base64ToBytes(decodeValue);
      // 解密处理
      const result = bytesToUtf8(teaDecrypt(cipher, utf8ToBytes(passphrase), parseInt(round)));
      return setEncodeValue(result);
    } catch (error) {
      console.log(error);
      notice.error("解密失败");
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

  // 密钥 Passphrase 输入处理 (必须 16 位)
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    if(v.length === 16) {
      setPassphraseStatus("");
    } else {
      setPassphraseStatus("error");
    }
  }

  // 循环次数输入处理 (1 ~ 999)
  const onRoundChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, '');
    setRound(v);
    if(/^[1-9]\d{0,2}$/.test(v)) {
      setRoundStatus("");
    } else {
      setRoundStatus("error");
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
          <label>循环次数:</label>
          <Input
            allowClear
            status={ roundStatus }
            maxLength = { 3 }
            style={ { width: 100 } }
            onChange={ onRoundChange }
            value= { round } />
          <label>密钥:</label>
          <Input
            showCount
            allowClear
            status={ passphraseStatus }
            maxLength = { 16 }
            style={ { width: 230 } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
        </Space>
      </Row>

      <TextArea
        showCount
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="输入需要进行 TEA 加密的内容 或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button
        onClick={ encode }
        style={ { "backgroundColor" : "#007bff","color": "#fff" } }
        icon={<ArrowDownOutlined />}
      >加密</Button>
      <Button
        onClick={ decode }
        style={ { "backgroundColor" : "#28a745","color": "#fff" } }
        icon={<ArrowUpOutlined />}
      >解密</Button>
      <Button
        onClick={ () =>clear() }
        style={ { "backgroundColor" : "#dc3545","color": "#fff" } }
      >清除</Button>

      <TextArea
        showCount
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 TEA 解密的内容 或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  )
}
export default TEACrypto;