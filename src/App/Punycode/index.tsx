import { Divider, Button, Input, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { default as PunycodeIntro } from "./intro"
import { encodeText, decodeText } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const Punycode = () => {

  const [ sourceValue, setSourceValue ] = useState('');
  const [ targetValue, setTargetValue ] = useState('');
  const [ sourceStatus, setSourceStatus ] = useState<InputStatus>('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  // Unicode -> Punycode (编码)
  const encode = () => {
    if (sourceValue.trim() === '') return;
    try {
      setTargetValue( encodeText(sourceValue) );
      setSourceStatus('');
    } catch(err) {
      setSourceStatus('error');
      notice.error("编码失败！！！");
    }
  }

  // Punycode -> Unicode (解码)
  const decode = () => {
    if (targetValue.trim() === '') return;
    try {
      setSourceValue( decodeText(targetValue) );
      setSourceStatus('');
    } catch(err) {
      setSourceStatus('error');
      notice.error("解码失败: 输入不是有效的 Punycode 文本！！！");
    }
  }

  const clear = () => {
    setSourceValue('');
    setTargetValue('');
    setSourceStatus('');
  }

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setSourceValue(e.target.value); } }
        title="双击复制内容到粘贴板"
        value= { sourceValue }
        placeholder="输入需要编码为 Punycode 的文本 (如: 中文、中文.中国、bücher.de)  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setSourceValue ); } }
      />

      <Button 
        onClick={ encode }
        style={ {"backgroundColor" : "#007bff","color": "#fff" }} 
        icon={<ArrowDownOutlined />}
      >编码</Button>&nbsp;
      <Button 
        onClick={ decode }
        style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
        icon={<ArrowUpOutlined />}
      >解码</Button>&nbsp;
      <Button 
        onClick={ clear }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>
      
      <TextArea
        status={ sourceStatus as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setTargetValue(e.target.value); } }
        title="双击复制内容到粘贴板"
        value= { targetValue }
        placeholder="输入需要解码的 Punycode 文本 (如: xn--fiq228c、xn--fiq228c.xn--fiqs8s、xn--bcher-kva.de)  或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setTargetValue ); } }
      />
      
      <Divider> Punycode 编码说明 </Divider>

      <PunycodeIntro />
    </div>
  );
}

export default Punycode;