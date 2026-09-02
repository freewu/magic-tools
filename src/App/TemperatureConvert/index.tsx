import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard, debounce } from "./../../lib";
import { pickTypeList, getTypePlaceholder } from "./lib";
import type { RadioChangeEvent } from 'antd';
import { getDefaultType } from "./lib";
import { InputStatus } from "antd/es/_util/statusUtils";
import { c2f,f2c } from "./lib";
import { c2k,k2c } from "./lib";
import { c2n,n2c } from "./lib";
import { c2d,d2c } from "./lib";
import { c2r,r2c } from "./lib";
import { c2Re,re2c } from "./lib";
import { c2Ra,ra2c } from "./lib";

const TemperatureConvert = () => {
  const t = getDefaultType();

  const [ value, setValue ] = useState(''); // 输入数量
  const [ typeList, setTypeList ] = useState(pickTypeList()); // 类型
  const [ status, setStatus ] = useState(''); // 输入是否合法
  const [ type, setType ] = useState(t); // 类型,
  const [ placeholder, setPlaceholder ] = useState(getTypePlaceholder(t)); // 数字类型的输入提示
  const [ data, setData ] = useState(0); // 转换的结果 统一转成 摄氏度 c
  const [ notice, contextHolder] = message.useMessage();

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setTypeList(pickTypeList()) }, 100) );

  const inputStyle = { cursor: "pointer" };

  // 切换类型
  const onTypeChange = ({ target: { value : t } }: RadioChangeEvent) => {
    setType(t);
    setValue('');
    setPlaceholder(getTypePlaceholder(t));
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    if("" == value) {
      setStatus('');
      return ; // 没有内家直接返回不做下面的处理
    }
    if(/^[0-9\.\-]+$/.test(value)) {
      switch(t) {
        case "c": setData(parseFloat(value)); break;
        case "f": setData(f2c(parseFloat(value))); break;
        case "k": setData(k2c(parseFloat(value))); break;
        case "n": setData(n2c(parseFloat(value))); break;
        case "d": setData(d2c(parseFloat(value))); break;
        case "r": setData(r2c(parseFloat(value))); break;
        case "re": setData(re2c(parseFloat(value))); break;
        case "ra": setData(ra2c(parseFloat(value))); break;
      }
      setStatus('')
    } else {
      setData(0);
      setStatus('error');
    }
  }

  const f = (v :number) :string => {
    if(value === '') return '';
    return v.toString();
  }

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
          onClick={ () => { setValue(''); setData(0); setStatus(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
      </Space>

      <TextArea
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder={ placeholder }
        autoSize={{ minRows: 3, maxRows: 3 }}
      />

      <Divider dashed />

      <Form name="basic1" labelCol={{ span: 3 }} autoComplete="off">
        <Form.Item label="摄氏度 °C">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(data) } />
        </Form.Item>
        <Form.Item label="华氏度 °F">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2f(data)) } />
        </Form.Item>
        <Form.Item label="开尔文 K">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2k(data)) } />
        </Form.Item>
        <Form.Item label="兰金温标 °R">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2r(data)) } />
        </Form.Item>
        <Form.Item label="德利尔温标 °D">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2d(data)) } />
        </Form.Item>
        <Form.Item label="牛顿温标 °N">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2n(data)) } />
        </Form.Item>
        <Form.Item label="列氏温标 °Ré">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2Re(data)) } />
        </Form.Item>
        <Form.Item label="罗氏温标 °Rø">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(c2Ra(data)) } />
        </Form.Item>
      </Form>
    </div>
  );
}

export default TemperatureConvert;