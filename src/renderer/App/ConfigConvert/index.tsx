import { Radio, Divider, Button,Input, Space, message, Tabs } from "antd";
import { useState } from "react";
import type { RadioChangeEvent } from 'antd';
const { TextArea } = Input;
import { copyTextToClipboard } from "../../lib"
import { openFile } from "../../lib/file"
import { typeList } from "./data";
import type { InputStatus } from "antd/es/_util/statusUtils";
import { getDefaultInputFormat, getDefaultOutputFormat } from "./lib";
import { ConfigResult } from "./config-result"
import { json2ini, ini2json } from "./lib";
import { json2yaml, yaml2json } from "./lib";
import { json2toml, toml2json } from "./lib";
import { json2xml, xml2json } from "./lib";

const ConfigConvert = () => {

  const [ outputFormat, setOutputFormat ] = useState(getDefaultOutputFormat());
  const [ type, setType ] = useState(getDefaultInputFormat());
  const [ value, setValue ] = useState('');
  const [ result, setResult ] = useState({});
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒
  const [ status, setStatus] = useState('');

  // 切换输入类型
  const onTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setResult({});
  };

  const convert2object = (data :string) => {
    setValue(data);
    try {
      const json = convert2json(data,type);
      setStatus('');
      setResult(json);
    } catch (error) {
      notice.error("解析输入内容出错");
      setStatus('error');
      setResult({});
    }
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  // 先统一转换成 json 再由 json 转换成不同格式
  const convert2json = (data: string ,type :string ) :Object => {
    switch(type) {
      case 'json': return JSON.parse(data);
      case 'ini': return ini2json(data);
      case 'xml': return xml2json(data);
      case 'yaml': return yaml2json(data);
      case 'toml': return toml2json(data);;
      case 'properties': return data;
    }
    return '';
  }

  const convert = (t :string ) :string => {
    const json = result;
    if(JSON.stringify(json) === '{}' || JSON.stringify(json) === '""') return '';

    // 有 json 转其它格式可能出问题错误,不影响全局
    try {
      switch(t) {
        case 'json': return JSON.stringify(json,null,"\t");
        case 'ini': return json2ini(json);
        case 'xml': return json2xml(json);
        case 'yaml': return json2yaml(json);
        case 'toml': return json2toml(json);
        case 'properties': return '';
      }
    } catch (error) {
      console.log(error);
      return '';
    }
    return '';
  }

  // 结果 tabs
  const items = typeList.map ((item) => {
    return {
      key : item.value,
      label : item.label,
      children: <ConfigResult 
                  type={ item.value } 
                  click={ textareaDoubleClick } 
                  data= { convert(item.value) } 
                />,
    }
  });

  return (
    <div>
      {contextHolder}

      <Space>
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { typeList } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setResult(''); setStatus(''); } }
          style={ { backgroundColor : "#dc3545", color: "#fff" }} 
        >清除</Button>
      </Space>

      <TextArea
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { convert2object(e.target.value) } }
        title="双击复制内容到粘贴板"
        value= { value }
        placeholder="输入需要转换的配置内容 或 拖拽配置文件到框内打开"
        autoSize={{ minRows: 10, maxRows: 10 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, convert2object ); } }
      />

      <Divider dashed plain> 转换结果 </Divider>

      <Tabs activeKey={ outputFormat } items={ items } onChange={ (key: string) => { setOutputFormat(key) } } />

    </div>
  );
}

export default ConfigConvert;