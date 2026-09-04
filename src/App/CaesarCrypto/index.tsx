import { Button, Divider, Input, InputNumber, Space, message } from "antd";
import { useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { caesarEncrypt, caesarDecrypt, hasLetters, getDefaultShift } from "./lib"
import CaesarIntro from "./intro"

const CaesarCrypto = () => {

  const [ shift, setShift ] = useState<number | null>(getDefaultShift()); // 位移量
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

  const doEncrypt = () => {
    if (shift === null || !Number.isInteger(shift)) { notice.warning('请输入位移量 (整数)'); return; }
    if (plainValue === '') { notice.warning('请输入需要加密的明文'); return; }
    if (!hasLetters(plainValue)) { notice.warning('输入中未包含英文字母, 加密结果将与原文相同'); return; }
    try {
      setCipherValue(caesarEncrypt(plainValue, shift));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    }
  };

  const doDecrypt = () => {
    if (shift === null || !Number.isInteger(shift)) { notice.warning('请输入位移量 (整数)'); return; }
    if (cipherValue.trim() === '') { notice.warning('请输入需要解密的密文'); return; }
    try {
      setPlainValue(caesarDecrypt(cipherValue, shift));
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
        <span>位移量 (右移, 负数向左):</span>
        <InputNumber
          value={ shift }
          min={ -25 }
          max={ 25 }
          onChange={ (v) => setShift(v) }
          placeholder="3"
          style={ { width: 140 } }
        />
        <span style={ { color: "#999" } }>仅对英文字母循环位移, 中文 / 数字 / 符号原样保留</span>
      </Space>

      <div style={ { fontWeight: 600, color: "#555" } }>明文区 (加密输入 / 解密输出)</div>
      <TextArea
        style={ { margin: "4px 0" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setPlainValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ plainValue }
        placeholder="输入需要加密的明文, 例如 Hello, World!  或 拖拽文件到框内打开"
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

      <Divider> 凯撒密码说明 </Divider>
      <CaesarIntro />
    </div>
  );
}

export default CaesarCrypto;
