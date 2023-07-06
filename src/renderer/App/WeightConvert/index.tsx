import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const DistanceConvert = () => {

  const ut = getDefaultUnitType();
  const [ unitType, setUnitType ] = useState(ut); // 制式 
  const [ typeList, setTypeList ] = useState(getTypeList(ut)); // 类型
  const [ value, setValue ] = useState(''); // 输入数量
  const [ status, setStatus ] = useState(''); // 输入是否合法

  const dt = getDefaultType(ut);
  const [ type, setType ] = useState(dt); // 转换类型
  const [ placeholder, setPlaceholder ] = useState(getTypePlaceholder(dt)); // 数字类型的输入提示
  const [ result, setResult ] = useState(0); // 转换的结果 统一转换成 米
  const [ notice, contextHolder] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  // 切换类型
  const onTypeChange = ({ target: { value : t } }: RadioChangeEvent) => {
    setType(t);
    setPlaceholder(getTypePlaceholder(t));
    convert(value,t);
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const convert = (value:string, type :string) => {
    if("" == value) {
      setStatus('');
      return ; // 没有内容直接返回不做下面的处理
    }
    if(/^[0-9\.\-]+$/.test(value)) {
      switch(type) {
        case "km": setResult(parseFloat(value) / 1000); break;
        case "m": setResult(parseFloat(value)); break;
        case "dm": setResult(parseFloat(value) * 10); break;
        case "cm": setResult(parseFloat(value) * 100); break;
        case "mm": setResult(parseFloat(value) * 1000 ); break;
        case "μm": setResult(parseFloat(value) * 1000 * 1000); break;
        case "nm": setResult(parseFloat(value) * 1000 * 1000 * 1000); break;
        case "pm": setResult(parseFloat(value) * 1000 * 1000 * 1000 * 1000); break;
        case "nmile": setResult(parseFloat(value) * 1852); break;
        //case "ly": setResult(parseFloat(value) * 9460730472580800); break;
        //case "au": setResult(parseFloat(value) * 149597870); break;

        case "inch": setResult(parseFloat(value) * 2.54 / 1000 ); break;
        case "foot": setResult(parseFloat(value) * 0.3048); break;
        case "yard": setResult(parseFloat(value) * 0.9144); break;
        case "mile": setResult(parseFloat(value) * 1.6093 / 1000); break;

        // 1里 =	15引 =	150丈 =	1500尺 =	1,5000寸 =	15,0000分 =	150,0000釐 =	1500,0000毫 =	500米
        case "li": setResult(parseFloat(value) * 500 ); break;
        case "ying": setResult(parseFloat(value) * 500 / 15 ); break;
        case "zhang": setResult(parseFloat(value) * 50  / 15); break;
        case "chi": setResult(parseFloat(value) * 5 / 15 ); break;
        case "cun": setResult(parseFloat(value) * 5 / 150 ); break;
        case "fen": setResult(parseFloat(value) * 5 / 1500 ); break;
        case "l": setResult(parseFloat(value) * 5 / 15000 ); break;
        case "hao": setResult(parseFloat(value) * 5 / 150000 ); break;
      }
      setStatus('')
    } else {
      setResult(0);
      setStatus('error');
    }
  }

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    convert(value,type);
  }

  const f = (v :number) :string => {
    if(0 === v) return '';
    return v.toString();
  }

  return (
    <div>
      {contextHolder}

      <Space>
        <Select
          value={ unitType }
          style={{ width: 80 }}
          onChange={ (v :string) => { 
            setUnitType(v);
            setTypeList(getTypeList(v));
            const dt = getDefaultType(v);
            setType(dt);
            setPlaceholder(getTypePlaceholder(dt));
            convert(value,dt);
          } }
          options={ unitTypeList }
        />
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { typeList } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setStatus(''); setResult(0); } }
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
        <Col span={8}>
          <Divider dashed plain>公制</Divider>
          <Form name="basic1" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="千米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000) } />
            </Form.Item>
            <Form.Item label="米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) } />
            </Form.Item>
            <Form.Item label="分米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 10) } />
            </Form.Item>
            <Form.Item label="厘米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 100) }/>
            </Form.Item>
            <Form.Item label="毫米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000) } />
            </Form.Item>
            <Form.Item label="微米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000 / 1000) } />
            </Form.Item>
            <Form.Item label="纳米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000 / 1000 / 1000) } />
            </Form.Item>
            <Form.Item label="皮米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000 / 1000 / 1000 / 1000) } />
            </Form.Item>
            <Form.Item label="海里">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1852) } />
            </Form.Item>
            {/* <Form.Item label="光年">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= {  } />
            </Form.Item>
            <Form.Item label="天文单位">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { } />
            </Form.Item> */}
          </Form>
        </Col>

        <Col span={8}>
          <Divider dashed plain>英制</Divider>
          <Form name="basic2" labelCol={{ span: 10 }} autoComplete="off" >
            <Form.Item label="英寸 (inch)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 2.54 * 1000) } />
            </Form.Item>
            <Form.Item label="英尺 (foot)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.3048) } />
            </Form.Item>
            <Form.Item label="码 (yard)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.9144) } />
            </Form.Item>
            <Form.Item label="英里 (mile)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1609.3)  }/>
            </Form.Item>
          </Form>
        </Col>

        <Col span={8}>
          <Divider dashed plain>市制</Divider>
          <Form name="basic3" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="里">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 500) } />
            </Form.Item>
            <Form.Item label="引">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 500 * 15) } />
            </Form.Item>
            <Form.Item label="丈">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 50 * 15) } />
            </Form.Item>
            <Form.Item label="尺">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 15) }/>
            </Form.Item>
            <Form.Item label="寸">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 150) } />
            </Form.Item>
            <Form.Item label="分">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 1500) } />
            </Form.Item>
            <Form.Item label="厘">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 15000) } />
            </Form.Item>
            <Form.Item label="毫">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 150000) } />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default DistanceConvert;