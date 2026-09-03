import { Divider, Button, Input, message, Typography } from "antd";
import { useState } from "react";
const { TextArea } = Input;
const { Text } = Typography;
import { CopyOutlined, ClearOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { default as BCCIntro } from "./intro"
import { parseHexBytes, bccHex, bccXor, parseExpected } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const BCCCheck = () => {

  const [ hexInput, setHexInput ] = useState('');
  const [ expectedInput, setExpectedInput ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  // 实时解析并计算
  let error = '';
  let hex = '';
  let dec = 0;
  let bin = '';
  let byteCount = 0;
  let bytes :number[] = [];
  try {
    bytes = parseHexBytes(hexInput);
  } catch (err) {
    error = (err as Error).message;
  }
  const hasData = hexInput.trim() !== '';
  if (error === '' && bytes.length > 0) {
    hex = bccHex(bytes);
    dec = bccXor(bytes);
    bin = dec.toString(2).padStart(8, '0');
    byteCount = bytes.length;
  }

  // 期望值对比
  let compare :boolean | string = '';
  if (hex !== '' && expectedInput.trim() !== '') {
    const exp = parseExpected(expectedInput);
    if (exp === -1) compare = '格式错误';
    else if (exp === -2) compare = '';
    else compare = exp === dec;
  }

  const copyResult = () => {
    if (hex === '') return;
    copyTextToClipboard(hex);
    notice.success("已复制 BCC 校验值: " + hex);
  }

  const clear = () => {
    setHexInput('');
    setExpectedInput('');
  }

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        status={ (error !== '' ? 'error' : '') as InputStatus }
        onChange={ (e) => { setHexInput(e.target.value); } }
        value= { hexInput }
        placeholder="输入十六进制数据 (字节), 支持空格 / 逗号 / 0x 前缀等分隔, 例如: 01 03 00 00 00 02  或  0x01,0x02,0x03"
        autoSize={{ minRows: 4, maxRows: 4 }}
      />

      <div style={ { display: "flex", gap: 8, margin: "4px 0" } }>
        <Button
          type="primary"
          icon={ <CopyOutlined /> }
          disabled={ hex === '' }
          onClick={ copyResult }
        >复制 BCC 结果</Button>
        <Button
          danger
          icon={ <ClearOutlined /> }
          disabled={ hexInput === '' && expectedInput === '' }
          onClick={ clear }
        >清除</Button>
      </div>

      { (error !== '' || hex !== '') && (
        <div
          style={ {
            margin: "8px 0",
            padding: "12px 16px",
            border: "1px solid " + (error !== '' ? "#ff4d4f" : "#d9d9d9"),
            borderRadius: 6,
            background: error !== '' ? "#fff2f0" : "#f6ffed",
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 24px",
            alignItems: "center",
          } }>
          { error !== '' && (
            <Text type="danger" strong> { error } </Text>
          ) }
          { error === '' && hex !== '' && (
            <>
              <span>
                BCC 校验值 (HEX):&nbsp;
                <Text code strong style={ { fontSize: 20 } }>{ hex }</Text>
              </span>
              <span>DEC: <Text code>{ dec }</Text></span>
              <span>BIN: <Text code>{ bin }</Text></span>
              <span>数据长度: <Text code>{ byteCount } 字节</Text></span>
            </>
          ) }
        </div>
      ) }

      { hex !== '' && (
        <div style={ { display: "flex", alignItems: "center", gap: 12, margin: "8px 0" } }>
          <span>期望 BCC:</span>
          <Input
            style={ { width: 120 } }
            placeholder="如 00 / 0x5A"
            value={ expectedInput }
            onChange={ (e) => { setExpectedInput(e.target.value); } }
          />
          { compare === true && <Text type="success" strong> ✓ 校验通过 </Text> }
          { compare === false && <Text type="danger" strong> ✗ 校验不通过 (期望 { expectedInput.trim().replace(/^0x/i, '').padStart(2, '0').toUpperCase() }) </Text> }
          { compare === '格式错误' && <Text type="warning"> 期望值格式错误 (需 1-2 位十六进制) </Text> }
          { compare === '' && expectedInput.trim() === '' && <Text type="secondary"> 填入期望值后自动比对 </Text> }
        </div>
      ) }

      <Divider> BCC 校验说明 </Divider>

      <BCCIntro />
    </div>
  );
}

export default BCCCheck;