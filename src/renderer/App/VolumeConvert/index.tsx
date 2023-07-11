import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

export const VolumeConvert = () => {

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
    // 统一计算成 毫升 ml
    if(/^[0-9\.\-]+$/.test(value)) {
      switch(type) {

        case "l": setResult(parseFloat(value) * 1000); break; // 1 升 = 1000 毫升
        case "ml": setResult(parseFloat(value)); break; // 1 升 = 1000 毫升
        //case "mk3": setResult(parseFloat(value) * 10); break;
        case "m3": setResult(parseFloat(value) * 1000000); break; // 1 立方米 = 1000000 毫升 = 1000 升
        case "dm3": setResult(parseFloat(value) * 1000 ); break; // 1 立方分米 = 1000 毫升 = 1 升
        case "cm3": setResult(parseFloat(value)); break; // 1 立方厘米 = 1 毫升
        case "mm3": setResult(parseFloat(value) / 1000); break; // 1 立方毫米 = 0.001 毫升

        case "us-ounce": setResult(parseFloat(value) * 29.5735295625 ); break; // 1 美制液量盎司 = 1.8046875 立方英寸 = 29.5735295625 毫升 ounce
        case "us-gallon": setResult(parseFloat(value) * 3785.41178 ); break; // 1 美制加仑 = 128 美制液量盎司 = 3785.41178 毫升 gallon
        case "us-dram": setResult(parseFloat(value) * 3.6966912); break; // 1 美制液量打兰 = 1/8 美制液量盎司 = 3.6966912 毫升 dram '
        case "us-teaspoon": setResult(parseFloat(value) * 4.92892159); break; // 1 美制茶匙 = 1/6 美制液量盎司 = 4.92892159 毫升 teaspoon
        case "us-tablespoon": setResult(parseFloat(value) * 14.7867648); break; // 1 美制汤匙 = 1/2 美制液量盎司 = 14.7867648 毫升 tablespoon
        case "us-gill": setResult(parseFloat(value) * 118.294118); break; // 1 美制及耳 = 4 美制液量盎司 = 118.294118 毫升 gill
        case "us-cup": setResult(parseFloat(value) * 236.588236); break; // 1 美制杯 = 8 美制液量盎司 = 236.588236 毫升 cup'
        case "us-pint": setResult(parseFloat(value) * 473.176473); break; // 1 美制品脱 = 16 美制液量盎司 = 473.176473 毫升 pint
        case "us-quart": setResult(parseFloat(value) * 946.352946); break; // 1 美制夸脱 = 32 美制液量盎司 = 946.352946 毫升 quart

        case "iu-ounce": setResult(parseFloat(value) * 28.4130625 ); break; // 1 英制液量盎司 = 28.4130625 毫升 = 1.733871455 立方英寸 = 0.960759940 美制液量盎司
        case "iu-gallon": setResult(parseFloat(value) * 4546.09 ); break; // 1 英制加仑 = 160 英制液量盎司 = 4 英制夸脱 = 4546.09 毫升
        case "iu-dram": setResult(parseFloat(value) * 3.5516328125); break; // 1 英制液量打兰 = 1/8 英制液量盎司 = 3.5516328125 毫升
        case "iu-teaspoon": setResult(parseFloat(value) * 4.7355125); break; // 1 英制茶匙 = 1/6 英制液量盎司 = 4.7355125 毫升
        case "iu-tablespoon": setResult(parseFloat(value) * 14.2065375); break; // 1 英制汤匙 = 1/2 英制液量盎司 = 3 英制茶匙 = 14.2065375 毫升
        case "iu-gill": setResult(parseFloat(value) * 142.0653125); break; // 1 英制及耳 = 5 英制液量盎司 = 10 英制汤匙 = 142.0653125 毫升
        case "iu-cup": setResult(parseFloat(value) * 284.130625); break; // 1 英制杯 = 10 英制液量盎司 = 2 英制及耳= 284.130625 毫升
        case "iu-pint": setResult(parseFloat(value) * 568.26125); break; // 1 英制品脱 = 20 英制液量盎司= 2 英制杯 = 568.26125 毫升
        case "iu-quart": setResult(parseFloat(value) * 1136.5225); break; // 1 英制夸脱 = 40 英制液量盎司 = 2 英制品脱  = 1136.5225 毫升
        case "iu-inch3": setResult(parseFloat(value) * 16.387064); break; // 1 立方英寸 = 16.387064 毫升
        case "iu-foot3": setResult(parseFloat(value) * 28316.8466 ); break; // 1 立方英尺 = 28316.8466 毫升
        case "iu-yard3": setResult(parseFloat(value) * 764554.858 ); break; // 1 立方码 = 764554.858 毫升

        case "dan": setResult(parseFloat(value) * 100000 ); break; // 1市石 =	10市斗 =	100市升 =	1000市合(gě) =	1,0000勺 =	10,0000撮 =	100升
        case "dou": setResult(parseFloat(value) * 10000 ); break; // 0.1市石 =	1市斗 =	10市升 =	100市合 =	1000勺 =	1,0000撮 = 10升
        case "sheng": setResult(parseFloat(value) * 1000 ); break; // 市制容积的基本单位为升，一升合国际单位制一公升，由于两个单位大小一样，所以，国际单位制的公升也简称为升'
        case "he": setResult(parseFloat(value) * 100 ); break; // 0.001市石 =	0.01市斗 =	0.1市升 =	1市合 =	10勺 =	100撮 =	0.1升
        case "shao": setResult(parseFloat(value) * 10 ); break; // 0.0001市石 =	0.001市斗 =	0.01市升 =	0.1市合 =	1勺 =	10撮 =	0.01升
        case "cuo": setResult(parseFloat(value) ); break; // 0.00001市石 =	0.0001市斗 =	0.001市升 =	0.01市合 =	0.1勺 =	1撮 =	0.001升
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
    if('' === value || status != '') return '';
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
          <Form name="basic1" labelCol={{ span: 12 }} autoComplete="off">
            <Form.Item label="升(l)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000) } />
            </Form.Item>
            <Form.Item label="毫升(ml)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) } />
            </Form.Item>
            <Form.Item label="立方米(m³)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000000) } />
            </Form.Item>
            <Form.Item label="立方分米(dm³)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000) }/>
            </Form.Item>
            <Form.Item label="立方厘米(cm³)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) } />
            </Form.Item>
            <Form.Item label="立方毫米(mm³)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000) } />
            </Form.Item>
          </Form>
        </Col>

        <Col span={6}>
          <Divider dashed plain>英制</Divider>
          <Form name="basic2" labelCol={{ span: 10 }} autoComplete="off" >
            <Form.Item label="盎司">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 28.4130625 ) } />
            </Form.Item>
            <Form.Item label="加仑">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 4546.09 ) } />
            </Form.Item>
            <Form.Item label="打兰">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 3.5516328125 ) } />
            </Form.Item>
            <Form.Item label="茶匙">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 4.7355125 )  }/>
            </Form.Item>
            <Form.Item label="汤匙">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 14.2065375 )  }/>
            </Form.Item>
            <Form.Item label="及耳">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 142.0653125 )  }/>
            </Form.Item>
            <Form.Item label="杯">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 284.130625 )  }/>
            </Form.Item>
            <Form.Item label="品脱">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 568.26125 )  }/>
            </Form.Item>
            <Form.Item label="夸脱">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1136.5225 )  }/>
            </Form.Item>
            <Form.Item label="立方英寸">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 16.387064 )  }/>
            </Form.Item>
            <Form.Item label="立方英尺">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 28316.8466 )  }/>
            </Form.Item>
            <Form.Item label="立方码">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 764554.858 )  }/>
            </Form.Item>
          </Form>
        </Col>

        <Col span={6}>
          <Divider dashed plain>美制</Divider>
          <Form name="basic3" labelCol={{ span: 10 }} autoComplete="off" >
            <Form.Item label="盎司">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 29.5735295625) } />
            </Form.Item>
            <Form.Item label="加仑">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 3785.41178) } />
            </Form.Item>
            <Form.Item label="打兰">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 3.6966912) } />
            </Form.Item>
            <Form.Item label="茶匙">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 4.92892159)  }/>
            </Form.Item>
            <Form.Item label="汤匙">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 14.7867648)  }/>
            </Form.Item>
            <Form.Item label="及耳">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 118.294118)  }/>
            </Form.Item>
            <Form.Item label="杯">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 236.588236)  }/>
            </Form.Item>
            <Form.Item label="品脱">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 473.176473)  }/>
            </Form.Item>
            <Form.Item label="夸脱">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 946.352946)  }/>
            </Form.Item>
          </Form>
        </Col>

        <Col span={6}>
          <Divider dashed plain>市制</Divider>

          <Form name="basic4" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="石">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 100000) } />
            </Form.Item>
            <Form.Item label="斗">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 10000) } />
            </Form.Item>
            <Form.Item label="升">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000) } />
            </Form.Item>
            <Form.Item label="合">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 100) }/>
            </Form.Item>
            <Form.Item label="勺">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 10) } />
            </Form.Item>
            <Form.Item label="撮">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) } />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default VolumeConvert;