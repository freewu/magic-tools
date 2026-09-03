import { Button, Divider, Input, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { saveTextFile } from "../../lib/tauri"
import {
  generateSm2KeyPair, derivePublicKey, sm2EncryptText, sm2DecryptText,
} from "./lib"
import SM2Intro from "./intro"

const SM2Crypto = () => {

  const [ publicKey, setPublicKey ] = useState('');
  const [ privateKey, setPrivateKey ] = useState('');
  const [ plainText, setPlainText ] = useState('');
  const [ cipherText, setCipherText ] = useState('');
  const [ resultText, setResultText ] = useState('');
  const [ notice, contextHolder ] = message.useMessage();

  const copy = (txt :string, tip :string) => {
    if (txt.trim() !== '') {
      copyTextToClipboard(txt);
      notice.success(`${tip} 已复制到粘贴板`);
    }
  };

  const generate = () => {
    const pair = generateSm2KeyPair();
    setPrivateKey(pair.privateKey);
    setPublicKey(pair.publicKey);
    notice.success('SM2 密钥对生成成功');
  };

  const derive = () => {
    try {
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey.trim())) {
        notice.warning('私钥需为 64 位 HEX');
        return;
      }
      setPublicKey(derivePublicKey(privateKey.trim()));
      notice.success('已由私钥推导出公钥');
    } catch (err) {
      notice.error('推导失败: ' + (err as Error).message);
    }
  };

  const doEncrypt = () => {
    try {
      if (!/^04[0-9a-fA-F]{128}$/.test(publicKey.trim())) { notice.warning('公钥需为 04||X||Y 未压缩格式 (128 位 HEX)'); return; }
      if (plainText === '') { notice.warning('请输入需要加密的明文'); return; }
      setCipherText(sm2EncryptText(plainText, publicKey.trim()));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    }
  };

  const doDecrypt = () => {
    try {
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey.trim())) { notice.warning('私钥需为 64 位 HEX'); return; }
      if (cipherText.trim() === '') { notice.warning('请输入需要解密的密文 (HEX)'); return; }
      setResultText(sm2DecryptText(cipherText.trim(), privateKey.trim()));
    } catch (err) {
      notice.error('解密失败: ' + (err as Error).message);
    }
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    copy((e.target as HTMLTextAreaElement).value, '内容');
  };

  const exportKey = async (which :'public' | 'private') => {
    const content = which === 'public' ? publicKey : privateKey;
    if (content.trim() === '') { notice.warning('没有可导出的密钥, 请先生成'); return; }
    const ok = await saveTextFile(`sm2-${which === 'public' ? 'public' : 'private'}.txt`, content.trim(), '保存密钥文件');
    if (ok) notice.success('密钥已保存');
  };

  return (
    <div>
      {contextHolder}

      <div style={ { margin: "8px 0" } }>
        <Button type="primary" onClick={ generate }>生成密钥对</Button>
        <span style={ { color: "#999", marginLeft: 12 } }>公钥加密 / 私钥解密 (GB/T 32918.4, C1C3C2)</span>
      </div>

      <div style={ { fontWeight: 600 } }>公钥 (04‖X‖Y, 130 位 HEX) <span style={ { color: "#999", fontWeight: 400 } }>用于加密</span></div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace" } }
        onChange={ (e) => setPublicKey(e.target.value) }
        onDoubleClick={ textareaDoubleClick }
        value={ publicKey }
        placeholder="生成后自动填充 (04 开头, 130 位 HEX), 也可粘贴其他工具导出的公钥"
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
      <SpaceInline>
        <Button size="small" onClick={ () => copy(publicKey, '公钥') }>复制公钥</Button>
        <Button size="small" onClick={ () => exportKey('public') }>导出公钥到文件</Button>
      </SpaceInline>

      <div style={ { fontWeight: 600 } }>私钥 (d, 64 位 HEX) <span style={ { color: "#999", fontWeight: 400 } }>用于解密, 请保密</span></div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace" } }
        onChange={ (e) => setPrivateKey(e.target.value) }
        onDoubleClick={ textareaDoubleClick }
        value={ privateKey }
        placeholder="生成后自动填充 (64 位 HEX), 也可粘贴其他工具导出的私钥"
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
      <SpaceInline>
        <Button size="small" onClick={ () => copy(privateKey, '私钥') }>复制私钥</Button>
        <Button size="small" onClick={ () => exportKey('private') }>导出私钥到文件</Button>
        <Button size="small" onClick={ derive }>从私钥推导公钥</Button>
      </SpaceInline>

      <Divider style={ { margin: "12px 0" } }>公钥加密</Divider>

      <TextArea
        style={ { margin: "4px 0" } }
        onChange={ (e) => setPlainText(e.target.value) }
        value={ plainText }
        placeholder="输入需要加密的明文 (UTF-8, 任意长度)"
        autoSize={{ minRows: 4, maxRows: 8 }}
      />
      <Button type="primary" onClick={ doEncrypt } style={ { margin: "4px 0" } }>SM2 加密</Button>
      <TextArea
        readOnly
        style={ { margin: "4px 0", fontFamily: "monospace", background: "transparent" } }
        onDoubleClick={ textareaDoubleClick }
        value={ cipherText }
        title="双击复制密文"
        placeholder="密文 (HEX, C1C3C2) 将显示在这里"
        autoSize={{ minRows: 3, maxRows: 8 }}
      />

      <Divider style={ { margin: "12px 0" } }>私钥解密</Divider>

      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace" } }
        onChange={ (e) => setCipherText(e.target.value) }
        value={ cipherText }
        placeholder="粘贴上面加密得到的密文 (HEX), 或 sm-crypto / 其他国密工具按 C1C3C2 加密的密文 (兼容带 04 前缀)"
        autoSize={{ minRows: 3, maxRows: 8 }}
      />
      <Button type="primary" danger onClick={ doDecrypt } style={ { margin: "4px 0" } }>SM2 解密</Button>
      <TextArea
        readOnly
        style={ { margin: "4px 0", background: "transparent" } }
        onDoubleClick={ textareaDoubleClick }
        value={ resultText }
        title="双击复制明文"
        placeholder="解密得到的明文将显示在这里"
        autoSize={{ minRows: 3, maxRows: 8 }}
      />

      <Divider> SM2 说明 </Divider>
      <SM2Intro />
    </div>
  );
}

// 简单的行内 Space 替代 (避免重复引入)
const SpaceInline = ({ children } :{ children: React.ReactNode }) => (
  <div style={ { margin: "4px 0 8px 0", display: "flex", gap: 8 } }>{ children }</div>
);

export default SM2Crypto;
