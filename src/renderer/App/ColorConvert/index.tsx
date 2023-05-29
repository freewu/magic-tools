import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, ColorPicker } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { genColorString, transalte2Hex } from "./lib"
import { colorTypeList, emptyResult } from "./data"
import type { RadioChangeEvent } from 'antd';
import type { Color } from 'antd/es/color-picker';

const ColorConvert = () => {

  const [ value, setValue ] = useState(''); // 需要转换的颜色值 
  const [ colorType, setColorType ] = useState('HEX'); // 输入值的颜色类型,
  const [ placeholder, setPlaceholder ] = useState(colorTypeList[0]["placeholder"]); // 颜色类型的输入提示
  const [ checked, setChecked ] = useState(false); // 输出大小写
  const [ colorData, setColorData ] = useState(emptyResult); // 转换的结果
  const [ notice, contextHolder] = message.useMessage();
  const [ colorPickerHex, setColorPickerHex ] = useState<Color | string>('#1677ff'); // colorPicker 默认颜色
  const [ showPercent, setShowPercent ] = useState(false); // 是否显示 % 

  const inputStyle = { cursor: "pointer" };

  // 切换输入颜色类型
  const onColorTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setColorType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setColorData(emptyResult);
    // 更新输入提示信息
    const tips = colorTypeList.find(item => item.label === value)?.placeholder;
    setPlaceholder(tips + "");
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const handleCheckboxChange = () => {
    setChecked(!checked);
    // 如果要专内容不为空，处理 显示字母的大小问题
    if ( value.trim() != "") {
      const result = {
        "hex": (checked)? colorData.hex.toLowerCase() : colorData.hex.toUpperCase(),
        "rgb": (checked)? colorData.rgb.toLowerCase() : colorData.rgb.toUpperCase(),
        "hsl": (checked)? colorData.hsl.toLowerCase() : colorData.hsl.toUpperCase(),
        "cmyk": (checked)? colorData.cmyk.toLowerCase() : colorData.cmyk.toUpperCase(),
        "hsv": (checked)? colorData.hsv.toLowerCase() : colorData.hsv.toUpperCase(),
        "lab": (checked)? colorData.lab.toLowerCase() : colorData.lab.toUpperCase(),
        "lch": (checked)? colorData.lch.toLowerCase() : colorData.lch.toUpperCase(),
        "xyz": (checked)? colorData.xyz.toLowerCase() : colorData.xyz.toUpperCase(),
        "keyword": (checked)? colorData.keyword.toLowerCase() : colorData.keyword.toUpperCase(),
        "complementaryColor": (checked)? colorData.complementaryColor.toLowerCase() : colorData.complementaryColor.toUpperCase(), 
      };
      setColorData(result);
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    // 输入4个符以上才处理
    if (value != "" && value.length >= 4) {
      covertColor(value);
    } else {
      setColorData(emptyResult);
    }
  }

  const upperLowerTranslate = (str :string) :string => {
    return checked? str.toUpperCase() : str.toLowerCase()
  }

  const covertColor = (value :string) => {
    setValue(value);
    const colorHex = transalte2Hex(value, colorType);
    const result = {
      "hex": upperLowerTranslate(genColorString(colorHex, "HEX")),
      "rgb": upperLowerTranslate(genColorString(colorHex, "RGB")),
      "hsl": upperLowerTranslate(genColorString(colorHex, "HSL")),
      "cmyk": upperLowerTranslate(genColorString(colorHex, "CMYK")),
      "hsv": upperLowerTranslate(genColorString(colorHex, "HSV")),
      "lab": upperLowerTranslate(genColorString(colorHex, "LAB")),
      "lch": upperLowerTranslate(genColorString(colorHex, "LCH")),
      "xyz": upperLowerTranslate(genColorString(colorHex, "XYZ")),
      "keyword": upperLowerTranslate(genColorString(colorHex, "KEYWORD")),
      "complementaryColor": upperLowerTranslate(genColorString(colorHex, "ComplementaryColor")),
    };
    setColorData(result);
  }

  // 取色器选择颜色事件
  const onColorPickerChange = (value: Color, hex: string) => {
    setColorPickerHex(value);
    setColorType('HEX');
    setValue(hex);

    // 更新输入提示信息
    const tips = colorTypeList.find(item => item.label === 'HEX')?.placeholder;
    setPlaceholder(tips + "");
    
    // 转换 
    covertColor(hex);
  }

  // 切换显示 %
  const handleShowPercentChange = ()  => {
    setShowPercent(!showPercent);
  }

  return (
    <div>
      {contextHolder}
      <Space>
        <Radio.Group 
          optionType = "button" buttonStyle="solid"
          options = { colorTypeList } 
          onChange={ onColorTypeChange } 
          value={ colorType } 
        />
        <Checkbox onChange={ handleCheckboxChange } value={ checked }>大写字符显示</Checkbox>
        {/* <Checkbox onChange={ handleShowPercentChange } value={ showPercent }>显示 %</Checkbox> */}

        <ColorPicker
          format={ 'hex'}
          value={ colorPickerHex }
          onChange={ onColorPickerChange }
        />
          
        <Button 
          onClick={ () => { setValue(''); setColorData(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
      </Space>
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder={ placeholder }
        autoSize={{ minRows: 2, maxRows: 2 }}
      />
      <Divider dashed />
      <Form name="basic"labelCol={{ span: 2 }} autoComplete="off" size="small">
        <Form.Item label="颜色">
          <Input readOnly onClick={ inputClick }  
            style={ { cursor: "pointer", backgroundColor: colorData.hex } } 
            value= { colorData.hex }/>
        </Form.Item>
        <Form.Item label="互补色">
          <Input 
            readOnly onClick={ inputClick } 
            style={ { cursor: "pointer", backgroundColor: colorData.complementaryColor } } 
            value={ colorData.complementaryColor } 
          />
        </Form.Item>
        <Form.Item label="Keyword">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.keyword } />
        </Form.Item>
        <Form.Item label="HEX">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.hex } />
        </Form.Item>
        <Form.Item label="RGB">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.rgb } />
        </Form.Item>
        <Form.Item label="HSL">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.hsl } />
        </Form.Item>
        <Form.Item label="CMYK">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.cmyk }/>
        </Form.Item>
        <Form.Item label="HSV">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.hsv }/>
        </Form.Item>
        <Form.Item label="LAB">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.lab }/>
        </Form.Item>
        <Form.Item label="LCH">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.lch }/>
        </Form.Item>
        <Form.Item label="XYZ">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { colorData.xyz }/>
        </Form.Item>
      </Form>
    </div>
  );
}

export default ColorConvert;