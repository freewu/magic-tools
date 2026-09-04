import { Button, Divider, Input, InputNumber, Space, message } from "antd";
import { useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { railFenceEncrypt, railFenceDecrypt, getDefaultRails } from "./lib"
import RailFenceIntro from "./intro"

const RailFenceCrypto = () => {

  const [ rails, setRails ] = useState<number | null>(getDefaultRails()); // 栏数
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
    if (rails === null || !Number.isInteger(rails) || rails < 2) { notice.warning('请输入栏数 (不小于 2 的整数)'); return; }
    if (plainValue === '') { notice.warning('请输入需要加密的明文'); return; }
    try {
      setCipherValue(railFenceEncrypt(plainValue, rails));
    } catch (err) {
      notice.error('加密失败: ' + (err as Error).message);
    }
  };

  const doDecrypt = () => {
    if (rails === null || !Number.isInteger(rails) || rails < 2) { notice.warning('请输入栏数 (不小于 2 的整数)'); return; }
    if (cipherValue.trim() === '') { notice.warning('请输入需要解密的密文'); return; }
    try {
      setPlainValue(railFenceDecrypt(cipherValue, rails));
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
        <span>栏数:</span>
        <InputNumber
          value={ rails }
          min={ 2 }
          max={ 20 }
          onChange={ (v) => setRails(v) }
          placeholder="3"
          style={ { width: 140 } }
        />
        <span style={ { color: "#999" } }>按锯齿形写入 N 栏后逐栏读出, 支持中文等任意字符 (2 栏时即奇偶位分离)</span>
      </Space>

      <div style={ { fontWeight: 600, color: "#555" } }>明文区 (加密输入 / 解密输出)</div>
      <TextArea
        style={ { margin: "4px 0" } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => setPlainValue(e.target.value) }
        title="双击复制内容到粘贴板"
        value={ plainValue }
        placeholder="输入需要加密的明文, 例如 WEAREDISCOVEREDFLEEATONCE  或 拖拽文件到框内打开"
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

      <Divider> 栅栏密码说明 </Divider>
      <RailFenceIntro />
    </div>
  );
}

export default RailFenceCrypto;
