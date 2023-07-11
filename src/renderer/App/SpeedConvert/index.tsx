import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const SpeedConvert = () => {

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

    /**
  { label: '厘米每秒(m/s)', value: 'cms', type:'ms', placeholder: ''},
  { label: '米每秒(m/s)',   value: 'ms',  type:'ms', placeholder: '' },
  { label: '千米每秒(km/s)', value: 'kms', type:'ms', placeholder: '' },
  { label: '千米每时(km/h)', value: 'kmh', type:'ms', placeholder: '' },
  //{ label: '光速', value: 'ls', type:'ms', placeholder: '' },
  { label: '马赫', value: 'mach', type:'ms', placeholder: '' },
  { label: '节', value: 'knot', type:'ms', placeholder: '指 海里 / 小时，节是航海中代表速度的单位' },

  { label: '英里每时(m/h)', value: 'mph', type:'iu', placeholder: ''},
  { label: '英尺每秒(ft/s)', value: 'fts', type:'iu', placeholder: ''},
  { label: '英尺每分钟(ft/min)', value: 'ftmin', type:'iu', placeholder: ''},
  { label: '', value: 'ins', type:'iu', placeholder: ''},
     */
    // 统一转换成  千米每时 km/h
    if(/^[0-9\.\-]+$/.test(value)) {
      switch(type) {
        case "cms": setResult(parseFloat(value) / 100000 * 3600); break; // 厘米每秒(m/s)
        case "ms": setResult(parseFloat(value) / 1000 * 3600); break; // 米每秒(m/s)
        case "kms": setResult(parseFloat(value) * 3600); break; // 千米每秒(km/s)
        case "kmh": setResult(parseFloat(value)); break; // 千米每时(km/h)
        case "mach": setResult(parseFloat(value) * 1224 ); break; // 马赫
        case "knot": setResult(parseFloat(value) * 1.852); break; // 节

        case "mph": setResult(parseFloat(value) * 1.6093 ); break; // 英里每时(m/h)
        case "fts": setResult(parseFloat(value) * 0.3048 * 3600 / 1000 ); break; // 英尺每秒(ft/s)
        case "fts": setResult(parseFloat(value) * 0.3048 * 60 / 1000); break; //英尺每分钟(ft/min)
        case "ins": setResult(parseFloat(value) * 2.54 * 3600  ); break; // 英寸每秒(in/s)
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
    if(value === '') return '';
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
        <Col span={12}>
          <Divider dashed plain>公制</Divider>

          <Form name="basic1" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="米每秒(m/s)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000 / 3600) } />
            </Form.Item>
            <Form.Item label="千米每时(km/h)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) } />
            </Form.Item>
            <Form.Item label="厘米每秒(m/s)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 100000 / 3600) } />
            </Form.Item>
            <Form.Item label="千米每秒(km/s)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 3600) }/>
            </Form.Item>
            <Form.Item label="马赫">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1224) } />
            </Form.Item>
            <Form.Item label="节">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1.852) } />
            </Form.Item>
          </Form>
        </Col>

        <Col span={12}>
          <Divider dashed plain>英制</Divider>
          <Form name="basic2" labelCol={{ span: 8 }} autoComplete="off" >
            <Form.Item label="英里每时(m/h) 迈">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1.6093) } />
            </Form.Item>
            <Form.Item label="英尺每秒(ft/s)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.3048 / 3600 * 1000 ) } />
            </Form.Item>
            <Form.Item label="英尺每分钟(ft/min)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 0.3048 / 60 * 1000) } />
            </Form.Item>
            <Form.Item label="英寸每秒(in/s)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 2.54 / 3600 * 100000)  }/>
            </Form.Item>
          </Form>
        </Col>

      </Row>
    </div>
  );
}

export default SpeedConvert;