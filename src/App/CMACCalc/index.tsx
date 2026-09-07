import { Divider, Input, Radio, Select, Space, Button, InputNumber, Checkbox, message, Row } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { bitLenList } from "./data"
import { cmac, cmacText, hexToBytes, utf8Bytes, getDefaultBits } from "./lib"
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { RadioChangeEvent } from 'antd/es/radio';

const CMACCalc = () => {

  const [ msg, setMsg ] = useState('');            // 消息内容
  const [ key, setKey ] = useState('');            // 密钥
  const [ bits, setBits ] = useState<128 | 192 | 256>(getDefaultBits()); // 密钥位数
  const [ fmt, setFmt ] = useState<'utf8' | 'hex'>('utf8'); // 输入格式
  const [ upper, setUpper ] = useState(false);
  const [ result, setResult ] = useState('');
  const [ notice, contextHolder] = message.useMessage();

  const keyLenBytes = bits === 128 ? 16 : bits === 192 ? 24 : 32;

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLTextAreaElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const formatResult = (hex :string) => upper ? hex.toUpperCase() : hex;

  // 手动计算 (按钮点击时展示错误提示)
  const doCalc = () => {
    if (key.trim() === '') { notice.warning('密钥不能为空'); return; }
    if (msg.trim() === '') { notice.warning('消息内容不能为空'); return; }
    calc(true);
  };

  const calc = (showError = false) => {
    try {
      let keyBytes :Uint8Array;
      if (fmt === 'hex') {
        keyBytes = hexToBytes(key);
        if (keyBytes.length !== keyLenBytes) {
          throw new Error(`HEX 密钥应为 ${keyLenBytes * 2} 个十六进制字符 (${keyLenBytes} 字节)`);
        }
      } else {
        keyBytes = utf8Bytes(key);
        if (keyBytes.length !== keyLenBytes) {
          throw new Error(`密钥需为 ${keyLenBytes} 个字符/字节 (当前 ${keyBytes.length} 字节, 中文等多字节字符按 UTF-8 计算)`);
        }
      }
      const msgBytes = fmt === 'hex' ? hexToBytes(msg) : utf8Bytes(msg);
      const tag = cmac(keyBytes, msgBytes);
      setResult(formatResult(tag));
    } catch (err) {
      setResult('');
      if (showError) {
        const msgErr = err instanceof Error ? err.message : String(err);
        notice.error('计算失败: ' + msgErr);
      }
    }
  };

  const onMsgChange = (v :string) => {
    setMsg(v);
    if (result !== '') { try { calc(false); } catch { setResult(''); } }
  };
  const onKeyChange = (v :string) => {
    setKey(v);
    if (result !== '') { try { calc(false); } catch { setResult(''); } }
  };

  const onFormatChange = (e :RadioChangeEvent) => {
    setFmt(e.target.value);
    if (result !== '') { try { calc(false); } catch { setResult(''); } }
  };
  const onUpperChange = (e :CheckboxChangeEvent) => {
    setUpper(e.target.checked);
    if (result !== '') { try { setResult(formatResult(result)); } catch { /* noop */ } }
  };

  return (
    <div>
      {contextHolder}

      <Row><Space><label>输入格式:</label>
        <Radio.Group
          value={ fmt }
          onChange={ onFormatChange }
          options={ [
            { label: 'UTF-8 文本', value: 'utf8' },
            { label: 'HEX (十六进制)', value: 'hex' },
          ] }
          optionType="button"
        />
      </Space></Row>

      <div style={{ marginTop: 8 }}><b>消息 (M):</b></div>
      <TextArea
        style={{ margin: "5px 0 5px 0" }}
        value={ msg }
        onChange={ (e) => { onMsgChange(e.target.value); } }
        placeholder={ fmt === 'hex' ? '消息的十六进制, 如 6bc1bee22e409f96e93d7e117393172a' : '需要计算 CMAC 的消息内容, 可为空(空消息也合法)' }
        autoSize={{ minRows: 4, maxRows: 8 }}
      />

      <Row style={{ marginTop: 5 }}><Space>
        <label>密钥位数:</label>
        <Select
          value={ bits }
          style={{ width: 120 }}
          onChange={ (v :number) => { setBits(v as 128 | 192 | 256); if (result !== '') { try { calc(); } catch { setResult(''); } } } }
          options={ bitLenList.map((b) => ({ label: `AES-${b}`, value: b })) }
        />
      </Space></Row>

      <div style={{ marginTop: 8 }}><b>密钥 (K):</b></div>
      <TextArea
        style={{ margin: "5px 0 5px 0" }}
        value={ key }
        onChange={ (e) => { onKeyChange(e.target.value); } }
        placeholder={ fmt === 'hex'
          ? `密钥的十六进制 (${keyLenBytes * 2} 个字符), 如 2b7e151628aed2a6abf7158809cf4f3c`
          : `密钥 ${keyLenBytes} 字节 (ASCII 即 ${keyLenBytes} 个字符)` }
        autoSize={{ minRows: 2, maxRows: 4 }}
      />

      <Row style={{ marginTop: 5 }}><Space>
        <Button
          style={{ backgroundColor: "#007bff", color: "#fff" }}
          onClick={ doCalc }
        >计算 CMAC</Button>
        <Checkbox onChange={ onUpperChange } checked={ upper }>大写显示</Checkbox>
        <Button
          onClick={ () => { setMsg(''); setKey(''); setResult(''); } }
          style={{ backgroundColor: "#dc3545", color: "#fff" }}
        >清除</Button>
      </Space></Row>

      <Divider dashed />

      <TextArea
        showCount
        readOnly
        onDoubleClick={ inputClick }
        title="双击复制结果到粘贴板"
        style={{ margin: "5px 0 5px 0" }}
        value={ result }
        placeholder="CMAC 标签 (16 字节 / 32 个十六进制字符)"
        autoSize={{ minRows: 6, maxRows: 12 }}
      />
    </div>
  );
}

export default CMACCalc;
