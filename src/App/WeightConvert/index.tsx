import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder } from "./lib"
import { InputStatus } from "antd/es/_util/statusUtils";

const WeightConvert = () => {

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
    /*



    */
    if(/^[0-9\.\-]+$/.test(value)) {
      // 统一转成 克 g
      switch(type) {
        case "kt": setResult(parseFloat(value) * 1000 * 1000 * 1000 ); break;
        case "t": setResult(parseFloat(value) * 1000 * 1000); break;
        case "kg": setResult(parseFloat(value) * 1000); break;
        case "g": setResult(parseFloat(value) ); break;
        case "mg": setResult(parseFloat(value) / 1000); break;
        case "μg": setResult(parseFloat(value) / 1000 / 1000 ); break;
        case "ng": setResult(parseFloat(value) / 1000 / 1000 / 1000); break;
        case "pg": setResult(parseFloat(value) / 1000 / 1000 / 1000 / 1000); break;
        case "ct": setResult(parseFloat(value) / 0.2 ); break;

        case "oz": setResult(parseFloat(value) * 28.349523125 ); break; // 1 盎司 = 1/16 磅（pound）= 28.349523125 克
        case "lb": setResult(parseFloat(value) * 453.59237); break; // 1 磅 = 7000 格令 = 453.59237 克
        case "st": setResult(parseFloat(value) * 6.35 * 1000); break; // 1 英石（stone）= 14 磅 = 6.35 千克
        case "gr": setResult(parseFloat(value) * 64.79891 / 1000); break; // 1 格令（grain）= 64.79891 毫克
        case "hw": setResult(parseFloat(value) * 50.8 * 1000); break; // 1 英担（hundredweight）= 4 夸特 = 112 磅 = 50.8 千克
        case "md": setResult(parseFloat(value) * 45.359237 * 1000); break; // 1 美担 = 45.359237 千克
        case "dr": setResult(parseFloat(value) * 1.77); break; // 1 打兰（drachm）= 1/16 盎司（ounce） = 1.77 克
        case "qr": setResult(parseFloat(value) * 12.7 * 1000); break; // 1 夸特（quarter）= 2 英石 = 28 磅 = 12.7 千克
        case "longton": setResult(parseFloat(value) * 1016 * 1000); break; // 1 英吨（ton）= 20 英担 = 2240 磅 = 1016 千克 英吨（长吨long ton）是2240磅
        case "shortton": setResult(parseFloat(value) * 907 * 1000); break; // 1 美吨（短吨short ton）是 2000磅（907千克）'},

        case "dan": setResult(parseFloat(value) * 50000 ); break;
        case "jin": setResult(parseFloat(value) * 500 ); break;
        case "liang": setResult(parseFloat(value) * 50 ); break;
        case "qian": setResult(parseFloat(value) * 5 ); break;
        case "fen": setResult(parseFloat(value) * 0.5 ); break;
        case "li": setResult(parseFloat(value) * 0.05 ); break;
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
            <Form.Item label="千吨(kt)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000 / 1000 / 1000) } />
            </Form.Item>
            <Form.Item label="吨(t)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000 / 1000) } />
            </Form.Item>
            <Form.Item label="千克(kg)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1000 ) } />
            </Form.Item>
            <Form.Item label="克(g)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result) }/>
            </Form.Item>
            <Form.Item label="毫克(mg)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000) } />
            </Form.Item>
            <Form.Item label="微克(μg)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000 * 1000) } />
            </Form.Item>
            <Form.Item label="纳克(ng)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 1000 * 1000 * 1000) } />
            </Form.Item>
            <Form.Item label="克拉(ct)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result * 0.2) } />
            </Form.Item>

          </Form>
        </Col>

        <Col span={8}>
          <Divider dashed plain>英制</Divider>
          <Form name="basic2" labelCol={{ span: 10 }} autoComplete="off" >
            <Form.Item label="盎司(ounce)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 28.349523125) } />
            </Form.Item>
            <Form.Item label="磅(pound)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 453.59237) } />
            </Form.Item>
            <Form.Item label="英石(stone)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 6350) } />
            </Form.Item>
            <Form.Item label="格令(grain)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 64.79891 * 1000)  }/>
            </Form.Item>
            <Form.Item label="打兰(drachm)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1.77)  }/>
            </Form.Item>
            <Form.Item label="夸特(quarter)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 12.7 / 1000)  }/>
            </Form.Item>
            <Form.Item label="英担">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 50.8 / 1000)  }/>
            </Form.Item>
            <Form.Item label="美担">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 45.359237 / 1000)  }/>
            </Form.Item>
            <Form.Item label="英吨(long ton)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 1016 / 1000)  }/>
            </Form.Item>
            <Form.Item label="美吨(short ton)">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 907 / 1000)  }/>
            </Form.Item>
          </Form>
        </Col>

        <Col span={8}>
          <Divider dashed plain>市制</Divider>
          <Form name="basic3" labelCol={{ span: 8 }} autoComplete="off">
            <Form.Item label="担">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 50000) } />
            </Form.Item>
            <Form.Item label="斤">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 500 ) } />
            </Form.Item>
            <Form.Item label="两">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 50) } />
            </Form.Item>
            <Form.Item label="钱">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 ) }/>
            </Form.Item>
            <Form.Item label="分">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 10 ) }/>
            </Form.Item>
            <Form.Item label="厘">
              <Input readOnly style={ inputStyle } onClick={ inputClick } value= { f(result / 5 * 100 ) }/>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default WeightConvert;