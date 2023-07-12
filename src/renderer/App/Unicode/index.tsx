import { Checkbox, Divider, Button,Input, Space, message, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { default as UnicodeIntro } from "./intro"
import { unicode2Ascii, ascii2Unicode } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import "./unicode.css"

const Unicode = () => {

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ decodeStatus, setDecodeStatus ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const encode = (func :Function) => {
    return () => {
      if (encodeValue.trim() != "") {
        setDecodeValue( func(encodeValue) );
      }
    }
  }

  const decode = (func :Function) => {
    return () => {
      if (decodeValue.trim() != "") {
        let r = ""
        try {
          r = func(decodeValue);
        } catch(err) {
          setDecodeStatus('error');
          notice.error("解码失败！！！");
        }
        setDecodeStatus('');
        setEncodeValue(r);
      }
    }
  }

  return (
    <div>
      {contextHolder}

      <TextArea
        className="textarea"
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="输入需要进行 Unicode 编码的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button 
        onClick={ encode(escape) }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >编码</Button>
      <Button 
        onClick={ decode(unescape) }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >解码</Button>&nbsp;
      <Button 
        onClick={ encode(ascii2Unicode) }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >Ascii 编码</Button>
      <Button 
        onClick={ decode(unicode2Ascii) }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >Ascii 解码</Button>&nbsp;
      <Button 
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>
      
      <TextArea
        className="textarea"
        status={ decodeStatus as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 Unicode 解码的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
      
      <Divider> Unicode 编码说明 </Divider>

      <UnicodeIntro />
    </div>
  );
}

export default Unicode;