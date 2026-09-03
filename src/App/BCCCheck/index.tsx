import { Form, Input, Divider, message, Space, Button, Segmented, Typography } from "antd";
import { useState } from "react";
const { TextArea } = Input;
const { Text } = Typography;
import { ClearOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { default as BCCIntro } from "./intro"
import { parseInput, bccXor, parseExpected, byteToHex, byteToDec, byteToOct, byteToBin, getDefaultInputMode } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import "./../../lib/check.css"

type InputMode = 'hex' | 'ascii';

const BCCCheck = () => {

  const [ mode, setMode ] = useState<InputMode>(getDefaultInputMode());
  const [ hexInput, setHexInput ] = useState('');
  const [ expectedInput, setExpectedInput ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  // 实时解析并计算
  let error = '';
  let bytes :number[] = [];
  try {
    bytes = parseInput(hexInput, mode);
  } catch (err) {
    error = (err as Error).message;
  }
  const result = {
    hex: '', dec: '', oct: '', bin: '', raw: 0, byteCount: 0,
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

  // 点击复制输入框内容 (参考 Hash 值计算交互)
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if (txt !== '') {
      copyTextToClipboard(txt);
      notice.success("已复制: " + txt);
    }
  };

  const clear = () => {
    setHexInput('');
    setExpectedInput('');
  }

  // 输出行: 四种进制 + 数据长度 (展示参考 Hash 值计算)
  const resultRows = [
    { label: 'HEX', value: result.hex, title: '十六进制' },
    { label: 'DEC', value: result.dec, title: '十进制' },
    { label: 'OCT', value: result.oct, title: '八进制' },
    { label: 'BIN', value: result.bin, title: '二进制' },
    { label: '数据长度', value: result.hex !== '' ? result.byteCount + ' 字节' : '', title: '参与计算的字节数' },
  ];

  return (
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } }>
      {contextHolder}

      <Space size={ [0, 8] } wrap style={ { margin: '5px 0' } }>
        <span>输入格式:</span>
        <Segmented
          value={ mode }
          onChange={ (v) => { setMode(v as InputMode); } }
          options={ [
            { label: 'HEX', value: 'hex', title: '十六进制字节 (支持 空格/逗号/0x 等分隔)' },
            { label: 'ASCII / 文本', value: 'ascii', title: '文本按 UTF-8 编码为字节' },
          ] }
        />
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        status={ (error !== '' ? 'error' : '') as InputStatus }
        onChange={ (e) => { setHexInput(e.target.value); } }
        value= { hexInput }
        placeholder={ mode === 'hex'
          ? '输入需要计算 BCC 校验值的十六进制数据 (如: 01 03 00 00 00 02) 或 拖拽文件到框内打开'
          : '输入文本 (按 UTF-8 编码为字节参与计算, 如: ABC -> XOR = 0x40) 或 拖拽文件到框内打开' }
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Space size={ [8, 8] } wrap style={ { margin: '4px 0' } }>
        <Button
          danger
          icon={ <ClearOutlined /> }
          disabled={ hexInput === '' && expectedInput === '' }
          onClick={ clear }
        >清除</Button>
      </Space>

      { result.hex !== '' && error === '' && (
        <Space size={ [8, 8] } wrap style={ { margin: '4px 0' } }>
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
        </Space>
      ) }

      <Divider dashed style={ { margin: '8px 0' } } />

      <div style={ { flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 12 } }>
        { error !== '' && (
          <div style={ { margin: '0 0 8px 0', color: '#ff4d4f' } }>
            <Text type="danger" strong>{ error }</Text>
          </div>
        ) }
        <Form name="bcc" labelCol={ { span: 3 } } autoComplete="off" >
          {
            resultRows.map((row) => (
              <Form.Item key={ row.label } label={ row.label }>
                <Input
                  readOnly
                  title={ row.value !== '' ? `点击复制 ${row.label} 值` : '' }
                  onClick={ inputClick }
                  value= { row.value }
                  placeholder={ row.value === '' ? '—' : '' }
                />
              </Form.Item>
            ))
          }
        </Form>
        <Divider dashed style={ { margin: '8px 0' } } />
        <BCCIntro />
      </div>
    </div>
  );
}

export default BCCCheck;