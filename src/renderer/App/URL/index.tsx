import { Checkbox, Divider, Button,Input, Space, message, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { default as URLIntro } from "./intro"

const URL = () => {

  const tips = ``;

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ safe, setSafe ] = useState(false);
  const [notice, contextHolder] = message.useMessage();

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    copyTextToClipboard((e.target as HTMLInputElement).value);
    notice.success( "复制到粘贴板成功！！！");
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
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setEncodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { encodeValue }
        placeholder="需要进行 URL 编码的内容"
        autoSize={{ minRows: 5}}
      />

      <Space direction="vertical" style={ { "margin" : "5px 0 5px 0"} }>
        <Space wrap>
          <Button 
            onClick={ encode(encodeURIComponent) }
            style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
            icon={<ArrowDownOutlined />}
          >encodeURIComponent 编码</Button>
          <Button 
            onClick={ decode(decodeURIComponent) }
            style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
            icon={<ArrowUpOutlined />}
          >decodeURIComponent 解码</Button>
          &nbsp;
          <Button 
            onClick={ encode(encodeURI) }
            style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
            icon={<ArrowDownOutlined />}
          >encodeURI 编码</Button>
          <Button 
            onClick={ decode(decodeURI) }
            style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
            icon={<ArrowUpOutlined />}
          >decodeURI 解码</Button>
          
        </Space>
      </Space>
  
      <TextArea
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="需要进行 URL 解码的内容"
        autoSize={{ minRows: 5}}
      />
      
      <Divider> URL 编码说明 </Divider>

      <URLIntro />
    </div>
  );
}

export default URL;