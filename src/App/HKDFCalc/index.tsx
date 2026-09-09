import { Divider, Input, Radio, Select, Space, Button, InputNumber, Checkbox, message, Row } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { useLocale } from "./../../hook/locale-context"
import { u, uT } from "./../ui-lang"
import { hashAlgoList } from "./data"
import { hkdf, hexToBytes, utf8Bytes, getDefaultAlgo, getDefaultLength } from "./lib"
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { RadioChangeEvent } from 'antd/es/radio';

const HKDFCalc = () => {

  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [ ikm, setIkm ] = useState('');             // 输入密钥材料 IKM
  const [ salt, setSalt ] = useState('');           // 盐
  const [ info, setInfo ] = useState('');           // 上下文信息
  const [ algo, setAlgo ] = useState(getDefaultAlgo());
  const [ outLen, setOutLen ] = useState(getDefaultLength());
  const [ fmt, setFmt ] = useState<'utf8' | 'hex'>('utf8');
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

  // quiet=true 时失败不弹提示 (实时输入中间态静默)
  const calc = (quiet = false) => {
    try {
      const ikmB = parse(ikm);
      if (ikmB.length === 0) { setResult(''); return; }
      const okm = hkdf(algo, ikmB, parse(salt), parse(info), outLen);
      setResult(formatResult(Array.from(okm, (b) => b.toString(16).padStart(2, '0')).join('')));
    } catch (err) {
      setResult('');
      if (!quiet) {
        const msgErr = err instanceof Error ? err.message : String(err);
        notice.error(tt('计算失败: {m}', { m: msgErr }));
      }
    }
  };

  // 输入变化 -> 静默重算 (仅 IKM 有内容时)
  const recompute = (hasIkm :boolean) => {
    if (hasIkm) calc(true);
    else setResult('');
  };

  const onFormatChange = (e :RadioChangeEvent) => {
    setFmt(e.target.value);
    if (ikm.trim() !== '') calc(true);
  };
  const onUpperChange = (e :CheckboxChangeEvent) => {
    setUpper(e.target.checked);
    if (result !== '') { try { setResult(formatResult(result)); } catch { /* noop */ } }
  };

  return (
    <div>
      {contextHolder}

      <Row><Space><label>{t('输入格式:')}</label>
        <Radio.Group
          value={ fmt }
          onChange={ onFormatChange }
          options={ [
            { label: t('UTF-8 文本'), value: 'utf8' },
            { label: t('HEX (十六进制)'), value: 'hex' },
          ] }
          optionType="button"
        />
        <label>{t('散列算法:')}</label>
        <Select
          value={ algo }
          style={{ width: 130 }}
          onChange={ (v :string) => { setAlgo(v); if (ikm.trim() !== '') calc(true); } }
          options={ hashAlgoList.map((a) => ({ label: a, value: a })) }
        />
        <label>{t('输出长度:')}</label>
        <InputNumber
          addonAfter={t('字节')}
          min={ 1 }
          max={ 8160 }
          style={{ width: 130 }}
          onChange={ (v :number | null) => {
            if (v != null && v >= 1 && v <= 8160) { setOutLen(v); if (ikm.trim() !== '') calc(true); }
          } }
          value={ outLen }
        />
      </Space></Row>

      <div style={{ marginTop: 8 }}><b>{t('IKM (输入密钥材料):')}</b></div>
      <TextArea
        style={{ margin: "5px 0 5px 0" }}
        value={ ikm }
        onChange={ (e) => { const v = e.target.value; setIkm(v); recompute(v.trim() !== ''); } }
        placeholder={ fmt === 'hex' ? t('IKM 的十六进制, 如 0b0b0b0b...') : t('IKM 密钥材料 (任意文本)') }
        autoSize={{ minRows: 2, maxRows: 4 }}
      />

      <div style={{ marginTop: 8 }}><b>{t('Salt (盐值, 可空):')}</b></div>
      <Input
        style={{ margin: "5px 0 5px 0" }}
        value={ salt }
        onChange={ (e) => { const v = e.target.value; setSalt(v); recompute(ikm.trim() !== ''); } }
        placeholder={t('盐值, 为空时使用全零(长度=散列长度)')}
      />

      <div style={{ marginTop: 8 }}><b>{t('Info (上下文信息, 可空):')}</b></div>
      <Input
        style={{ margin: "5px 0 5px 0" }}
        value={ info }
        onChange={ (e) => { const v = e.target.value; setInfo(v); recompute(ikm.trim() !== ''); } }
        placeholder={t('可选的应用上下文信息')}
      />

      <Row style={{ marginTop: 5 }}><Space>
        <Button
          style={{ backgroundColor: "#007bff", color: "#fff" }}
          onClick={ () => { if (ikm.trim() === '') { notice.warning(t('IKM 不能为空')); return; } calc(false); } }
        >{t('计算 HKDF')}</Button>
        <Checkbox onChange={ onUpperChange } checked={ upper }>{t('大写显示')}</Checkbox>
        <Button
          onClick={ () => { setIkm(''); setSalt(''); setInfo(''); setResult(''); } }
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
        placeholder={ tt('HKDF 输出 ({b} 字节, {c} 个十六进制字符)', { b: outLen, c: outLen * 2 }) }
        autoSize={{ minRows: 6, maxRows: 12 }}
      />
    </div>
  );
}

export default HKDFCalc;
