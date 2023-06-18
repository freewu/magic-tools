import { Radio, Divider, Checkbox, Input, Space, Row, Button, message } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import type { RadioChangeEvent } from 'antd';
import { typeList } from "./data"
import { openFile } from "../../lib/file"
import { copyTextToClipboard } from "./../../lib"
import "./base64-image.css"

const Base64Image = () => {

  const [ value, setValue ] = useState(''); // base64编码的图片
  const [ type, setType ] = useState('img'); // 使用场景 img / css / base64 (只显示 base64)
  const [ result, setResult ] = useState(''); // 最后的结果
  const [ width, setWidth ] = useState(''); // 设置 img 图片宽度  type = img 有效
  const [ height, setHeight ] = useState(''); // 设置 img 图片高度 type = img 有效
  const [ alt, setAlt ] = useState(''); // 设置图片说明文字 type = img 有效
  const [ showData, setShowData ] = useState(true); // 是否显示 Data 头 type = none 有效 data:image/jpg;base64
  const [ notice, contextHolder] = message.useMessage();

  const resultClick = (e :React.MouseEvent<HTMLElement>) => {
    if(result != "") {
      copyTextToClipboard(result);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  // 生成输出结果
  const genResult = (v :string, type:string,w :string,h :string,alt :string,showData :boolean) => {
    if(v === '') return;
    switch(type) {
      case "base64":
        return setResult(showData? "data:image/png;base64," + v : v);
      case "css":
        return setResult(`url("${v}");`);
      case "img":
        let p = "";
        if(w != "") p += `width="${w}" `;
        if(h != "") p += `heigth="${h}" `;
        if(alt != "") p += `alt="${alt}"`;
        return setResult(`<img ${ p.trim() } src="${v}" />`);
    } 
  }

  return (
    <>
      { contextHolder }
      <TextArea
        readOnly
        style={ { margin: "5px 0 5px 0" }}
        showCount
        onChange={ (e) => { setValue(e.target.value); } }
        value= { result }
        placeholder="拖拽要生成 Base64 编码的图片文件到框内"
        autoSize={{ minRows: 8, maxRows: 8 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { 
          e.preventDefault(); 
          const files = e.dataTransfer.files;
          if(0 === files.length) {
            // notice.error("请选择文件！！！");
            return;
          }
          // todo 判断文件类型
          const reader = new FileReader();
          // 加载失败
          reader.onerror = (err) => {
            console.log(err);
          }
          // 文件加载完毕
          reader.onload = () => {
            setValue(reader.result as string);
            genResult(reader.result as string,type,width,height,alt,showData);
          }
          reader.readAsDataURL(files[0]);
        } }
        title="点击复制内容到粘贴板"
        onClick={ resultClick }
      />
      <Row style = { { marginTop: 5 }}>
        <Space>
          <Radio.Group 
            optionType="button" buttonStyle="solid"
            options={ typeList } 
            onChange={ (e) => { 
              setType(e.target.value);
              genResult(value,e.target.value,width,height,alt,showData);
            } } 
            value={ type } 
          />
          {/* <Checkbox
            disabled= { type !== 'base64' }
            onChange={ (e) => {  
              setShowData(!showData);
              genResult(value,type,width,height,alt,!showData);
            } } 
            checked={ showData }>
            展示 data: 
          </Checkbox> */}
          <Button 
            onClick={ () => { setValue(''); setResult(''); } }
            style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
          >清除</Button>
        </Space>
      </Row>

      <Row style = { { marginTop: 12 }}>
        <Space>
          <label>宽度:</label>
          <Input 
            disabled= { type !== 'img'}
            placeholder="width"
            allowClear
            maxLength={ 4 }
            style={ { width: 120 } }
            onChange={ (e) => { 
              const v = e.target.value.trim();
              if(/^\d+$/.test(v) || v === '') {
                setWidth(v);
                genResult(value,type,v,height,alt,showData);
              }
            } }
            value= { width } />
          <label>高度:</label>
          <Input 
            disabled= { type !== 'img'}
            placeholder="height"
            allowClear
            maxLength={ 4 }
            style={ { width: 120 } }
            onChange={ (e) => { 
              const v = e.target.value.trim();
              if(/^\d+$/.test(v) || v === '' ) {
                setHeight(v);
                genResult(value,type,width,v,alt,showData);
              }
            } }
            value= { height } />
          <label>说明:</label>
          <Input 
            disabled= { type !== 'img'}
            placeholder="alt"
            allowClear
            maxLength={ 50 }
            style={ { width: 420 } }
            onChange={ (e) => {
              const v = e.target.value.trim();
              setAlt(v);
              genResult(value,type,width,height,v,showData);
            } }
            value= { alt } />
        </Space>
      </Row>
      <Divider dashed plain>预览</Divider>

      { value.trim() !== ''?
       (
        <div className="preview" onClick = { resultClick } title="点击复制内容到粘贴板">
          <img src={ value } width={ width } height={ height } alt={ alt } />
        </div>
      ): null}
    </>
  );
}

export default Base64Image;