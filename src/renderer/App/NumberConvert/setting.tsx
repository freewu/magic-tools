import { Input, Form, Divider, Checkbox, Select } from "antd";
const { TextArea } = Input;
import { useState } from "react";
import { numberTypeList } from "./data"
import { getDefaultShowUppercase,setDefaultShowUppercase } from "./lib"
import { getDefaultType,setDefaultType } from "./lib"
import { getDefaultHumanRead,setDefaultHumanRead } from "./lib"

export const NumberConvertSetting = () => {

  const [ type, setType ] = useState(getDefaultType());
  const [ showUppercase, setShowUpperase ] = useState(getDefaultShowUppercase());
  const [ humanRead, setHumanRead ] = useState(getDefaultHumanRead());

  return (
    <>
      <Divider orientation="left" plain>进制转换</Divider>
      <Form.Item label="默认进制">
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (v :string) => { setType(v); setDefaultType(v); } }
          options={ numberTypeList }
        />
      </Form.Item>
      <Form.Item label="结果大写字符展示" >
        <Checkbox 
          onChange={ () => { setShowUpperase(!showUppercase); setDefaultShowUppercase(!showUppercase);  } } 
          checked={ showUppercase } />
      </Form.Item>
      <Form.Item label="结果插入空格" >
        <Checkbox 
          onChange={ () => { setHumanRead(!humanRead); setDefaultHumanRead(!humanRead);  } } 
          checked={ humanRead } />
      </Form.Item>
    </>
  );
}