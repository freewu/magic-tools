import { Divider, Button, Input, Segmented, message, Typography } from "antd";
import { useState } from "react";
const { TextArea } = Input;
const { Text } = Typography;
import { CopyOutlined, ClearOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { default as BCCIntro } from "./intro"
import { parseInput, bccHex, bccXor, parseExpected, byteToHex, byteToDec, byteToOct, byteToBin } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

type InputMode = 'hex' | 'ascii';

const BCCCheck = () => {

  const [ mode, setMode ] = useState<InputMode>('hex');
  const [ hexInput, setHexInput ] = useState('');
  const [ expectedInput, setExpectedInput ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  // 实时解析并计算
  let error = '';
  let bytes :number[] = [];
  try {
    bytes = parseInput(hexInput, mode);
  } catch (err) {
    error = (err as Error).message;
  }
  const hasData = hexInput.trim() !== '';
  const result = {
    hex: '',
    dec: '',
    oct: '',
    bin: '',
    raw: 0,
    byteCount: 0,
  };
  if (error === '' && bytes.length > 0) {
    result.raw = bccXor(bytes);
    result.hex = byteToHex(result.raw);
    result.dec = byteToDec(result.raw);
    result.oct = byteToOct(result.raw);
    result.bin = byteToBin(result.raw);
    result.byteCount = bytes.length;
  }

  // 期望值对比 (期望值按十六进制填写)
  let compare :boolean | string = '';
  if (result.hex !== '' && expectedInput.trim() !== '') {
    const exp = parseExpected(expectedInput);
    if (exp === -1) compare = '格式错误';
    else if (exp === -2) compare = '';
    else compare = exp === result.raw;
  }

  const copyField = (value :string, label :string) => {
    if (value === '') return;
    copyTextToClipboard(value);
    notice.success(`已复制 ${label}: ${value}`);
  }

  const copyResult = () => copyField(result.hex, 'BCC 校验值');

  const clear = () => {
    setHexInput('');
    setExpectedInput('');
  }

  // 四种进制显示字段
  const radixFields = [
    { label: 'HEX', value: result.hex, title: '十六进制' },
    { label: 'DEC', value: result.dec, title: '十进制' },
    { label: 'OCT', value: result.oct, title: '八进制' },
    { label: 'BIN', value: result.bin, title: '二进制' },
  ];

  return (
    <div>
      {contextHolder}

      <div style={ { display: "flex", alignItems: "center", gap: 10, margin: "5px 0" } }>
        <span>输入格式:</span>
        <Segmented
          value={ mode }
          onChange={ (v) => { setMode(v as InputMode); } }
          options={ [
            { label: 'HEX', value: 'hex', title: '十六进制字节 (支持 空格/逗号/0x 等分隔)' },
            { label: 'ASCII / 文本', value: 'ascii', title: '文本按 UTF-8 编码为字节' },
          ] }
        />
      </div>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        status={ (error !== '' ? 'error' : '') as InputStatus }
        onChange={ (e) => { setHexInput(e.target.value); } }
        value= { hexInput }
        placeholder={ mode === 'hex'
          ? '输入十六进制数据 (字节), 支持空格 / 逗号 / 0x 前缀等分隔, 例如: 01 03 00 00 00 02  或  0x01,0x02,0x03'
          : '输入文本, 按 UTF-8 编码为字节参与异或计算, 例如: ABC   (0x41 ^ 0x42 ^ 0x43 = 0x40)' }
        autoSize={{ minRows: 4, maxRows: 4 }}
      />

      <div style={ { display: "flex", gap: 8, margin: "4px 0" } }>
        <Button
          type="primary"
          icon={ <CopyOutlined /> }
          disabled={ result.hex === '' }
          onClick={ copyResult }
        >复制 BCC 结果</Button>
        <Button
          danger
          icon={ <ClearOutlined /> }
          disabled={ hexInput === '' && expectedInput === '' }
          onClick={ clear }
        >清除</Button>
      </div>

      { (error !== '' || result.hex !== '') && (
        <div
          style={ {
            margin: "8px 0",
            padding: "12px 16px",
            border: "1px solid " + (error !== '' ? "#ff4d4f" : "#d9d9d9"),
            borderRadius: 6,
            background: error !== '' ? "#fff2f0" : "#f6ffed",
          } }>
          { error !== '' && (
            <Text type="danger" strong> { error } </Text>
          ) }
          { error === '' && result.hex !== '' && (
            <>
              <div style={ { marginBottom: 8, color: "#888" } }>
                数据长度: { result.byteCount } 字节
              </div>
              <div style={ { display: "flex", flexWrap: "wrap", gap: "4px 28px", alignItems: "center" } }>
                { radixFields.map((f) => (
                  <span
                    key={ f.label }
                    title={ `双击复制 ${f.label} (${f.title}) 值` }
                    onDoubleClick={ () => { copyField(f.value, f.label + ' 值'); } }
                    style={ { cursor: "copy" } }>
                    { f.label }:&nbsp;
                    <Text code strong style={ { fontSize: f.label === 'HEX' ? 22 : 16 } }>{ f.value }</Text>
                  </span>
                )) }
              </div>
            </>
          ) }
        </div>
      ) }

      { result.hex !== '' && (
        <div style={ { display: "flex", alignItems: "center", gap: 12, margin: "8px 0" } }>
          <span>期望 BCC:</span>
          <Input
            style={ { width: 130 } }
            placeholder="如 00 / 0x5A (十六进制)"
            value={ expectedInput }
            onChange={ (e) => { setExpectedInput(e.target.value); } }
          />
          { compare === true && <Text type="success" strong> ✓ 校验通过 </Text> }
          { compare === false && <Text type="danger" strong> ✗ 校验不通过 (期望 { expectedInput.trim().replace(/^0x/i, '').padStart(2, '0').toUpperCase() }) </Text> }
          { compare === '格式错误' && <Text type="warning"> 期望值格式错误 (需 1-2 位十六进制) </Text> }
          { compare === '' && expectedInput.trim() === '' && <Text type="secondary"> 填入期望值 (十六进制) 后自动比对 </Text> }
        </div>
      ) }

      <Divider> BCC 校验说明 </Divider>

      <BCCIntro />
    </div>
  );
}

export default BCCCheck;