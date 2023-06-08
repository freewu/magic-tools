// 内容统计页
import { Button,Input, Space, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import { calcLineCount, removeEmptyLine } from "./lib"

const ContentCount = () => {
  let inputElement :HTMLInputElement;
  const [ value, setValue ] = useState(''); // 输入的文本
  const [ lineCount, setLineCount ] = useState(0); // 行数
  const [ start, setStart ] = useState(''); // 开始行
  const [ startStatus, setStartStatus ] = useState(''); // 开始行状态
  const [ end, setEnd ] = useState(''); // 结束行
  const [ endStatus, setEndStatus ] = useState(''); // 结束行状态
  const [ notice, contextHolder] = message.useMessage();

  const copyContent = (value :string) => {
    copyTextToClipboard(value);
    notice.success("选取内容已复制到粘贴板!!!");
  }

  const onStartChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if('NaN' === v.toString()) return setStart('');
    // 开始行不能是最后一行
    setStartStatus((v >= lineCount)? 'error': '');
    setStart(v.toString());
  }

  const onEndChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if('NaN' === v.toString()) return setEnd('');

    // 不能大于最后一行 或 不能小于等开始行
    if((v > lineCount) ||  ( start !== '' && v <= parseInt(start) ) ) {
      setEndStatus('error');
    } else {
      setEndStatus('');
    }
    setEnd(v.toString());
  }

  // 提取内容
  const pickContent = () => {
    if(value.trim() === '') return ;
    // start & end 都为空说明提取全部 
    if('' === start && '' === end) return copyContent(value);
    // 如果 start 为空说明提取从第一行开始
    const s = (start === '')? 1 : parseInt(start);
    // 如果 end 为空说明提取到最后
    const e = (end === '')? lineCount : parseInt(end);
    // arr = split value 值 
    const arr = value.split("\n");
    let r = [];
    let c = s - 1;
    // 取从 arr[start - 1] 到 arr[end - 1] 的内容
    while (c < e) {
      r.push(arr[c]);
      c++;
    }
    // 保存到粘贴板上
    copyContent(r.join("\n"));
  }

  // 打开本地文件 
  const fileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files || [];
    openFile(files);
  };

  const openFile = (files: any) => {
    if(0 === files.length) {
      // notice.error("请选择文件！！！");
      return;
    }
    const reader = new FileReader();
    // 加载失败
    reader.onerror = (err) => {
      console.log(err);
    }
    // 文件加载完毕
    reader.onload = () => {
      setValue(reader.result as string);
      setLineCount(calcLineCount(reader.result as string));
    }
    reader.readAsText(files[0]);
  }
  
  return (
    <div>
      {contextHolder}

      <Space>

        <span>
          <label>行数:</label> { lineCount }
        </span>
        <span>
          <label>字符数:</label> { value.length }
        </span>
        |
        <Button
          onClick={ () => { setLineCount(0); setValue('') } }
          style={ { backgroundColor: "#dc3545", color: "#fff" } } 
        >清除</Button>
        |
        <Button 
          onClick={ () => { let v = removeEmptyLine(value); setValue(v); setLineCount(calcLineCount(v)); } }
          style={ { backgroundColor: "#28a745", color: "#fff" } } 
        >去除空行</Button>
        |
        {/* <Button 
          onClick={ () => { setValue(removeEmptyLine(value)) } }
          style={ { backgroundColor: "#28a745", color: "#fff" } } 
        >去除注释</Button>
        | */}
        <Input
          status={ startStatus as InputStatus }
          style={ { width: "80px" }}
          placeholder="开始行数"
          value={ start } 
          onChange={ onStartChange } /> 
        ~ 
        <Input
          status={ endStatus as InputStatus }
          style={ { width: "80px" }}
          placeholder="结束行数"
          value={ end } 
          onChange={ onEndChange } />
        <Button 
          onClick={ pickContent }
          style={ { backgroundColor: "#007bff", color: "#fff" } } 
        >提取内容</Button>
        | 
        <Button 
          onClick={ ()=> { inputElement?.click() } }
          style={ { backgroundColor: "#007bff", color: "#fff" } } 
        >打开文件</Button>
        <input 
          onChange={ fileChange }
          ref={ input => inputElement = input as HTMLInputElement }
          type="file" id="fileInput" style={ { display: 'none'}} />
      </Space>

      <TextArea
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files); } }
        style={ { margin: "12px 0 5px 0" }}
        onChange={ (e) => { setValue(e.target.value); setLineCount(calcLineCount(e.target.value)); } }
        value= { value }
        placeholder="输入需要统计的内容"
        autoSize={{ minRows: 26, maxRows: 26 }}
      />
    </div>
  );
}

export default ContentCount;