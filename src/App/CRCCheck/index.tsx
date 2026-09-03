import { Form, Input, Divider, message, Space, Button, Segmented, Select, Typography } from "antd";
import { useState } from "react";
const { TextArea } = Input;
const { Text } = Typography;
import { ClearOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { default as CRCIntro } from "./intro"
import { parseInput } from "../../lib/byte"
import { CRC_ALGOS, findAlgo, computeCrc, formatCrc, algoSummary } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import "./../../lib/check.css"

type InputMode = 'hex' | 'ascii';

const CRCCheck = () => {

  const [ mode, setMode ] = useState<InputMode>('hex');
  const [ algoName, setAlgoName ] = useState('CRC-16/MODBUS');
  const [ hexInput, setHexInput ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const param = findAlgo(algoName);

  // 实时解析并计算
  let error = '';
  let bytes :number[] = [];
  const raw = hexInput.trim() === '' ? null : (() => {
    try {
      bytes = parseInput(hexInput, mode);
      return computeCrc(bytes, param);
    } catch (err) {
      error = (err as Error).message;
      return null;
    }
  })();

  const fmt = raw === null ? null : formatCrc(raw, param.width);

  const resultRows = [
    { label: 'HEX', value: fmt?.hex ?? '', title: '十六进制' },
    { label: 'DEC', value: fmt?.dec ?? '', title: '十进制' },
    { label: 'OCT', value: fmt?.oct ?? '', title: '八进制' },
    { label: 'BIN', value: fmt?.bin ?? '', title: '二进制' },
    { label: '数据长度', value: bytes.length > 0 ? bytes.length + ' 字节' : '', title: '参与计算的字节数' },
  ];

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
  }

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
        <span style={ { marginLeft: 16 } }>校验算法:</span>
        <Select
          showSearch
          style={ { width: 260 } }
          value={ algoName }
          onChange={ (v) => { setAlgoName(v); } }
          options={ CRC_ALGOS.map((a) => ({ label: a.name, value: a.name })) }
          optionFilterProp="label"
          placeholder="选择 CRC 算法"
        />
      </Space>

      <div style={ { margin: '2px 0 4px 0', color: 'rgba(0,0,0,0.55)' } }>
        <Text type="secondary" style={ { fontSize: 12 } }>{ algoSummary(param) }</Text>
      </div>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        status={ (error !== '' ? 'error' : '') as InputStatus }
        onChange={ (e) => { setHexInput(e.target.value); } }
        value= { hexInput }
        placeholder={ mode === 'hex'
          ? '输入需要计算 CRC 校验值的数据 (十六进制字节, 如: 01 03 04 02 00 01 00) 或 拖拽文件到框内打开'
          : '输入文本 (按 UTF-8 编码为字节参与计算, 如: 123456789 -> CRC-16/MODBUS = 4B37) 或 拖拽文件到框内打开' }
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Space size={ [8, 8] } wrap style={ { margin: '4px 0' } }>
        <Button
          danger
          icon={ <ClearOutlined /> }
          disabled={ hexInput === '' }
          onClick={ clear }
        >清除</Button>
      </Space>

      <Divider dashed style={ { margin: '8px 0' } } />

      <div style={ { flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 12 } }>
        { error !== '' && (
          <div style={ { margin: '0 0 8px 0', color: '#ff4d4f' } }>
            <Text type="danger" strong>{ error }</Text>
          </div>
        ) }
        <Form name="crc" labelCol={ { span: 3 } } autoComplete="off" >
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
        <CRCIntro />
      </div>
    </div>
  );
}

export default CRCCheck;
