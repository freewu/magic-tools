import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { } from "./lib"
import { typeList, emptyResult, ByteConvertResult } from "./data"
import type { RadioChangeEvent } from 'antd';
import { convertToByte, convertFromByte, getDefaultType } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const ByteConvert = () => {
  const t = getDefaultType();
  const getPlaceholder = (type :string) :string | undefined => {
    return typeList.find(item => item.value === type)?.placeholder;
  }

  const [ value, setValue ] = useState(''); // 输入数量
  const [ status, setStatus ] = useState(''); // 输入是否合法
  const [ b, setB ] = useState(0); // 数量
  const [ type, setType ] = useState(t); // 类型,
  const [ placeholder, setPlaceholder ] = useState(getPlaceholder(t)); // 数字类型的输入提示
  const [ data, setData ] = useState(emptyResult); // 转换的结果
  const [ notice, contextHolder] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  // 切换类型
  const onTypeChange = ({ target: { value : t } }: RadioChangeEvent) => {
    setType(t);
    setPlaceholder(getPlaceholder(t));
    if( value !== "" && /^\d+$/.test(value)) setB(convertToByte(parseInt(value), t));
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
    if(/^\d+$/.test(value)) {
      setB(convertToByte(parseInt(value), type));
      setStatus('')
    } else {
      setB(0);
      setStatus('error');
    }
  }

  const f = (v :number) :string => {
    if(0 === v) return '';
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
          onClick={ () => { setValue(''); setB(0); setStatus(''); } }
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

      <Row wrap>
        <Col span={12}>
          <Divider dashed plain>字节 ( Byte )</Divider>
          <Form name="basic1" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="B (Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'')) } />
            </Form.Item>
            <Form.Item label="KB (Kilo Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'KB')) } />
            </Form.Item>
            <Form.Item label="MB (Mega Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'MB')) } />
            </Form.Item>
            <Form.Item label="GB (Giga Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'GB')) }/>
            </Form.Item>
            <Form.Item label="TB (Trillion Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'TB')) } />
            </Form.Item>
            <Form.Item label="PB (Peta Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'PB')) } />
            </Form.Item>
            <Form.Item label="EB (Exa Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'EB')) } />
            </Form.Item>
            <Form.Item label="ZB (Zetta Byte)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'ZB')) } />
            </Form.Item>
            <Form.Item label="YB Yotta Byte">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b,'YB')) } />
            </Form.Item>
          </Form>
        </Col>
        <Col span={12}>
          <Divider dashed plain>位 ( bit )</Divider>
          <Form name="basic2" labelCol={{ span: 8 }} autoComplete="off">
          <Form.Item label="b (bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'')) } />
            </Form.Item>
            <Form.Item label="Kb (Kilo bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'KB')) } />
            </Form.Item>
            <Form.Item label="Mb (Mega bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'MB')) } />
            </Form.Item>
            <Form.Item label="Gb (Giga bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'GB')) }/>
            </Form.Item>
            <Form.Item label="Tb (Trillion bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'TB')) } />
            </Form.Item>
            <Form.Item label="Pb (Peta bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'PB')) } />
            </Form.Item>
            <Form.Item label="Eb (Exa bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'EB')) } />
            </Form.Item>
            <Form.Item label="Zb (Zetta bit)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'ZB')) } />
            </Form.Item>
            <Form.Item label="Yb Yotta bit">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(convertFromByte(b * 8,'YB')) } />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default ByteConvert;