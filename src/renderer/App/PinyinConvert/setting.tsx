import { Select, Form, Divider, Checkbox } from "antd";
import { getDefaultShowTone, setDefaultShowTone } from "./lib";
import { useState } from "react";

export const PinyinConvertSetting = () => {

  const [ showTone, setShowTone ] = useState(getDefaultShowTone());

  return (
    <>
      <Divider orientation="left" plain>中文拼音</Divider>
      <Form.Item label="是否显示声调" >
        <Checkbox 
          onChange={ () => { setShowTone(!showTone); setDefaultShowTone(!showTone);  } } 
          checked={ showTone } />
      </Form.Item>
    </>
  );
}