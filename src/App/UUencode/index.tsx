import { Button, Divider, Input, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { uuEncodeText, uuDecodeText } from "./lib"
import UUIntro from "./intro"

const UUencode = () => {

  const [ encodeValue, setEncodeValue ] = useState('');
  const [ decodeValue, setDecodeValue ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLTextAreaElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const encode = () => {
    try {
      setDecodeValue( uuEncodeText(encodeValue) );
    } catch(err) {
      notice.error("编码失败: " + (err as Error).message);
    }
  }

  const decode = () => {
    try {
      setEncodeValue( uuDecodeText(decodeValue) );
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
        placeholder="输入需要 UUencode 编码的内容"
        autoSize={{ minRows: 5, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
      />

      <Button
        onClick={ encode }
        style={ { "backgroundColor" : "#007bff", "color": "#fff", "marginRight": "8px" } }
        icon={<ArrowDownOutlined />}
      >UUencode 编码</Button>
      <Button
        onClick={ decode }
        style={ { "backgroundColor" : "#28a745", "color": "#fff", "marginRight": "8px" } }
        icon={<ArrowUpOutlined />}
      >UUencode 解码</Button>
      <Button
        onClick={ () => { setEncodeValue(''); setDecodeValue(''); } }
        style={ { "backgroundColor" : "#dc3545", "color": "#fff" } }
      >清除</Button>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setDecodeValue(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { decodeValue }
        placeholder="输入需要 UUencode 解码的内容 (支持带 begin/end 头尾的经典格式)"
        autoSize={{ minRows: 5, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setDecodeValue ); } }
      />

      <Divider> UUencode 编码说明 </Divider>

      <UUIntro />
    </div>
  );
}

export default UUencode;
