import { Divider, Button,Input, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { convertCurrency } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const RMBConvert = () => {

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
    let v = value.trim()
    setValue(v);
    if ( v != "") {
      // 去掉空格 去掉 `,` (有使用 ,做分隔展示的情况 )
      v = v.replace(/,/g,'').replace(/\s/g,'');
      // 判断是否是 全数字
      if(/^[0-9\.]+$/.test(v)) {
        setResult(convertCurrency(v));
        setStatus('');
      } else {
        setStatus('error');
        setResult('');
      }
    } else {
      setStatus('');
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
        onChange={ (e) => { encode(e.target.value) ;} }
        title="双击复制内容到粘贴板"
        value= { value }
        placeholder="请输入要转换的人民币金额"
        autoSize={{ minRows: 5, maxRows: 5 }}
        maxLength={ 30 }
      />

      <Divider>转换的结果</Divider>
      
      <TextArea
        readOnly 
        style={ { margin: "5px 0 5px 0" }}
        title="点击复制内容到粘贴板"
        onClick={ textareaDoubleClick }
        value= { result }
        placeholder="点击复制内容到粘贴板"
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

    </div>
  );
}

export default RMBConvert;