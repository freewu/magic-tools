import { Divider, Input, Radio, Select, Space, Button, InputNumber, Checkbox, message, Row } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { useLocale } from "./../../hook/locale-context"
import { u, uT } from './lang'
import { kmacAlgoList } from "./data"
import { kmac, bytesToHex, hexToBytes, utf8Bytes, getDefaultAlgo, getDefaultLength, getDefaultXof } from "./lib"
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { RadioChangeEvent } from 'antd/es/radio';

const KMACCalc = () => {

  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [ key, setKey ] = useState('');                       // 密钥
  const [ data, setData ] = useState('');                     // 消息
  const [ custom, setCustom ] = useState('');                 // 自定义字符串 S
  const [ algo, setAlgo ] = useState(getDefaultAlgo());       // KMAC128 / KMAC256
  const [ outLen, setOutLen ] = useState(getDefaultLength()); // 输出字节数
  const [ xof, setXof ] = useState(getDefaultXof());          // XOF 可变输出
  const [ fmt, setFmt ] = useState<'utf8' | 'hex'>('hex');
  const [ upper, setUpper ] = useState(false);
  const [ result, setResult ] = useState('');
  const [ notice, contextHolder] = message.useMessage();

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLTextAreaElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success(t("复制到粘贴板成功！！！"));
    }
  };

  const parse = (s :string) :Uint8Array => {
    if (s.trim() === '') return new Uint8Array(0);
    return fmt === 'hex' ? hexToBytes(s) : utf8Bytes(s);
  };

  const formatResult = (hex :string) => upper ? hex.toUpperCase() : hex;

  const calc = (quiet = false) => {
    try {
      if (key.trim() === '') { setResult(''); return; }
      const capacity = (algo === 'KMAC256' ? 256 : 128) as 128 | 256;
      const out = kmac({
        capacity,
        key: parse(key),
        data: parse(data),
        outLen,
        custom,
        xof,
      });
      setResult(formatResult(bytesToHex(out)));
    } catch (err) {
      setResult('');
      if (!quiet) {
        const msgErr = err instanceof Error ? err.message : String(err);
        notice.error(tt('计算失败: {m}', { m: msgErr }));
      }
    }
  };

  const recompute = (hasKey :boolean) => {
    if (hasKey) calc(true);
    else setResult('');
  };

  const onFormatChange = (e :RadioChangeEvent) => {
    setFmt(e.target.value);
    if (key.trim() !== '') calc(true);
  };
  const onUpperChange = (e :CheckboxChangeEvent) => {
    setUpper(e.target.checked);
    if (result !== '') { try { setResult(formatResult(result)); } catch { /* noop */ } }
  };

  return (
    <div>
      {contextHolder}

      <Row><Space><label>{t('算法:')}</label>
        <Select
          value={ algo }
          style={{ width: 130 }}
          onChange={ (v :string) => { setAlgo(v); if (key.trim() !== '') calc(true); } }
          options={ kmacAlgoList.map((a) => ({ label: a, value: a })) }
        />
        <label>{t('输出长度:')}</label>
        <InputNumber
          addonAfter={t('字节')}
          min={ 1 }
          max={ 8192 }
          style={{ width: 140 }}
          onChange={ (v :number | null) => {
            if (v != null && v >= 1 && v <= 8192) { setOutLen(v); if (key.trim() !== '') calc(true); }
          } }
          value={ outLen }
        />
        <label>{t('XOF 模式:')}</label>
        <Checkbox
          checked={ xof }
          onChange={ (e) => { setXof(e.target.checked); if (key.trim() !== '') calc(true); } }
        >{t('可变长输出 (XOF)')}</Checkbox>
        <label>{t('输入格式:')}</label>
        <Radio.Group
          value={ fmt }
          onChange={ onFormatChange }
          options={ [
            { label: 'UTF-8', value: 'utf8' },
            { label: 'HEX', value: 'hex' },
          ] }
          optionType="button"
        />
      </Space></Row>

      <div style={{ marginTop: 8 }}><b>{t('密钥 K (SP 800-185 建议 ≥ 目标安全强度字节数):')}</b></div>
      <TextArea
        style={{ margin: "5px 0 5px 0" }}
        value={ key }
        onChange={ (e) => { const v = e.target.value; setKey(v); recompute(v.trim() !== ''); } }
        placeholder={ fmt === 'hex'
          ? t('密钥十六进制, 如 404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f')
          : t('密钥 (任意文本)') }
        autoSize={{ minRows: 2, maxRows: 3 }}
      />

      <div style={{ marginTop: 8 }}><b>{t('消息 X:')}</b></div>
      <TextArea
        style={{ margin: "5px 0 5px 0" }}
        value={ data }
        onChange={ (e) => { const v = e.target.value; setData(v); recompute(key.trim() !== ''); } }
        placeholder={ fmt === 'hex' ? t('消息十六进制 (可空), 如 00010203') : t('消息内容 (可空)') }
        autoSize={{ minRows: 3, maxRows: 6 }}
      />

      <div style={{ marginTop: 8 }}><b>{t('自定义字符串 S (Customization, 可空):')}</b></div>
      <Input
        style={{ margin: "5px 0 5px 0" }}
        value={ custom }
        onChange={ (e) => { const v = e.target.value; setCustom(v); recompute(key.trim() !== ''); } }
        placeholder={t('如 My Tagged Application (UTF-8 文本)')}
      />

      <Row style={{ marginTop: 5 }}><Space>
        <Button
          style={{ backgroundColor: "#007bff", color: "#fff" }}
          onClick={ () => { if (key.trim() === '') { notice.warning(t('密钥不能为空')); return; } calc(false); } }
        >{t('计算 KMAC')}</Button>
        <Checkbox onChange={ onUpperChange } checked={ upper }>{t('大写显示')}</Checkbox>
        <Button
          onClick={ () => { setKey(''); setData(''); setCustom(''); setResult(''); } }
          style={{ backgroundColor: "#dc3545", color: "#fff" }}
        >{t('清除')}</Button>
      </Space></Row>

      <Divider dashed />

      <TextArea
        showCount
        readOnly
        onDoubleClick={ inputClick }
        title={t('双击复制结果到粘贴板')}
        style={{ margin: "5px 0 5px 0" }}
        value={ result }
        placeholder={ tt('KMAC 输出 ({b} 字节, {c} 个十六进制字符)', { b: outLen, c: outLen * 2 }) }
        autoSize={{ minRows: 6, maxRows: 12 }}
      />
    </div>
  );
}

export default KMACCalc;
