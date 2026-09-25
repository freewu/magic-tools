import { Alert, Button, Checkbox, Input, Select, Space, Typography, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
const { Text } = Typography;
import { copyTextToClipboard } from "./../../lib"
import { jwtEncode, type JwtAlg } from "./lib"
import { algList, ALG_VALUES, DEFAULT_HEADER, DEFAULT_PAYLOAD, DEFAULT_SECRET } from "./data"
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import jwtLang from "./lang";

const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace';

type EncodeResult = {
  token: string;
  headerB64: string;
  payloadB64: string;
  signatureB64: string;
  signatureHex: string;
};

/** 「生成」页签: 编辑头部 / 负载 JSON + 密钥, 生成 HS256 / HS384 / HS512 / none 的 JWT */
const JWTEncodeTab = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(jwtLang, locale, key, fallback);

  const [ alg, setAlg ] = useState<JwtAlg>('HS256');
  const [ header, setHeader ] = useState(DEFAULT_HEADER);
  const [ payload, setPayload ] = useState(DEFAULT_PAYLOAD);
  const [ secret, setSecret ] = useState(DEFAULT_SECRET);
  const [ secretBase64, setSecretBase64 ] = useState(false);
  const [ result, setResult ] = useState<EncodeResult | null>(null);
  const [ error, setError ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  // 输入变化时清掉上次结果, 避免展示过期 token
  const reset = () => { setResult(null); setError(''); };

  const algOptions = algList.map((v) => ({ value: v, label: v === 'none' ? t('algNone', 'none (不签名)') : v }));

  // 切换算法: 同步写入头部 JSON 的 alg 字段 (JSON 非法时重建为默认头部)
  const onAlgChange = (v :JwtAlg) => {
    setAlg(v);
    setHeader((prev) => {
      try {
        const j = JSON.parse(prev);
        if (j && typeof j === 'object' && !Array.isArray(j)) {
          return JSON.stringify({ ...j, alg: v }, null, 2);
        }
      } catch { /* 忽略, 用默认头部 */ }
      return `{\n  "alg": "${v}",\n  "typ": "JWT"\n}`;
    });
    reset();
  };

  // 编辑头部 JSON: 若其中 alg 合法则同步下拉框
  const onHeaderChange = (v :string) => {
    setHeader(v);
    try {
      const a = (JSON.parse(v) as Record<string, unknown>)?.alg;
      if (typeof a === 'string' && ALG_VALUES.includes(a)) setAlg(a as JwtAlg);
    } catch { /* 输入中, 忽略 */ }
    reset();
  };

  const generate = () => {
    const r = jwtEncode(header, payload, secret, alg, secretBase64);
    if (!r.ok) {
      setResult(null);
      setError(r.error ?? '');
      return;
    }
    setError('');
    setResult({
      token: r.token as string,
      headerB64: r.headerB64 as string,
      payloadB64: r.payloadB64 as string,
      signatureB64: r.signatureB64 as string,
      signatureHex: r.signatureHex as string,
    });
  };

  // 负载中写入当前时间戳 (iat) 与 1 小时后的过期时间 (exp)
  const fillTimeClaims = () => {
    const now = Math.floor(Date.now() / 1000);
    setPayload((prev) => {
      let j :Record<string, unknown> = {};
      try {
        const p = JSON.parse(prev);
        if (p && typeof p === 'object' && !Array.isArray(p)) j = p as Record<string, unknown>;
      } catch { /* 忽略, 用空对象 */ }
      return JSON.stringify({ ...j, iat: now, exp: now + 3600 }, null, 2);
    });
    reset();
  };

  const resetAll = () => {
    setAlg('HS256');
    setHeader(DEFAULT_HEADER);
    setPayload(DEFAULT_PAYLOAD);
    setSecret(DEFAULT_SECRET);
    setSecretBase64(false);
    reset();
  };

  const copy = (text :string) => {
    if (text.trim() === '') return;
    copyTextToClipboard(text);
    notice.success(t('copyOk', '复制到粘贴板成功！！！'));
  };

  const clickCopy = (e :React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => copy(e.currentTarget.value);

  return (
    <div>
      {contextHolder}

      <Space wrap style={ { margin: "10px 0 6px 0" } }>
        <span style={ { color: '#888' } }>{ t('encAlg', '算法') }</span>
        <Select
          value={ alg }
          onChange={ (v) => onAlgChange(v as JwtAlg) }
          options={ algOptions }
          style={ { width: 170 } }
        />
        <span style={ { color: '#888' } }>{ t('encSecret', '密钥') }</span>
        <Input
          value={ secret }
          disabled={ alg === 'none' }
          onChange={ (e) => { setSecret(e.target.value); reset(); } }
          placeholder={ t('encSecretPh', 'HMAC 签名密钥 (secret)') }
          style={ { width: 260 } }
        />
        <Checkbox
          checked={ secretBase64 }
          disabled={ alg === 'none' }
          onChange={ (e) => { setSecretBase64(e.target.checked); reset(); } }
        >{ t('encSecretB64', '密钥为 Base64') }</Checkbox>
      </Space>

      { alg === 'none' && (
        <Alert
          type="warning" showIcon style={ { margin: "4px 0 8px 0" } }
          message={ t('encNoneWarn', 'alg=none 表示不签名, 生成的 token 可被任意篡改, 仅用于调试') }
        />
      ) }

      <div style={ { fontWeight: 600 } }>{ t('encHeaderTitle', '① 头部 (Header, JSON)') }</div>
      <TextArea
        value={ header }
        onChange={ (e) => onHeaderChange(e.target.value) }
        autoSize={ { minRows: 3, maxRows: 8 } }
        style={ { margin: "4px 0 8px 0", fontFamily: MONO, fontSize: 13 } }
      />

      <div style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }>
        <span style={ { fontWeight: 600 } }>{ t('encPayloadTitle', '② 负载 (Payload, JSON)') }</span>
        <Button type="link" size="small" style={ { padding: 0 } } onClick={ fillTimeClaims }>
          { t('encFillTime', '填入 iat / exp (当前时间 + 1 小时)') }
        </Button>
      </div>
      <TextArea
        value={ payload }
        onChange={ (e) => { setPayload(e.target.value); reset(); } }
        autoSize={ { minRows: 5, maxRows: 14 } }
        style={ { margin: "4px 0 8px 0", fontFamily: MONO, fontSize: 13 } }
      />

      <Space wrap style={ { marginBottom: 8 } }>
        <Button type="primary" onClick={ generate }>{ t('encGenerate', '生成 JWT') }</Button>
        <Button disabled={ !result } onClick={ () => result && copy(result.token) }>{ t('encCopy', '复制 token') }</Button>
        <Button onClick={ resetAll }>{ t('encReset', '重置') }</Button>
      </Space>

      { error !== '' && <Alert type="error" showIcon style={ { margin: "8px 0" } } message={ error } /> }

      { result && (
        <div>
          <div style={ { fontWeight: 600, marginBottom: 4 } }>{ t('encResultTitle', '③ 生成的 JWT') }</div>
          <TextArea
            readOnly
            value={ result.token }
            onClick={ clickCopy }
            title={ t('encClickCopy', '点击复制') }
            autoSize={ { minRows: 3, maxRows: 8 } }
            style={ { fontFamily: MONO, fontSize: 13, cursor: 'copy' } }
          />

          <div style={ { marginTop: 10, fontWeight: 600, marginBottom: 4 } }>{ t('encPartsTitle', '分段预览 (base64url)') }</div>
          <Input
            readOnly addonBefore="header" value={ result.headerB64 }
            onClick={ clickCopy } title={ t('encClickCopy', '点击复制') } style={ { marginBottom: 6 } }
          />
          <Input
            readOnly addonBefore="payload" value={ result.payloadB64 }
            onClick={ clickCopy } title={ t('encClickCopy', '点击复制') } style={ { marginBottom: 6 } }
          />
          <Input
            readOnly addonBefore="signature"
            value={ result.signatureB64 === '' ? t('encNoSig', '(空签名, alg=none)') : result.signatureB64 }
            onClick={ clickCopy } title={ t('encClickCopy', '点击复制') }
          />
          { result.signatureHex !== '' && (
            <Text type="secondary" style={ { fontSize: 12, wordBreak: "break-all", display: 'inline-block', marginTop: 6 } }>
              { t('encSigHex', '签名 HEX') }: { result.signatureHex }
            </Text>
          ) }
        </div>
      ) }
    </div>
  );
}

export default JWTEncodeTab;
