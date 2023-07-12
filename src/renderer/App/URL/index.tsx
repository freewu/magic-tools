import { Checkbox, Divider, Button,Input, Space, message, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { default as URLIntro } from "./intro"
import "./url.css"

const URL = () => {

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ safe, setSafe ] = useState(false);
  const [notice, contextHolder] = message.useMessage();

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
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
          r = func( decodeValue );
        } catch(err) {
          notice.error("解码失败！！！");
        }
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
        placeholder="输入需要进行 URL 编码的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button 
        onClick={ encode(encodeURIComponent) }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >encodeURIComponent</Button>
      <Button 
        onClick={ decode(decodeURIComponent) }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >decodeURIComponent</Button>
      <Button 
        onClick={ encode(encodeURI) }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >encodeURI</Button>
      <Button 
        onClick={ decode(decodeURI) }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >decodeURI</Button>
      <Button 
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>
  
      <TextArea
        className="textarea"
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要进行 URL 解码的内容  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />
      
      <Divider> URL 编码说明 </Divider>

      <URLIntro />
    </div>
  );
}

export default URL;