import { Select, Row, Button, Input, Space, message } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import { modeList, paddingList, codeList, capacityList, BLOCK_BYTES } from "./data";
import { blowfishEncrypt, blowfishDecrypt, blowfishKeyValid, blowfishIvValid, genCapacity } from "./lib";
import { getDefaultCode, getDefaultMode, getDefaultPadding, getDefaultIV, getDefaultPassphrase } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// 偏移量(IV) 格式: 块长个字符 (UTF-8) 或 2*块长位 HEX
const ivHint = ` ${BLOCK_BYTES} 字符或 ${BLOCK_BYTES * 2} HEX`;

// Blowfish 加解密 (Blowfish-32/12/16, 分组 64 位, 密钥 128/192/256 位; 模式/填充/编码参考 AES)
const BlowfishCrypto = () => {

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ mode, setMode ] = useState(getDefaultMode()); // 模式
  const [ padding, setPadding ] = useState(getDefaultPadding()); // 填充
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ iv, setIV ] = useState(getDefaultIV()); // 偏移量
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 密钥
  const [ capacity, setCapacity ] = useState(genCapacity(getDefaultPassphrase().length)); // 密钥位数
  const [ ivDisabled, setIVDisabled ] = useState(getDefaultMode() === 'ECB'); // ECB 模式下不需要 iv
  const [ ivStatus, setIVStatus ] = useState(blowfishIvValid(getDefaultIV()) ? '' : 'error' as InputStatus);
  const [ passphraseStatus, setPassphraseStatus ] = useState((blowfishKeyValid(getDefaultPassphrase(), genCapacity(getDefaultPassphrase().length))) ? '' : 'error' as InputStatus);

  const isCanDo = (value :string) :boolean => {
    // 需要加密/解密的内容为空
    if(value.trim() === "") return false;
    // 密钥不符合
    if('' !== passphraseStatus) return false;
    // 非 ECB 下偏移量不符合
    if('' !== ivStatus && !ivDisabled) return false;
    return true;
  }

  // 加密处理 (明文 -> 密文)
  const encode = () => {
    if(!isCanDo(encodeValue)) return;
    try {
      setDecodeValue(blowfishEncrypt(encodeValue, passphrase, {
        mode: mode as 'CBC' | 'CFB' | 'CTR' | 'OFB' | 'ECB',
        padding: padding as 'Pkcs7' | 'AnsiX923' | 'Iso10126' | 'Iso97971' | 'ZeroPadding',
        code: code as 'HEX' | 'Base64',
        capacity,
        iv: ivDisabled ? undefined : iv,
      }));
    } catch (error) {
      notice.error((error as Error).message);
    }
  };

  // 解密处理 (密文 -> 明文)
  const decode = () => {
    if(!isCanDo(decodeValue)) return;
    try {
      setEncodeValue(blowfishDecrypt(decodeValue, passphrase, {
        mode: mode as 'CBC' | 'CFB' | 'CTR' | 'OFB' | 'ECB',
        padding: padding as 'Pkcs7' | 'AnsiX923' | 'Iso10126' | 'Iso97971' | 'ZeroPadding',
        code: code as 'HEX' | 'Base64',
        capacity,
        iv: ivDisabled ? undefined : iv,
      }));
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
    setIVStatus(blowfishIvValid(v) ? '' : 'error');
  }

  // 位数切换 (128/192/256)
  const onCapacityChange = (n :number) => {
    setCapacity(n);
    setPassphraseStatus(blowfishKeyValid(passphrase, n) ? '' : 'error');
  }

  // 模式切换
  const onModeChange = (v :string) => {
    setMode(v);
    setIVDisabled(v === 'ECB');
    setIVStatus((v === 'ECB' || blowfishIvValid(iv)) ? '' : 'error');
  }

  // 密钥 Passphrase 输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    setPassphraseStatus(blowfishKeyValid(v, capacity) ? '' : 'error');
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
            maxLength={ BLOCK_BYTES * 2 }
            style={ { width: 280 } }
            disabled={ ivDisabled }
            onChange={ onIVChange }
            value= { iv } />
          { !ivDisabled && <span>{ iv.length } / { ivHint }</span> }
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
            maxLength={ capacity / 8 }
            status={ passphraseStatus }
            style={ { width: 300 } }
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
        placeholder="输入需要进行 Blowfish 加密的内容  或 拖拽文件到框内打开"
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
        placeholder="输入需要进行 Blowfish 解密的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  )
}
export default BlowfishCrypto;