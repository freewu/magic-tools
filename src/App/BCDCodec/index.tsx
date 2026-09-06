import { Divider, Button, Input, Space, message, Select } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { BCDEncode, BCDDecode, getDefaultType } from "./lib"
import { codeList } from "./data";
import type { BCDType } from "./data";
import { default as BCDIntro } from "./intro"

const BCDCodec = () => {

  const [ type, setType ] = useState(getDefaultType());
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
    if (encodeValue.trim() == "") return;
    try {
      setDecodeValue( BCDEncode(encodeValue, type) );
    } catch(err) {
      notice.error("编码失败: " + (err as Error).message);
    }
  }

  const decode = () => {
    if (decodeValue.trim() == "") return;
    try {
      setEncodeValue( BCDDecode(decodeValue, type) );
    } catch(err) {
      notice.error("解码失败: " + (err as Error).message);
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
        placeholder="输入十进制数字 (0-9, 可用空格/换行分隔) 进行 BCD 编码"
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Space wrap>
        <label>码型:</label>
        <Select
          value={ type }
          style={{ width: 150 }}
          onChange={ (v: string) => { setType(v as BCDType); setEncodeValue(''); setDecodeValue(''); } }
          options={ codeList }
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
        placeholder="输入 BCD 码串 (0/1, 每 4 位一组可用空格分组) 进行解码"
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Divider> BCD 编解码说明 </Divider>

      <BCDIntro />
    </div>
  );
}

export default BCDCodec;