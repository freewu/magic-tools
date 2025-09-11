import { Select, Divider, Button,Input, Space, message,Row, Col } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { Collapse } from 'antd';
const { Panel } = Collapse;


const RSACrypto = () => {

  const [ notice, contextHolder ] = message.useMessage();
  const [ encodeValue, setEncodeValue ] = useState(''); // 要加密的内容
  const [ decodeValue, setDecodeValue ] = useState(''); // 要解密的内容

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value;
    if (txt.trim() !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  // 公钥加密处理
  const encode = () => {
    try {
    } catch (error) {
      console.log(error);
    }
  };

  // 私钥解密处理 
  const decode = () => {
    try {

    } catch (error) {
      console.log(error);
      //notice.error(e);
    }
  };

  return (
    <div>
      { contextHolder }
      <Collapse ghost={ true }>
        <Panel header="设置公钥&私钥" key="1">
          <Button 
            onClick={ encode }
            style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
            icon={<PlayCircleOutlined />}
          >生成秘钥</Button>
          <Divider plain>公钥</Divider>
          <TextArea
            style={ { margin: "5px 0 5px 0" }}
            onDoubleClick={ textareaDoubleClick }
            onChange={ (e) => { setEncodeValue(e.target.value) } }
            title="双击复制内容到粘贴板"
            value= { encodeValue }
            placeholder="输入需要进行 RSA 公钥加密的内容  或 拖拽文件到框内打开"
            autoSize={{ minRows: 8, maxRows: 8 }}
            onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
            onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
          />
          <Divider plain>私钥</Divider>
          <TextArea
            style={ { margin: "5px 0 5px 0" }}
            onDoubleClick={ textareaDoubleClick }
            onChange={ (e) => { setEncodeValue(e.target.value) } }
            title="双击复制内容到粘贴板"
            value= { encodeValue }
            placeholder="输入需要进行 RSA 公钥加密的内容  或 拖拽文件到框内打开"
            autoSize={{ minRows: 8, maxRows: 8 }}
            onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
            onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
          />
        </Panel>
        <Panel header="加解密操作" key="2">
          <TextArea
            style={ { margin: "5px 0 5px 0" }}
            onDoubleClick={ textareaDoubleClick }
            onChange={ (e) => { setEncodeValue(e.target.value) } }
            title="双击复制内容到粘贴板"
            value= { encodeValue }
            placeholder="输入需要进行 RSA 公钥加密的内容  或 拖拽文件到框内打开"
            autoSize={{ minRows: 2, maxRows: 2 }}
            onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
            onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
          />

          <Button 
            onClick={ encode }
            style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
            icon={<ArrowDownOutlined />}
          >公钥加密</Button>
          <Button 
            onClick={ decode }
            style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
            icon={<ArrowUpOutlined />}
          >私钥解密</Button>
          <Button 
            onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
            style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
          >清除</Button>

          <TextArea
            style={ { margin: "5px 0 5px 0" }}
            onDoubleClick={ textareaDoubleClick }
            onChange={ (e) => { setDecodeValue(e.target.value) } }
            title="双击复制内容到粘贴板"
            value= { decodeValue }
            placeholder="输入需要进行 RSA 私钥解密的内容  或 拖拽文件到框内打开"
            autoSize={{ minRows: 8, maxRows: 8 }}
            onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
            onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
          />
        </Panel>
      </Collapse>
    </div>
  )
}
export default RSACrypto;