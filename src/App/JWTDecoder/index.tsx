import { Alert, Divider, Input, message, Typography } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { jwtDecode, partText, JwtDecodeResult } from "./lib"
import JWTIntro from "./intro"

const JWTDecoder = () => {

  const [ token, setToken ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const result :JwtDecodeResult = jwtDecode(token);

  const inputClick = (e :React.MouseEvent<HTMLInputElement>) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const txt = e.target.value.trim();
    if (txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLTextAreaElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const headerJson = (result.ok && result.header && result.header.json) ? result.header.json : null;
  const headerMeta = headerJson
    ? [ 'alg', 'typ', 'kid' ].filter((k) => headerJson[k] !== undefined)
        .map((k) => `${k}: ${String(headerJson[k])}`).join('   ')
    : '';

  const sig = result.signature ?? '';
  const sigRaw = result.signatureRaw ?? '';

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onChange={ (e) => { setToken(e.target.value) ;} }
        value={ token }
        placeholder="粘贴 JWT (header.payload.signature, 例如 eyJhbGciOi...)"
        autoSize={{ minRows: 4, maxRows: 6 }}
      />

      { token.trim() !== '' && !result.ok && (
        <Alert type="error" showIcon style={ { margin: "8px 0" } } message={ result.error } />
      ) }

      { result.ok && result.header && result.payload && (
        <div style={ { margin: "8px 0" } }>
          <Typography.Text type="secondary" style={ { fontSize: 12 } }>
            Header 元信息: { headerMeta || "无 alg/typ/kid 字段" }
          </Typography.Text>

          <div style={ { marginTop: 12, fontWeight: 600 } }>① 头部 (Header)</div>
          <TextArea
            readOnly
            style={ { margin: "4px 0 8px 0", background: "transparent" } }
            onDoubleClick={ textareaDoubleClick }
            title="双击复制内容到粘贴板"
            value={ partText(result.header) }
            autoSize={{ minRows: 3, maxRows: 10 }}
          />

          <div style={ { fontWeight: 600 } }>② 负载 (Payload)</div>
          <TextArea
            readOnly
            style={ { margin: "4px 0 8px 0", background: "transparent" } }
            onDoubleClick={ textareaDoubleClick }
            title="双击复制内容到粘贴板"
            value={ partText(result.payload) }
            autoSize={{ minRows: 5, maxRows: 14 }}
          />

          <div style={ { fontWeight: 600, marginBottom: 4 } }>③ 签名 (Signature)</div>
          <Input
            readOnly
            value={ sig === '' ? '(空签名, 可能为 none 算法)' : sig.toUpperCase() }
            onClick={ inputClick }
            title="点击复制 HEX 签名"
            addonBefore="HEX"
            style={ { marginBottom: 8 } }
          />
          { sigRaw !== '' && (
            <Typography.Text type="secondary" style={ { fontSize: 12, wordBreak: "break-all" } }>
              base64url: { sigRaw }
            </Typography.Text>
          ) }
        </div>
      ) }

      <Divider> JWT 解码说明 </Divider>

      <JWTIntro />
    </div>
  );
}

export default JWTDecoder;
