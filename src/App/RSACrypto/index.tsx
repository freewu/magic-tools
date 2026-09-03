import { Button, Divider, Input, Select, Space, Spin, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { saveTextFile } from "../../lib/tauri"
import {
  generateRsaKeyPair, rsaEncryptText, rsaDecryptText, rsaAvailable,
} from "./lib"
import RSAIntro from "./intro"

const RSACrypto = () => {

  const [ keyBits, setKeyBits ] = useState<2048 | 3072 | 4096>(2048);
  const [ publicPem, setPublicPem ] = useState('');
  const [ privatePem, setPrivatePem ] = useState('');
  const [ plainText, setPlainText ] = useState('');
  const [ cipherText, setCipherText ] = useState('');
  const [ resultText, setResultText ] = useState('');
  const [ loading, setLoading ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const copy = (txt :string, tip :string) => {
    if (txt.trim() !== '') {
      copyTextToClipboard(txt);
      notice.success(`${tip} 已复制到粘贴板`);
    }
  };

  const generate = async () => {
    if (!rsaAvailable()) {
      notice.error('当前环境不支持 WebCrypto, 无法生成密钥');
      return;
    }
    setLoading(true);
    try {
      const { privatePem: pri, publicPem: pub } = await generateRsaKeyPair(keyBits);
      setPrivatePem(pri);
      setPublicPem(pub);
      notice.success(`RSA-${keyBits} 密钥对生成成功`);
    } catch (err) {
      notice.error('生成失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doEncrypt = async () => {
    if (!rsaAvailable()) { notice.error('当前环境不支持 WebCrypto'); return; }
    if (publicPem.trim() === '') { notice.warning('请先生成或粘贴公钥'); return; }
    if (plainText === '') { notice.warning('请输入需要加密的明文'); return; }
    setLoading(true);
    try {
      setCipherText(await rsaEncryptText(publicPem, plainText));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doDecrypt = async () => {
    if (!rsaAvailable()) { notice.error('当前环境不支持 WebCrypto'); return; }
    if (privatePem.trim() === '') { notice.warning('请先生成或粘贴私钥'); return; }
    if (cipherText.trim() === '') { notice.warning('请输入需要解密的密文 (Base64)'); return; }
    setLoading(true);
    try {
      setResultText(await rsaDecryptText(privatePem, cipherText));
    } catch (err) {
      notice.error('解密失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    copy((e.target as HTMLTextAreaElement).value, '内容');
  };

  const exportPem = async (which :'public' | 'private') => {
    const pem = which === 'public' ? publicPem : privatePem;
    if (pem.trim() === '') { notice.warning('没有可导出的密钥, 请先生成'); return; }
    const ok = await saveTextFile(`rsa-${keyBits}-${which === 'public' ? 'public' : 'private'}.pem`, pem, '保存密钥文件');
    if (ok) notice.success('密钥已保存');
  };

  return (
    <div>
      {contextHolder}

      <div style={ { margin: "8px 0" } }>
        <Space wrap>
          <Select
            value={ keyBits }
            onChange={ (v) => setKeyBits(v) }
            style={ { width: 140 } }
            options={ [2048, 3072, 4096].map((n) => ({ label: `RSA-${n}`, value: n })) }
          />
          <Button type="primary" onClick={ generate } loading={ loading }>生成密钥对</Button>
          <span style={ { color: "#999" } }>公钥加密 / 私钥解密 (RSA-OAEP + SHA-256)</span>
        </Space>
      </div>

      <div style={ { fontWeight: 600 } }>公钥 (SPKI PEM) <span style={ { color: "#999", fontWeight: 400 } }>用于加密</span></div>
      <TextArea
        style={ { margin: "4px 0" } }
        onChange={ (e) => setPublicPem(e.target.value) }
        onDoubleClick={ textareaDoubleClick }
        value={ publicPem }
        placeholder="-----BEGIN PUBLIC KEY----- ... (生成后自动填充, 也可粘贴其他工具导出的公钥)"
        autoSize={{ minRows: 4, maxRows: 8 }}
      />
      <Space style={ { margin: "4px 0 8px 0" } }>
        <Button size="small" onClick={ () => copy(publicPem, '公钥') }>复制公钥</Button>
        <Button size="small" onClick={ () => exportPem('public') }>导出公钥到文件</Button>
      </Space>

      <div style={ { fontWeight: 600 } }>私钥 (PKCS#8 PEM) <span style={ { color: "#999", fontWeight: 400 } }>用于解密, 请保密</span></div>
      <TextArea
        style={ { margin: "4px 0" } }
        onChange={ (e) => setPrivatePem(e.target.value) }
        onDoubleClick={ textareaDoubleClick }
        value={ privatePem }
        placeholder="-----BEGIN PRIVATE KEY----- ... (生成后自动填充, 也可粘贴其他工具导出的私钥)"
        autoSize={{ minRows: 4, maxRows: 8 }}
      />
      <Space style={ { margin: "4px 0 8px 0" } }>
        <Button size="small" onClick={ () => copy(privatePem, '私钥') }>复制私钥</Button>
        <Button size="small" onClick={ () => exportPem('private') }>导出私钥到文件</Button>
      </Space>

      <Divider style={ { margin: "12px 0" } }>公钥加密</Divider>

      <TextArea
        style={ { margin: "4px 0" } }
        onChange={ (e) => setPlainText(e.target.value) }
        value={ plainText }
        placeholder="输入需要加密的明文 (UTF-8, 超过 190 字节会自动分段)"
        autoSize={{ minRows: 4, maxRows: 8 }}
      />
      <Button type="primary" onClick={ doEncrypt } loading={ loading } style={ { margin: "4px 0" } }>RSA 加密</Button>
      <TextArea
        readOnly
        style={ { margin: "4px 0", background: "transparent" } }
        onDoubleClick={ textareaDoubleClick }
        value={ cipherText }
        title="双击复制密文"
        placeholder="密文 (Base64) 将显示在这里"
        autoSize={{ minRows: 3, maxRows: 8 }}
      />

      <Divider style={ { margin: "12px 0" } }>私钥解密</Divider>

      <TextArea
        style={ { margin: "4px 0" } }
        onChange={ (e) => setCipherText(e.target.value) }
        value={ cipherText }
        placeholder="粘贴上面加密得到的密文 (Base64), 或外部工具按本工具格式加密的密文"
        autoSize={{ minRows: 3, maxRows: 8 }}
      />
      <Button type="primary" danger onClick={ doDecrypt } loading={ loading } style={ { margin: "4px 0" } }>RSA 解密</Button>
      <TextArea
        readOnly
        style={ { margin: "4px 0", background: "transparent" } }
        onDoubleClick={ textareaDoubleClick }
        value={ resultText }
        title="双击复制明文"
        placeholder="解密得到的明文将显示在这里"
        autoSize={{ minRows: 3, maxRows: 8 }}
      />

      { loading && (
        <div style={ { textAlign: "center", margin: "8px 0" } }><Spin size="small" /></div>
      ) }

      <Divider> RSA 说明 </Divider>
      <RSAIntro />
    </div>
  );
}

export default RSACrypto;
