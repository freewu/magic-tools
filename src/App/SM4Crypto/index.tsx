import { Select, Row, Button, Input, Space, message } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import { modeList, paddingList, codeList } from "./data";
import { getDefaultCode, getDefaultMode, getDefaultPadding, getDefaultIV, getDefaultPassphrase } from "./lib";
import { sm4Encrypt, sm4Decrypt, sm4KeyValid, sm4IvValid } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// SM4 加解密 (国密 SM4, 密钥/分组固定 128 位, 与 sm-crypto 兼容)
const SM4Crypto = () => {

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ mode, setMode ] = useState(getDefaultMode()); // 模式
  const [ padding, setPadding ] = useState(getDefaultPadding()); // 填充
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 偏移量
  const [ passphrase, setPassphrase] = useState(getDefaultPassphrase()); // 密钥
  const [ ivDisabled, setIVDisabled ] = useState(getDefaultMode() === 'ECB'); // ECB 模式下不需要 iv
  const [ ivStatus, setIVStatus ] = useState((getDefaultIV().length === 0 || getDefaultIV().length === 16 || /^[0-9a-fA-F]{32}$/.test(getDefaultIV())) ? '' : 'error' as InputStatus);
  const [ passphraseStatus, setPassphraseStatus ] = useState((sm4KeyValid(getDefaultPassphrase())) ? '' : 'error' as InputStatus); // 密钥提醒

  const isCanDo = (value :string) :boolean => {
    // 需要加密/解密的内容为空
    if(value.trim() === "") return false;
    // 密钥不符合
    if('' !== passphraseStatus) return false;
    // CBC 下偏移量不符合
    if('' !== ivStatus && !ivDisabled) return false;

    return true;
  }

  // 加密处理 (明文 -> 密文)
  const encode = () => {
    if(!isCanDo(encodeValue)) return;
    try {
      setDecodeValue(sm4Encrypt(encodeValue, passphrase, { mode: mode as 'ECB' | 'CBC', padding: padding as 'Pkcs7' | 'ZeroPadding', code: code as 'HEX' | 'Base64', iv: ivDisabled ? undefined : iv }));
    } catch (error) {
      notice.error((error as Error).message);
    }
  };

  // 解密处理 (密文 -> 明文)
  const decode = () => {
    if(!isCanDo(decodeValue)) return;
    try {
      setEncodeValue(sm4Decrypt(decodeValue, passphrase, { mode: mode as 'ECB' | 'CBC', padding: padding as 'Pkcs7' | 'ZeroPadding', code: code as 'HEX' | 'Base64', iv: ivDisabled ? undefined : iv }));
    } catch (error) {
      notice.error((error as Error).message);
    }
  };

  // 清除内容
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
    if(sm4IvValid(v)) {
      setIVStatus('');
    } else {
      setIVStatus('error');
    }
  }

  // 模式切换
  const onModeChange = (v :string) => {
    setMode(v);
    setIVDisabled(v === 'ECB');
  }

  // 密钥输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    setPassphraseStatus(sm4KeyValid(v) ? '' : 'error');
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
          <label>偏移量(IV):</label>
          <Input
            allowClear
            status={ ivStatus }
            maxLength={ 32 }
            style={ { width: 260 } }
            disabled={ ivDisabled }
            onChange={ onIVChange }
            value= { iv } />
          { !ivDisabled && (iv.length + " / 16") }
          { ivDisabled && <span style={{ color: '#999' }}>ECB 模式无需 IV</span> }
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
          <label>密钥 (128 位):</label>
          <Input
            allowClear
            maxLength = { 32 }
            status={ passphraseStatus }
            style={ { width: 330 } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          { passphrase.length + " / 16 字符或 32 位HEX" }
        </Space>
      </Row>
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="输入需要进行 SM4 加密的内容  或 拖拽文件到框内打开"
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
        onClick={ () => clear() }
        style={ { "backgroundColor" : "#dc3545","color": "#fff" } }
      >清除</Button>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 SM4 解密的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  )
}
export default SM4Crypto;