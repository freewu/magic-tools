import { Divider, Button,Input, message, Checkbox,Space } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import { pinyin } from 'pinyin-pro';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { getDefaultShowTone } from './lib';
import { openFile } from "../../lib/file"
import "./pinyin-convert.css"

const PinyinConvert = () => {

  const [ status, setStatus ] = useState('');
  const [ value, setValue ] = useState('');
  const [ result, setResult ] = useState('');
  const [ showTone, setShowTone ] = useState(getDefaultShowTone()); // 是否显示声调
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const convert = (data :string, show :boolean)  => {
    setResult(pinyin(data,{ toneType: (show)? 'symbol' : 'none'}));
  }

  const encode = (value :string) => {
    setValue(value);
    if ( value.trim() != "") {
      convert(value,showTone);
    } else {
      setResult('');
    }
  }

  const onShowToneChange = (e :CheckboxChangeEvent) => {
    setShowTone(!showTone);
    if(value.trim() !== '') {
      convert(value,!showTone);
    }
  };

  return (
    <div>

      {contextHolder}

      <Space>
        <Button 
          onClick={ () => { setValue(''); setResult(''); setStatus(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
        <Checkbox onChange={ onShowToneChange } checked={ showTone }>是否显示声调</Checkbox>
      </Space>


      <TextArea
        className="textarea"
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { encode(e.target.value); } }
        title="双击复制内容到粘贴板"
        value= { value }
        placeholder="请输入中文或拖拽要转换的文本文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 10 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, encode ); } }
      />

      <Divider dashed plain>转换的结果</Divider>
      
      <TextArea
        className="textarea"
        style={ { margin: "5px 0 5px 0" }}
        title="点击复制内容到粘贴板"
        onClick={ textareaDoubleClick }
        value= { result }
        placeholder="点击复制内容到粘贴板"
        autoSize={{ minRows: 10, maxRows: 10 }}
      />

    </div>
  );
}

export default PinyinConvert;