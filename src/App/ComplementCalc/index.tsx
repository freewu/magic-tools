import { Radio, Input, InputNumber, Select, Space, Divider, Form, message, Tag } from "antd";
import { useState } from "react";
import type { RadioChangeEvent } from 'antd';
import { copyTextToClipboard } from "../../lib";
import { encodeNumber, decodeNumber, signedRangeText, unsignedRangeText } from "./lib";
import type { DecodeKind } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

const DECODE_KINDS = [
  { label: '补码 (二进制)', value: 'tc' },
  { label: '补码 (十六进制)', value: 'hex' },
  { label: '原码 (二进制)', value: 'sm' },
  { label: '反码 (二进制)', value: 'oc' },
] as const;

const ComplementCalc = () => {
  const [ mode, setMode ] = useState<'encode'|'decode'>('encode');
  const [ bits, setBits ] = useState(8);
  const [ kind, setKind ] = useState<DecodeKind>('tc');
  const [ input, setInput ] = useState('');
  const [ status, setStatus ] = useState('');
  const [ error, setError ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const clickCopy = (e :React.MouseEvent<HTMLInputElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const onModeChange = (e :RadioChangeEvent) => {
    setMode(e.target.value);
    setInput(''); setStatus(''); setError('');
  };

  const onBitsChange = (v :number | null) => {
    if(v === null) return;
    setBits(v); setStatus(''); setError('');
  };

  const onInputChange = (v :string) => {
    setInput(v); setError('');
    if(v.trim() === '') { setStatus(''); return; }
    if(mode === 'encode') {
      const r = encodeNumber(v, bits);
      setStatus(r.ok ? '' : 'error');
      if(!r.ok) setError(r.error);
    } else {
      const r = decodeNumber(v, bits, kind);
      setStatus(r.ok ? '' : 'error');
      if(!r.ok) setError(r.error);
    }
  };

  const onKindChange = (k :DecodeKind) => {
    setKind(k); setStatus(''); setError('');
    if(input.trim() !== '') onInputChange(input);
  };

  const enc = mode === 'encode' && input.trim() !== '' && status === '' ? encodeNumber(input, bits) : null;
  const dec = mode === 'decode' && input.trim() !== '' && status === '' ? decodeNumber(input, bits, kind) : null;
  // 解码结果回推三码, 便于对照
  const encOfDec = dec?.ok ? encodeNumber(dec.decimal, bits) : null;

  const readOnlyStyle = { cursor: "pointer" };

  return (
    <div>
      {contextHolder}
      <Space wrap>
        <Radio.Group
          optionType="button" buttonStyle="solid"
          value={ mode }
          onChange={ onModeChange }
          options={ [
            { label: '十进制 → 原/反/补码', value: 'encode' },
            { label: '编码 → 十进制', value: 'decode' },
          ] }
        />
        <Space size={ 4 }>
          <span style={ { color: 'var(--app-text)' } }>位宽</span>
          <InputNumber min={ 1 } max={ 64 } value={ bits } onChange={ onBitsChange } style={ { width: 80 } } />
          <span style={ { color: 'var(--app-text)', fontSize: 12 } }>(bit)</span>
        </Space>
        <Tag color="blue">有符号 { signedRangeText(bits) }</Tag>
        <Tag color="cyan">无符号 { unsignedRangeText(bits) }</Tag>
      </Space>

      <Divider dashed />

      { mode === 'encode' && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label="十进制整数">
            <Input
              status={ status as InputStatus }
              value={ input }
              onChange={ (e) => onInputChange(e.target.value) }
              placeholder={ `输入十进制整数 (范围 ${signedRangeText(bits)})` }
            />
          </Form.Item>
        </Form>
      ) }

      { mode === 'decode' && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label="编码类型">
            <Select
              style={ { width: 220 } }
              value={ kind }
              onChange={ onKindChange }
              options={ DECODE_KINDS as unknown as Array<{ label: string; value: string }> }
            />
          </Form.Item>
          <Form.Item label={ kind === 'hex' ? '十六进制' : '二进制串' }>
            <Input
              status={ status as InputStatus }
              value={ input }
              onChange={ (e) => onInputChange(e.target.value) }
              placeholder={ kind === 'hex' ? `输入 ${bits} 位补码十六进制 (可带 0x, 最多 ${Math.ceil(bits / 4)} 位)` : `输入 ${bits} 位${kind === 'tc' ? '补码' : kind === 'sm' ? '原码' : '反码'}二进制 (可少于 ${bits} 位, 高位补 0)` }
            />
          </Form.Item>
        </Form>
      ) }

      { error !== '' && <div style={ { color: '#ff4d4f', marginBottom: 8 } }>{ error }</div> }

      { mode === 'encode' && enc?.ok && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label={ `原码 (${bits}位)` }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ enc.smOcUnavailable ? `−2^${bits - 1} 超出原码表示范围 (±(2^${bits - 1}−1))` : enc.sm } />
          </Form.Item>
          <Form.Item label={ `反码 (${bits}位)` }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ enc.smOcUnavailable ? `−2^${bits - 1} 超出反码表示范围 (±(2^${bits - 1}−1))` : enc.oc } />
          </Form.Item>
          <Form.Item label={ `补码 (${bits}位)` }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ enc.tc } />
          </Form.Item>
          <Form.Item label="补码 (十六进制)">
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ `0x${enc.tcHex}` } />
          </Form.Item>
        </Form>
      ) }

      { mode === 'decode' && dec?.ok && encOfDec?.ok && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label="十进制结果">
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ dec.decimal } />
          </Form.Item>
          <Form.Item label={ `补码 (${bits}位)` }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ dec.binary } />
          </Form.Item>
          <Form.Item label="补码 (十六进制)">
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ `0x${dec.hex}` } />
          </Form.Item>
          <Form.Item label="原码">
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ encOfDec.smOcUnavailable ? '—' : encOfDec.sm } />
          </Form.Item>
          <Form.Item label="反码">
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ encOfDec.smOcUnavailable ? '—' : encOfDec.oc } />
          </Form.Item>
        </Form>
      ) }

      <Divider dashed />
      <div style={ { color: 'var(--app-text)', fontSize: 12, opacity: 0.6, lineHeight: 1.8 } }>
        说明: 正数的原码 / 反码 / 补码相同; 负数的补码 = 反码 + 1。最左位为符号位 (0 正 / 1 负)。
        原码与反码可表示范围仅 ±(2^(N−1)−1), 因此 −2^(N−1) 只有补码表示。
      </div>
    </div>
  );
}

export default ComplementCalc;
