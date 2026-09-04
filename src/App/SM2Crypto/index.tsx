import { Button, Divider, Input, Space, Tabs, message } from "antd";
import { useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { saveTextFile } from "../../lib/tauri"
import { openFile } from "../../lib/file"
import {
  generateSm2KeyPair, derivePublicKey, sm2EncryptText, sm2DecryptText,
  getDefaultPublicKey, setDefaultPublicKey,
  getDefaultPrivateKey, setDefaultPrivateKey, hasDefaultKeyPair,
} from "./lib"
import SM2Intro from "./intro"

const SM2Crypto = () => {

  // 默认密钥对已配置 -> 自动进入「加解密」, 否则进入「密钥管理」
  const [ activeTab, setActiveTab ] = useState<string>(hasDefaultKeyPair() ? 'crypto' : 'manage');

  const [ publicKey, setPublicKey ] = useState(getDefaultPublicKey());
  const [ privateKey, setPrivateKey ] = useState(getDefaultPrivateKey());
  const [ plainValue, setPlainValue ] = useState('');  // 明文区 (加密输入 / 解密输出)
  const [ cipherValue, setCipherValue ] = useState(''); // 密文区 (解密输入 / 加密输出)
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

  const isPriValid = (v :string) :boolean => /^[0-9a-fA-F]{64}$/.test(v.trim());
  const isPubValid = (v :string) :boolean => /^04[0-9a-fA-F]{128}$/.test(v.trim());

  // 生成密钥对并自动保存为默认
  const generate = () => {
    const pair = generateSm2KeyPair();
    setPrivateKey(pair.privateKey);
    setPublicKey(pair.publicKey);
    setDefaultPrivateKey(pair.privateKey);
    setDefaultPublicKey(pair.publicKey);
    notice.success('SM2 密钥对生成成功, 已保存为默认密钥');
  };

  // 由私钥推导公钥
  const derive = () => {
    try {
      if (!isPriValid(privateKey)) {
        notice.warning('私钥需为 64 位 HEX');
        return;
      }
      const pub = derivePublicKey(privateKey.trim());
      setPublicKey(pub);
      setDefaultPublicKey(pub);
      notice.success('已由私钥推导出公钥并保存为默认公钥');
    } catch (err) {
      notice.error('推导失败: ' + (err as Error).message);
    }
  };

  // 保存当前密钥为默认
  const saveDefault = () => {
    if (publicKey.trim() === '' && privateKey.trim() === '') {
      notice.warning('请先生成或粘贴密钥');
      return;
    }
    setDefaultPublicKey(publicKey.trim());
    setDefaultPrivateKey(privateKey.trim());
    notice.success('已保存为默认密钥 (重新打开页面将自动进入「加解密」)');
  };

  const exportKey = async (which :'public' | 'private') => {
    const content = which === 'public' ? publicKey : privateKey;
    if (content.trim() === '') { notice.warning('没有可导出的密钥, 请先生成'); return; }
    const ok = await saveTextFile(`sm2-${which}.txt`, content.trim(), '保存密钥文件');
    if (ok) notice.success('密钥已保存');
  };

  // 加密: 明文区 -> 密文区 (需要公钥)
  const doEncrypt = () => {
    if (publicKey.trim() === '') {
      notice.warning('未配置公钥, 请先在「密钥管理」生成密钥对或在设置中配置默认公钥');
      setActiveTab('manage');
      return;
    }
    if (!isPubValid(publicKey)) { notice.warning('公钥需为 04||X||Y 未压缩格式 (130 位 HEX)'); return; }
    if (plainValue.trim() === '') { notice.warning('请输入需要加密的明文'); return; }
    try {
      setCipherValue(sm2EncryptText(plainValue, publicKey.trim()));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    }
  };

  // 解密: 密文区 -> 明文区 (需要私钥)
  const doDecrypt = () => {
    if (privateKey.trim() === '') {
      notice.warning('未配置私钥, 请先在「密钥管理」生成密钥对或在设置中配置默认私钥');
      setActiveTab('manage');
      return;
    }
    if (!isPriValid(privateKey)) { notice.warning('私钥需为 64 位 HEX'); return; }
    if (cipherValue.trim() === '') { notice.warning('请输入需要解密的密文 (HEX)'); return; }
    try {
      setPlainValue(sm2DecryptText(cipherValue.trim(), privateKey.trim()));
    } catch (err) {
      notice.error('解密失败: ' + (err as Error).message);
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
        <Button type="primary" icon={ <KeyOutlined /> } onClick={ generate }>生成密钥对</Button>
        <Button icon={ <SafetyCertificateOutlined /> } onClick={ saveDefault }>保存为默认密钥</Button>
      </Space>
      <div style={ { color: "#999", marginBottom: 8 } }>
        生成后自动保存为默认密钥; 已配置默认密钥时重新打开本页将自动进入「加解密」, 也可在 设置 → 加解密 中预先配置。
      </div>

      <div style={ { fontWeight: 600 } }>公钥 (04‖X‖Y, 130 位 HEX) <span style={ { color: "#999", fontWeight: 400 } }>用于加密</span></div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace", fontSize: 12 } }
        onChange={ (e) => setPublicKey(e.target.value) }
        onDoubleClick={ textareaDoubleClick }
        value={ publicKey }
        placeholder="生成后自动填充 (04 开头, 130 位 HEX), 也可粘贴其他工具导出的公钥"
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
      <Space style={ { margin: "4px 0 8px 0" } }>
        <Button size="small" onClick={ () => copy(publicKey, '公钥') }>复制公钥</Button>
        <Button size="small" onClick={ () => exportKey('public') }>导出公钥到文件</Button>
      </Space>

      <div style={ { fontWeight: 600 } }>私钥 (d, 64 位 HEX) <span style={ { color: "#999", fontWeight: 400 } }>用于解密, 请保密</span></div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace", fontSize: 12 } }
        onChange={ (e) => setPrivateKey(e.target.value) }
        onDoubleClick={ textareaDoubleClick }
        value={ privateKey }
        placeholder="生成后自动填充 (64 位 HEX), 也可粘贴其他工具导出的私钥"
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
      <Space style={ { margin: "4px 0 8px 0" } }>
        <Button size="small" onClick={ () => copy(privateKey, '私钥') }>复制私钥</Button>
        <Button size="small" onClick={ () => exportKey('private') }>导出私钥到文件</Button>
        <Button size="small" onClick={ derive }>从私钥推导公钥</Button>
      </Space>
    </div>
  );

  // 加解密 Tab (Base64/AES 风格双区)
  const cryptoTab = (
    <div>
      <div style={ { margin: "8px 0", background: "rgba(128,128,128,0.08)", padding: "8px 12px", borderRadius: 6 } }>
        <div>当前公钥: { publicKey.trim() === '' ? <span style={ { color: "#dc3545" } }>未配置</span> : <span style={ { fontFamily: "monospace", fontSize: 12 } }>{ publicKey.trim().slice(0, 28) }…</span> }</div>
        <div style={ { marginTop: 4 } }>当前私钥: { privateKey.trim() === '' ? <span style={ { color: "#dc3545" } }>未配置</span> : <span style={ { fontFamily: "monospace", fontSize: 12 } }>{ privateKey.trim().slice(0, 16) }…</span> } <span style={ { color: "#999" } }>(摘要)</span></div>
      </div>

      <TextArea
        style={ { margin: "4px 0" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setPlainValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ plainValue }
        placeholder="输入需要加密的明文 (UTF-8, 任意长度)  或 拖拽文件到框内打开"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setPlainValue); } }
      />

      <Space style={ { margin: "4px 0" } }>
        <Button
          onClick={ doEncrypt }
          style={ { backgroundColor: "#007bff", color: "#fff" } }
          icon={ <ArrowDownOutlined /> }
        >加密 (公钥)</Button>
        <Button
          onClick={ doDecrypt }
          style={ { backgroundColor: "#28a745", color: "#fff" } }
          icon={ <ArrowUpOutlined /> }
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
        placeholder="密文 (HEX, C1C3C2) 加密后自动显示在此; 也可粘贴 sm-crypto 等工具的 C1C3C2 密文 (兼容带 04 前缀) 后点「解密」  或 拖拽文件到框内打开"
        autoSize={{ minRows: 6, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setCipherValue); } }
      />
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

      <Divider> SM2 说明 </Divider>
      <SM2Intro />
    </div>
  );
}

export default SM2Crypto;
