import { Button, Divider, Input, Select, Space, Spin, Tabs, message } from "antd";
import { useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { saveTextFile } from "../../lib/tauri"
import { openFile } from "../../lib/file"
import {
  generateRsaKeyPair, rsaEncryptText, rsaDecryptText, rsaAvailable,
  getDefaultPublicKey, setDefaultPublicKey,
  getDefaultPrivateKey, setDefaultPrivateKey, hasDefaultKeyPair,
} from "./lib"
import RSAIntro from "./intro"

// 密钥摘要 (用于「加解密」页展示当前使用的密钥)
const pemSummary = (pem :string) :string => {
  const m = pem.match(/-----BEGIN (?:PUBLIC|PRIVATE) KEY-----([\s\S]*?)-----END (?:PUBLIC|PRIVATE) KEY-----/);
  if (!m) return '';
  const b64 = m[1].replace(/\s+/g, '');
  return b64.length > 40 ? b64.slice(0, 40) + '…' : b64;
};

const RSACrypto = () => {

  // 默认密钥对已配置 -> 自动进入「加解密」, 否则进入「密钥管理」
  const [ activeTab, setActiveTab ] = useState<string>(hasDefaultKeyPair() ? 'crypto' : 'manage');

  const [ keyBits, setKeyBits ] = useState<2048 | 3072 | 4096>(2048);
  const [ publicPem, setPublicPem ] = useState(getDefaultPublicKey());
  const [ privatePem, setPrivatePem ] = useState(getDefaultPrivateKey());
  const [ plainValue, setPlainValue ] = useState('');  // 明文区 (加密输入 / 解密输出)
  const [ cipherValue, setCipherValue ] = useState(''); // 密文区 (解密输入 / 加密输出)
  const [ loading, setLoading ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const copy = (txt :string, tip :string) => {
    if (txt.trim() !== '') {
      copyTextToClipboard(txt);
      notice.success(`${tip} 已复制到粘贴板`);
    }
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    copy((e.target as HTMLTextAreaElement).value, '内容');
  };

  // 生成密钥对并自动保存为默认
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
      setDefaultPrivateKey(pri);
      setDefaultPublicKey(pub);
      notice.success(`RSA-${keyBits} 密钥对生成成功, 已保存为默认密钥`);
    } catch (err) {
      notice.error('生成失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 保存当前密钥为默认
  const saveDefault = () => {
    if (publicPem.trim() === '' && privatePem.trim() === '') {
      notice.warning('请先生成或粘贴密钥');
      return;
    }
    setDefaultPublicKey(publicPem.trim());
    setDefaultPrivateKey(privatePem.trim());
    notice.success('已保存为默认密钥 (重新打开页面将自动进入「加解密」)');
  };

  const exportPem = async (which :'public' | 'private') => {
    const pem = which === 'public' ? publicPem : privatePem;
    if (pem.trim() === '') { notice.warning('没有可导出的密钥, 请先生成'); return; }
    const ok = await saveTextFile(`rsa-${keyBits}-${which}.pem`, pem, '保存密钥文件');
    if (ok) notice.success('密钥已保存');
  };

  // 加密: 明文区 -> 密文区 (需要公钥)
  const doEncrypt = async () => {
    if (publicPem.trim() === '') {
      notice.warning('未配置公钥, 请先在「密钥管理」生成密钥对或在设置中配置默认公钥');
      setActiveTab('manage');
      return;
    }
    if (plainValue.trim() === '') { notice.warning('请输入需要加密的明文'); return; }
    if (!rsaAvailable()) { notice.error('当前环境不支持 WebCrypto'); return; }
    setLoading(true);
    try {
      setCipherValue(await rsaEncryptText(publicPem.trim(), plainValue));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 解密: 密文区 -> 明文区 (需要私钥)
  const doDecrypt = async () => {
    if (privatePem.trim() === '') {
      notice.warning('未配置私钥, 请先在「密钥管理」生成密钥对或在设置中配置默认私钥');
      setActiveTab('manage');
      return;
    }
    if (cipherValue.trim() === '') { notice.warning('请输入需要解密的密文 (Base64)'); return; }
    if (!rsaAvailable()) { notice.error('当前环境不支持 WebCrypto'); return; }
    setLoading(true);
    try {
      setPlainValue(await rsaDecryptText(privatePem.trim(), cipherValue));
    } catch (err) {
      notice.error('解密失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setPlainValue('');
    setCipherValue('');
  };

  // 密钥管理 Tab
  const manageTab = (
    <div>
      <Space wrap style={ { margin: "8px 0" } }>
        <Select
          value={ keyBits }
          onChange={ (v) => setKeyBits(v) }
          style={ { width: 140 } }
          options={ [2048, 3072, 4096].map((n) => ({ label: `RSA-${n}`, value: n })) }
        />
        <Button type="primary" icon={ <KeyOutlined /> } onClick={ generate } loading={ loading }>生成密钥对</Button>
        <Button icon={ <SafetyCertificateOutlined /> } onClick={ saveDefault }>保存为默认密钥</Button>
      </Space>
      <div style={ { color: "#999", marginBottom: 8 } }>
        生成后自动保存为默认密钥; 已配置默认密钥时重新打开本页将自动进入「加解密」, 也可在 设置 → 加解密 中预先配置。
      </div>

      <div style={ { fontWeight: 600 } }>公钥 (SPKI PEM) <span style={ { color: "#999", fontWeight: 400 } }>用于加密</span></div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace", fontSize: 12 } }
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
        style={ { margin: "4px 0", fontFamily: "monospace", fontSize: 12 } }
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
    </div>
  );

  // 加解密 Tab (Base64/AES 风格双区)
  const cryptoTab = (
    <div>
      <div style={ { margin: "8px 0", background: "rgba(128,128,128,0.08)", padding: "8px 12px", borderRadius: 6 } }>
        <div>当前公钥: { publicPem.trim() === '' ? <span style={ { color: "#dc3545" } }>未配置</span> : <span style={ { fontFamily: "monospace", fontSize: 12 } }>{ pemSummary(publicPem) }</span> }</div>
        <div style={ { marginTop: 4 } }>当前私钥: { privatePem.trim() === '' ? <span style={ { color: "#dc3545" } }>未配置</span> : <span style={ { fontFamily: "monospace", fontSize: 12 } }>{ pemSummary(privatePem) }…</span> } <span style={ { color: "#999" } }>(摘要)</span></div>
      </div>

      <TextArea
        style={ { margin: "4px 0" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setPlainValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ plainValue }
        placeholder="输入需要加密的明文 (UTF-8, 超过 190 字节会自动分段)  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setPlainValue); } }
      />

      <Space style={ { margin: "4px 0" } }>
        <Button
          onClick={ doEncrypt }
          style={ { backgroundColor: "#007bff", color: "#fff" } }
          icon={ <ArrowDownOutlined /> }
          loading={ loading }
        >加密 (公钥)</Button>
        <Button
          onClick={ doDecrypt }
          style={ { backgroundColor: "#28a745", color: "#fff" } }
          icon={ <ArrowUpOutlined /> }
          loading={ loading }
        >解密 (私钥)</Button>
        <Button
          onClick={ clear }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
        >清除</Button>
      </Space>

      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace", fontSize: 12 } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setCipherValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ cipherValue }
        placeholder="密文 (Base64, 每段 = 密钥模长) 加密后自动显示在此; 也可粘贴外部工具的密文后点「解密」  或 拖拽文件到框内打开"
        autoSize={{ minRows: 6, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setCipherValue); } }
      />

      { loading && (
        <div style={ { textAlign: "center", margin: "8px 0" } }><Spin size="small" /></div>
      ) }
    </div>
  );

  return (
    <div>
      { contextHolder }

      <Tabs
        activeKey={ activeTab }
        onChange={ setActiveTab }
        items={ [
          { key: 'manage', label: '密钥管理', children: manageTab },
          { key: 'crypto', label: '加解密', children: cryptoTab },
        ] }
      />

      <Divider> RSA 说明 </Divider>
      <RSAIntro />
    </div>
  );
}

export default RSACrypto;
