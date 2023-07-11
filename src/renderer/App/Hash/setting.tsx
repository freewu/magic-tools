import { Input, Form, Divider, Checkbox } from "antd";
const { TextArea } = Input;
import { useState } from "react";
import { getPasswordList,setPasswordList } from "./lib"
import { getDefaultShowUppercase,setDefaultShowUppercase } from "./lib"

export const HashSetting = () => {

  const [ value, setValue ] = useState(getPasswordList().join("\n"));
  const [ showUppercase, setShowUpperase ] = useState(getDefaultShowUppercase());

  const onTextAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    let arr = value.trim().split("\n");
    arr = arr.map((item) => { return item.trim().replaceAll(" ",""); }) // 去掉所有空格
    arr = arr.filter((item) => { return "" !== item.trim() });  // remove empty elements. 
    // if(arr.length >= 10) {
    //   setValue(arr.join("\n"));
    //   return false;
    // }
    setValue(value);
    // 更新配置信息
    setPasswordList(arr);
  };

  return (
    <>
      <Divider orientation="left" plain>Hash 值计算</Divider>
      <Form.Item label="展示默认字符串">
        <TextArea
          value= { value }
          onChange={ onTextAreaChange }
          placeholder="每行一条数据"
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
      <Form.Item label="结果大写字符展示" >
        <Checkbox 
          onChange={ () => { setShowUpperase(!showUppercase); setDefaultShowUppercase(!showUppercase);  } } 
          checked={ showUppercase } />
      </Form.Item>
    </>
  );
}