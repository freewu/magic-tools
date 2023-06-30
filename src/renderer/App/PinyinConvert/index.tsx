import { Divider, Button,Input, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import { pinyin } from 'pinyin-pro';

const PinyinConvert = () => {

  const [ status, setStatus ] = useState('');
  const [ value, setValue ] = useState('');
  const [ result, setResult ] = useState('');
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const encode = (value :string) => {
    setValue(value);
    if ( value.trim() != "") {
      setResult(pinyin(value));
    } else {
      setResult('');
    }
  }

  return (
    <div>

      {contextHolder}

      <Button 
        onClick={ () => { setValue(''); setResult(''); setStatus(''); } }
        style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
      >清除</Button>

      <TextArea
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { encode(e.target.value); } }
        title="双击复制内容到粘贴板"
        value= { value }
        placeholder="请输入中文"
        autoSize={{ minRows: 5, maxRows: 10 }}
      />

      <Divider dashed plain>转换的结果</Divider>
      
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        title="点击复制内容到粘贴板"
        onClick={ textareaDoubleClick }
        value= { result }
        onChange={ (e) => { setResult(e.target.value); } }
        placeholder="点击复制内容到粘贴板"
        autoSize={{ minRows: 10, maxRows: 10 }}
      />

    </div>
  );
}

export default PinyinConvert;