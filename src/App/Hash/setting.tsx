import { Input, Form, Divider, notification } from "antd";
const { TextArea } = Input;
import { useState } from "react";
import { getPasswordList,setPasswordList } from "./lib"


import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";
export const HashSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ value, setValue ] = useState(getPasswordList().join("\n"));

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
      <Divider orientation="left" plain>{ st('Hash 值计算') }</Divider>
      <Form.Item label={ st('展示默认字符串') }>
        <TextArea
          value= { value }
          onChange={ onTextAreaChange }
          placeholder={ st('每行一条数据') }
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
    </>
  );
}