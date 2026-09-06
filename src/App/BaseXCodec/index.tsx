import { Divider, Button, Input, Space, message, Select } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "./../../lib/file"
import { BaseXEncode, BaseXDecode, getDefaultCode } from "./lib"
import { codeList } from "./data";
import { default as BaseXIntro } from "./intro"

const BaseXCodec = () => {

  const [ code, setCode ] = useState(getDefaultCode());
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
      setDecodeValue( BaseXEncode(encodeValue,code) );
    }
  }

  const decode = () => {
    if (decodeValue.trim() != "") {
      let r = ""
      try {
        r = BaseXDecode(decodeValue,code)
      } catch(err) {
        notice.error("解码失败: " + (err as Error).message);
        return;
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
        placeholder={ `输入需要进行 ${code} 编码的内容  或 拖拽文件到框内打开` }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Space wrap>
        <label>码型:</label>
        <Select
          value={ code }
          style={{ width: 220 }}
          onChange={ (v: string) => { setCode(v); setEncodeValue(''); setDecodeValue(''); } }
          options={ codeList.map((c) => ({ label: c, value: c })) }
        />
        <Button 
          onClick={ encode }
          style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
          icon={<ArrowDownOutlined />}
        >编码</Button>
        <Button 
          onClick={ decode }
          style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
          icon={<ArrowUpOutlined />}
        >解码</Button>&nbsp;
        <Button 
          onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder={ `输入需要进行 ${code} 解码的内容  或 拖拽文件到框内打开` }
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />

      <Divider> BaseX 编码说明 </Divider>

      <BaseXIntro />
    </div>
  );
}

export default BaseXCodec;
