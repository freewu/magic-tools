import { Select, Row, Button, Input, Space, message, InputNumber } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { useLocale } from "../../hook/locale-context";
import { cr, crT, crErr } from "../crypto-lang";
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { arrayToOptions } from "../../lib/array"
import { codeList, COUNTER_MAX } from "./data";
import { chacha20EncryptText, chacha20DecryptText, nonceValid, counterValid, getDefaultCode, getDefaultPassphrase, getDefaultNonce, getDefaultCounter } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

// nonce 提示: 24 位 HEX 或 12 个字符 (UTF-8)

// ChaCha20 加解密 (RFC 7539, 256 位密钥 + 96 位 nonce + 32 位计数器; 无模式/填充, 流式)
const ChaCha20Crypto = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => crT(locale, zh, v);

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容
  const [ code, setCode ] = useState(getDefaultCode()); // 编码
  const [ nonce, setNonce ] = useState(getDefaultNonce()); // nonce
  const [ counter, setCounter ] = useState(getDefaultCounter()); // counter 初始值
  const [ passphrase, setPassphrase ] = useState(getDefaultPassphrase()); // 密钥口令
  const [ nonceStatus, setNonceStatus ] = useState(nonceValid(getDefaultNonce()) ? '' : 'error' as InputStatus);
  const [ passphraseStatus, setPassphraseStatus ] = useState(getDefaultPassphrase().trim() !== '' ? '' : 'error' as InputStatus);
  const [ counterStatus, setCounterStatus ] = useState('' as InputStatus);

  // 加密处理 (明文 -> 密文)
  const encode = () => {
    if(encodeValue.trim() === '') return;
    if(passphrase.trim() === '') { notice.warning(t('密钥口令不能为空')); return; }
    if('' !== nonceStatus) { notice.warning(t('nonce 格式不正确')); return; }
    if('' !== counterStatus) { notice.warning(t('计数器需为 0~2^32-1 的整数')); return; }
    try {
      setDecodeValue(chacha20EncryptText(encodeValue, passphrase, nonce, counter, {
        code: code as 'HEX' | 'Base64',
      }));
    } catch (error) {
      notice.error(crErr(locale, (error as Error).message));
    }
  };

  // 解密处理 (密文 -> 明文)
  const decode = () => {
    if(decodeValue.trim() === '') return;
    if(passphrase.trim() === '') { notice.warning(t('密钥口令不能为空')); return; }
    if('' !== nonceStatus) { notice.warning(t('nonce 格式不正确')); return; }
    if('' !== counterStatus) { notice.warning(t('计数器需为 0~2^32-1 的整数')); return; }
    try {
      setEncodeValue(chacha20DecryptText(decodeValue, passphrase, nonce, counter, {
        code: code as 'HEX' | 'Base64',
      }));
    } catch (error) {
      notice.error(crErr(locale, (error as Error).message));
    }
  };

  // 清除内容
  const clear = () => {
    setEncodeValue('');
    setDecodeValue('');
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    notice.success(t('复制到粘贴板成功！！！'));
  };

  // nonce 输入处理
  const onNonceChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setNonce(v);
    setNonceStatus(nonceValid(v) ? '' : 'error');
  };

  // 密钥口令输入处理
  const onPassphraseChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setPassphrase(v);
    setPassphraseStatus(v !== '' ? '' : 'error');
  };

  // 计数器输入
  const onCounterChange = (v :number | null) => {
    const n = v ?? 0;
    setCounter(n);
    setCounterStatus(counterValid(String(n)) ? '' : 'error');
  };

  return (
    <div>
      { contextHolder }

      <Row style = { { marginTop: "5px" }}>
        <Space>
          {t('编码:')}
          <Select
            value={ code }
            style={{ width: 120 }}
            onChange={ (v :string) => { setCode(v as 'HEX' | 'Base64') } }
            options={ arrayToOptions(codeList) }
          />
          {t('密钥口令:')}
          <Input
            allowClear
            status={ passphraseStatus }
            style={ { width: 300 } }
            onChange={ onPassphraseChange }
            value= { passphrase } />
          <span style={{ color: '#999' }}>{t('口令经 SHA-256 派生为 32 字节密钥 (恰 32 字符时直接使用)')}</span>
        </Space>
      </Row>
      <Row style = { { marginTop: "5px" }}>
        <Space>
          <label>Nonce:</label>
          <Input
            allowClear
            status={ nonceStatus }
            maxLength={ 24 }
            style={ { width: 300 } }
            onChange={ onNonceChange }
            value= { nonce } />
          <span>{ nonce.length } / {t(' 24 HEX 或 12 字符')}</span>
          {t('计数器(初始值):')}
          <InputNumber
            min={ 0 }
            max={ COUNTER_MAX }
            step={ 1 }
            precision={ 0 }
            style={ { width: 140 } }
            onChange={ onCounterChange }
            value= { counter } />
        </Space>
      </Row>
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) } }
        title={t('双击复制内容到粘贴板')}
        value= { encodeValue }
        placeholder={t('输入需要进行 ChaCha20 加密的内容  或 拖拽文件到框内打开')}
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button
        onClick={ encode }
        style={ { "backgroundColor" : "#007bff","color": "#fff" } }
        icon={<ArrowDownOutlined />}
      >{t('加密')}</Button>
      <Button
        onClick={ decode }
        style={ { "backgroundColor" : "#28a745","color": "#fff" } }
        icon={<ArrowUpOutlined />}
      >{t('解密')}</Button>
      <Button
        onClick={ () => clear() }
        style={ { "backgroundColor" : "#dc3545","color": "#fff" } }
      >{t('清除')}</Button>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) } }
        title={t('双击复制内容到粘贴板')}
        value= { decodeValue }
        placeholder={t('输入需要进行 ChaCha20 解密的内容  或 拖拽文件到框内打开')}
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
    </div>
  );
}

export default ChaCha20Crypto;
