import { Form, Divider, Checkbox } from "antd";
import { useState } from "react";
import { getDefaultShowUppercase,setDefaultShowUppercase } from "./lib"

export const FileHashSetting = () => {

  const [ showUppercase, setShowUpperase ] = useState(getDefaultShowUppercase());

  return (
    <>
      <Divider orientation="left" plain>文件 Hash 值计算</Divider>
      <Form.Item label="结果大写字符展示" >
        <Checkbox 
          onChange={ () => { setShowUpperase(!showUppercase); setDefaultShowUppercase(!showUppercase);  } } 
          checked={ showUppercase } />
      </Form.Item>
    </>
  );
}
