import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const AreaConvert = () => {

  const ut = getDefaultUnitType();
  const [ unitType, setUnitType ] = useState(ut); // 制式 
  const [ typeList, setTypeList ] = useState(getTypeList(ut)); // 类型
  const [ value, setValue ] = useState(''); // 输入数量
  const [ status, setStatus ] = useState(''); // 输入是否合法

  const dt = getDefaultType(ut);
  const [ type, setType ] = useState(dt); // 转换类型
  const [ placeholder, setPlaceholder ] = useState(getTypePlaceholder(dt)); // 数字类型的输入提示
  const [ result, setResult ] = useState(0); // 转换的结果 统一转换成 
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

        case "km2": setResult(parseFloat(value) * 1000000); break; // 1 平方公里km² =  平方米 m²
        case "m2": setResult(parseFloat(value)); break; // 1 平方米 m² = 0.0001 公顷 = 0.01 公亩
        case "gq": setResult(parseFloat(value) * 10000); break; // 1 公顷 = 10000 平方米 m²
        case "gm": setResult(parseFloat(value) * 100); break; // 1 公亩 = 100 平方米 m²
        case "dm2": setResult(parseFloat(value) / 100 ); break; // 1 平方分米 dm² = 0.01 平方米 m²
        case "cm2": setResult(parseFloat(value) / 10000 ); break; // 1 平方厘米 cm² = 0.0001 平方米 m²
        case "mm2": setResult(parseFloat(value) / 1000000 ); break; // 1 平方毫米 mm² = 0.000001 平方米 m²

        case "jp-ping": setResult(parseFloat(value) * 3.30578622 ); break; // 1 坪 = 3.30578622 平方米 m²
        case "jp-die": setResult(parseFloat(value) * 1.62 ); break; // 1 叠 = 1.62 平方米 m²
        case "jp-ding": setResult(parseFloat(value) * 0.00991736); break; // 1 町 = 0.00991736 平方米 m²
        case "jp-duan": setResult(parseFloat(value) * 0.00099174); break; // 1 段 = 0.00099174 平方米 m²
        case "jp-mu": setResult(parseFloat(value) * 0.00009917); break; // 1 亩 = 0.00009917 平方米 m²

        case "mile2": setResult(parseFloat(value) * 2590000 ); break; // 1 平方英里 = 2590000 平方米 m²
        case "ym": setResult(parseFloat(value) * 4046.85642 ); break; // 1 英亩 = 4046.85642 平方米 m²
        case "ld": setResult(parseFloat(value) * 1011.7136203); break; // 1 路得 = 1011.7136203 平方米m²
        case "g": setResult(parseFloat(value) * 25.2928469 ); break; // 1 平方杆 = 25.2928469 平方米m²
        case "yard2": setResult(parseFloat(value) * 0.83612736 ); break; // 1 平方码 = 0.83612736 平方米 m²
        case "foot2": setResult(parseFloat(value) * 0.09290304 ); break; // 1 平方英尺 = 0.09290304 平方米 m²'
        case "inch2": setResult(parseFloat(value) * 0.00064516 ); break; // 1 平方英寸 = 0.00064516 平方米 m²

        case "qin": setResult(parseFloat(value) * 66666 ); break; // 1顷 = 100亩 = 66666 平方米 m²
        case "mu": setResult(parseFloat(value) * 666.66 ); break; // 1亩 = 666.66 平方米 m²
        case "fen": setResult(parseFloat(value) * 66.666 ); break; // 1分 = 0.1亩 = 66.666 平方米 m²
        case "li": setResult(parseFloat(value) * 6.6666 ); break; // 1厘 = 0.01亩 = 6.6666 平方米 m²
        case "hao": setResult(parseFloat(value) * 0.66666 ); break; // 1毫 = 0.001亩 = 0.66666 平方米 m²

        case "zhuang2": setResult(parseFloat(value) * 11.11 ); break; // 1平方丈 = 100平方尺 = 11.11平方米
        case "chi2": setResult(parseFloat(value) * 0.1111 ); break; // 1平方尺 = 0.1111平方米
        case "cun2": setResult(parseFloat(value) * 0.001111 ); break; // 1平方寸 = 0.01平方尺 = 0.001111平方米
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
    if('' === value || status !== '') return '';
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
        <Col span={6}>
          <Divider dashed plain>公制</Divider>
          <Form name="basic1" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="平方公里">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000000) } />
            </Form.Item>
            <Form.Item label="公顷">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 10000) } />
            </Form.Item>
            <Form.Item label="公亩">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 100) } />
            </Form.Item>
            <Form.Item label="平方米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) }/>
            </Form.Item>
            <Form.Item label="平方分米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 100) } />
            </Form.Item>
            <Form.Item label="平方厘米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 10000 ) } />
            </Form.Item>
            <Form.Item label="平方毫米">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000000 ) } />
            </Form.Item>
          </Form>
        </Col>

        <Col span={6}>
          <Divider dashed plain>英制</Divider>
          <Form name="basic2" labelCol={{ span: 10 }} autoComplete="off" >
            <Form.Item label="平方英里">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 2590000) } />
            </Form.Item>
            <Form.Item label="英亩">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 4046.85642 ) } />
            </Form.Item>
            <Form.Item label="路得">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1011.7136203 ) } />
            </Form.Item>
            <Form.Item label="平方杆">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 25.2928469 )  }/>
            </Form.Item>
            <Form.Item label="平方码">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.83612736 )  }/>
            </Form.Item>
            <Form.Item label="平方英尺">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.09290304 )  }/>
            </Form.Item>
            <Form.Item label="平方英寸">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.00064516 )  }/>
            </Form.Item>
          </Form>
        </Col>

        <Col span={6}>
          <Divider dashed plain>市制</Divider>
          <Form name="basic3" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="顷">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 66666 ) } />
            </Form.Item>
            <Form.Item label="亩">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 666.66 ) } />
            </Form.Item>
            <Form.Item label="分">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 66.666 ) } />
            </Form.Item>
            <Form.Item label="厘">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 6.6666 ) } />
            </Form.Item>
            <Form.Item label="毫">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.66666 ) } />
            </Form.Item>
            <Form.Item label="平方丈">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 11.11 ) } />
            </Form.Item>
            <Form.Item label="平方尺">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.1111 ) } />
            </Form.Item>
            <Form.Item label="平方寸">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.001111 ) } />
            </Form.Item>
          </Form>
        </Col>

        <Col span={6}>
          <Divider dashed plain>日式</Divider>
          <Form name="basic4" labelCol={{ span: 8 }} autoComplete="off" >
            <Form.Item label="坪">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 3.30578622) } />
            </Form.Item>
            <Form.Item label="叠">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1.62) } />
            </Form.Item>
            <Form.Item label="町">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.00991736 ) } />
            </Form.Item>
            <Form.Item label="段">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.00099174 )  }/>
            </Form.Item>
            <Form.Item label="亩">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.00009917 )  }/>
            </Form.Item>
          </Form>

        </Col>
      </Row>
    </div>
  );
}

export default AreaConvert;