import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, ColorPicker } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { } from "./lib"
import { numberTypeList, emptyResult } from "./data"
import type { RadioChangeEvent } from 'antd';

const ColorConvert = () => {

  const [ value, setValue ] = useState(''); // 需要转换的颜色值 
  const [ numberType, setNumberType ] = useState('DEC'); // 输入内容的数字类型,
  const [ placeholder, setPlaceholder ] = useState(numberTypeList[0]["placeholder"]); // 数字类型的输入提示
  const [ checked, setChecked ] = useState(false); // 输出大小写
  const [ numberData, setNumberData ] = useState(emptyResult); // 转换的结果
  const [ notice, contextHolder] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  // 切换输入颜色类型
  const onNumberTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setNumberType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setNumberData(emptyResult);
    // 更新输入提示信息
    const tips = numberTypeList.find(item => item.label === value)?.placeholder;
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
        "hex": (checked)? numberData.hex.toLowerCase() : numberData.hex.toUpperCase(),
        "bin": numberData.bin,
        "oct": numberData.oct,
        "dec": numberData.dec,
      };
      setNumberData(result);
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    // 输入4个符以上才处理
    if (value != "" && value.length >= 4) {
      covertNumber(value);
    } else {
      setNumberData(emptyResult);
    }
  }

  const upperLowerTranslate = (str :string) :string => {
    return checked? str.toUpperCase() : str.toLowerCase()
  }

  const covertNumber = (value :string) => {
    setValue(value);
    
    // const result = {
    //   "hex": upperLowerTranslate(genColorString(colorHex, "HEX")),
    //   "rgb": upperLowerTranslate(genColorString(colorHex, "RGB")),
    //   "hsl": upperLowerTranslate(genColorString(colorHex, "HSL")),
    //   "cmyk": upperLowerTranslate(genColorString(colorHex, "CMYK")),
    //   "hsv": upperLowerTranslate(genColorString(colorHex, "HSV")),
    //   "lab": upperLowerTranslate(genColorString(colorHex, "LAB")),
    //   "lch": upperLowerTranslate(genColorString(colorHex, "LCH")),
    //   "xyz": upperLowerTranslate(genColorString(colorHex, "XYZ")),
    //   "keyword": upperLowerTranslate(genColorString(colorHex, "KEYWORD")),
    //   "complementaryColor": upperLowerTranslate(genColorString(colorHex, "ComplementaryColor")),
    // };
    setNumberData(emptyResult);
  }

  return (
    <div>
      {contextHolder}

      <Space>
        <Radio.Group 
          optionType = "button" buttonStyle="solid"
          options = { numberTypeList } 
          onChange={ onNumberTypeChange } 
          value={ numberType } 
        />
        <Checkbox onChange={ handleCheckboxChange } value={ checked }>大写字符显示</Checkbox>
        <Button 
          onClick={ () => { setValue(''); setNumberData(emptyResult); } }
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
      <Form name="basic"labelCol={{ span: 2 }} autoComplete="off">
        <Form.Item label="十进制">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.dec } />
        </Form.Item>
        <Form.Item label="二进制">
          <TextArea readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.bin } />
        </Form.Item>
        <Form.Item label="八进制">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.oct } />
        </Form.Item>
        <Form.Item label="十六进制">
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.hex } />
        </Form.Item>
      </Form>
    </div>
  );
}

export default ColorConvert;