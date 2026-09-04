import { Button, Divider, Input, Space, message } from "antd";
import { useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { vigenereEncrypt, vigenereDecrypt, vigenereKeyValid, getDefaultKey } from "./lib"
import VigenereIntro from "./intro"

const VigenereCrypto = () => {

  const [ key, setKey ] = useState(getDefaultKey()); // 密钥
  const [ keyStatus, setKeyStatus ] = useState('' as 'error' | '');
  const [ plainValue, setPlainValue ] = useState('');  // 明文区 (加密输入 / 解密输出)
  const [ cipherValue, setCipherValue ] = useState(''); // 密文区 (解密输入 / 加密输出)
  const [ notice, contextHolder ] = message.useMessage();

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    const v = (e.target as HTMLTextAreaElement).value;
    if (v.trim() !== '') {
      copyTextToClipboard(v);
      notice.success('内容已复制到粘贴板');
    }
  };

  const onKeyChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setKey(v);
    if (vigenereKeyValid(v)) { // 空或纯英文字母均合法
      setKeyStatus('');
    } else {
      setKeyStatus('error');
    }
  };

  const doEncrypt = () => {
    if (!vigenereKeyValid(key)) { notice.warning('密钥仅支持英文字母'); return; }
    if (key.trim() === '') { notice.warning('请输入密钥'); return; }
    if (plainValue === '') { notice.warning('请输入需要加密的明文'); return; }
    try {
      setCipherValue(vigenereEncrypt(plainValue, key));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    }
  };

  const doDecrypt = () => {
    if (!vigenereKeyValid(key)) { notice.warning('密钥仅支持英文字母'); return; }
    if (key.trim() === '') { notice.warning('请输入密钥'); return; }
    if (cipherValue.trim() === '') { notice.warning('请输入需要解密的密文'); return; }
    try {
      setPlainValue(vigenereDecrypt(cipherValue, key));
    } catch (err) {
      notice.error('解密失败: ' + (err as Error).message);
    }
  };

  const clear = () => {
    setPlainValue('');
    setCipherValue('');
  };

  return (
    <div>
      { contextHolder }

      <Space wrap style={ { margin: "8px 0" } }>
        <span>密钥:</span>
        <Input
          value={ key }
          status={ keyStatus || undefined }
          onChange={ onKeyChange }
          placeholder="英文字母, 例如 LEMON"
          style={ { width: 260, fontFamily: "monospace" } }
          allowClear
        />
        <span style={ { color: "#999" } }>密钥字母循环决定每个明文字母的位移量; 数字 / 符号 / 中文不参与, 原样保留</span>
      </Space>

      <div style={ { fontWeight: 600, color: "#555" } }>明文区 (加密输入 / 解密输出)</div>
      <TextArea
        style={ { margin: "4px 0" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setPlainValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ plainValue }
        placeholder="输入需要加密的明文, 例如 ATTACKATDAWN  或 拖拽文件到框内打开"
        autoSize={{ minRows: 7, maxRows: 7 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setPlainValue); } }
      />

      <Space style={ { margin: "4px 0" } }>
        <Button
          onClick={ doEncrypt }
          style={ { backgroundColor: "#007bff", color: "#fff" } }
          icon={ <ArrowDownOutlined /> }
        >加密</Button>
        <Button
          onClick={ doDecrypt }
          style={ { backgroundColor: "#28a745", color: "#fff" } }
          icon={ <ArrowUpOutlined /> }
        >解密</Button>
        <Button
          onClick={ clear }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
        >清除</Button>
      </Space>

      <div style={ { fontWeight: 600, color: "#555" } }>密文区 (解密输入 / 加密输出)</div>
      <TextArea
        style={ { margin: "4px 0", fontFamily: "monospace" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setCipherValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ cipherValue }
        placeholder="加密结果自动显示在此; 也可粘贴外部密文后点「解密」  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 7 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setCipherValue); } }
      />

      <Divider> 维吉尼亚密码说明 </Divider>
      <VigenereIntro />
    </div>
  );
}

export default VigenereCrypto;
