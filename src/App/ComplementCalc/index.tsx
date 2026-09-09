import { Radio, Input, InputNumber, Select, Space, Divider, Form, message, Tag } from "antd";
import { useState } from "react";
import type { RadioChangeEvent } from 'antd';
import { copyTextToClipboard } from "../../lib";
import { encodeNumber, decodeNumber, signedRangeText, unsignedRangeText } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { u, uT } from "../ui-lang";
import type { DecodeKind } from "./lib";
import type { InputStatus } from "antd/es/_util/statusUtils";

const DECODE_KINDS = [
  { label: '补码 (二进制)', value: 'tc' },
  { label: '补码 (十六进制)', value: 'hex' },
  { label: '原码 (二进制)', value: 'sm' },
  { label: '反码 (二进制)', value: 'oc' },
] as const;

const ComplementCalc = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
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
      notice.success(t("复制到粘贴板成功！！！"));
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
            { label: t('十进制 → 原/反/补码'), value: 'encode' },
            { label: t('编码 → 十进制'), value: 'decode' },
          ] }
        />
        <Space size={ 4 }>
          <span style={ { color: 'var(--app-text)' } }>{t('位宽')}</span>
          <InputNumber min={ 1 } max={ 64 } value={ bits } onChange={ onBitsChange } style={ { width: 80 } } />
          <span style={ { color: 'var(--app-text)', fontSize: 12 } }>(bit)</span>
        </Space>
        <Tag color="blue">{tt('有符号 {r}', { r: signedRangeText(bits) })}</Tag>
        <Tag color="cyan">{tt('无符号 {r}', { r: unsignedRangeText(bits) })}</Tag>
      </Space>

      <Divider dashed />

      { mode === 'encode' && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label={t('十进制整数')}>
            <Input
              status={ status as InputStatus }
              value={ input }
              onChange={ (e) => onInputChange(e.target.value) }
              placeholder={ tt('输入十进制整数 (范围 {r})', { r: signedRangeText(bits) }) }
            />
          </Form.Item>
        </Form>
      ) }

      { mode === 'decode' && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label={t('编码类型')}>
            <Select
              style={ { width: 220 } }
              value={ kind }
              onChange={ onKindChange }
              options={ DECODE_KINDS.map((o) => ({ ...o, label: t(o.label) })) as unknown as Array<{ label: string; value: string }> }
            />
          </Form.Item>
          <Form.Item label={ kind === 'hex' ? t('十六进制') : t('二进制串') }>
            <Input
              status={ status as InputStatus }
              value={ input }
              onChange={ (e) => onInputChange(e.target.value) }
              placeholder={ kind === 'hex' ? tt('输入 {b} 位补码十六进制 (可带 0x, 最多 {c} 位)', { b: bits, c: Math.ceil(bits / 4) }) : tt('输入 {b} 位{k}二进制 (可少于 {b} 位, 高位补 0)', { b: bits, k: t(kind === 'tc' ? '补码' : kind === 'sm' ? '原码' : '反码') }) }
            />
          </Form.Item>
        </Form>
      ) }

      { error !== '' && <div style={ { color: '#ff4d4f', marginBottom: 8 } }>{ error }</div> }

      { mode === 'encode' && enc?.ok && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label={ tt('{k} ({b}位)', { k: t('原码'), b: bits }) }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ enc.smOcUnavailable ? tt('−2^{b} 超出原码表示范围 (±(2^{b}−1))', { b: bits - 1 }) : enc.sm } />
          </Form.Item>
          <Form.Item label={ tt('{k} ({b}位)', { k: t('反码'), b: bits }) }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ enc.smOcUnavailable ? tt('−2^{b} 超出反码表示范围 (±(2^{b}−1))', { b: bits - 1 }) : enc.oc } />
          </Form.Item>
          <Form.Item label={ tt('{k} ({b}位)', { k: t('补码'), b: bits }) }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ enc.tc } />
          </Form.Item>
          <Form.Item label={t('补码 (十六进制)')}>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ `0x${enc.tcHex}` } />
          </Form.Item>
        </Form>
      ) }

      { mode === 'decode' && dec?.ok && encOfDec?.ok && (
        <Form labelCol={ { span: 6 } } autoComplete="off">
          <Form.Item label={t('十进制结果')}>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ dec.decimal } />
          </Form.Item>
          <Form.Item label={ tt('{k} ({b}位)', { k: t('补码'), b: bits }) }>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ dec.binary } />
          </Form.Item>
          <Form.Item label={t('补码 (十六进制)')}>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ `0x${dec.hex}` } />
          </Form.Item>
          <Form.Item label={t('原码')}>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ encOfDec.smOcUnavailable ? '—' : encOfDec.sm } />
          </Form.Item>
          <Form.Item label={t('反码')}>
            <Input readOnly style={ readOnlyStyle } onClick={ clickCopy } value={ encOfDec.smOcUnavailable ? '—' : encOfDec.oc } />
          </Form.Item>
        </Form>
      ) }

      <Divider dashed />
      <div style={ { color: 'var(--app-text)', fontSize: 12, opacity: 0.6, lineHeight: 1.8 } }>
        {t('说明: 正数的原码 / 反码 / 补码相同; 负数的补码 = 反码 + 1。最左位为符号位 (0 正 / 1 负)。原码与反码可表示范围仅 ±(2^(N−1)−1), 因此 −2^(N−1) 只有补码表示。')}
      </div>
    </div>
  );
}

export default ComplementCalc;
