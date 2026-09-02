import { Checkbox, Divider, Button,Input, Space, message, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { default as Base58Intro } from "./intro"
import { Base58Encode, Base58Decode } from "./lib"

const Base58Codec = () => {

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const encode = () => {
    if (encodeValue.trim() != "") {
      setDecodeValue( Base58Encode(encodeValue) );
    }
  }

  const decode = () => {
    if (decodeValue.trim() != "") {
      let r = ""
      try {
        r = Base58Decode(decodeValue)
      } catch(err) {
        notice.error("解码失败！！！");
      }
      setEncodeValue(r);
    }
  }

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="输入需要进行 Base58 编码的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button 
        onClick={ encode }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >Base58 编码</Button>
      <Button 
        onClick={ decode }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >Base58 解码</Button>&nbsp;
      <Button 
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>
      
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 Base58 解码的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
      
      <Divider> Base58 编码说明 </Divider>

      <Base58Intro />
    </div>
  );
}

export default Base58Codec;