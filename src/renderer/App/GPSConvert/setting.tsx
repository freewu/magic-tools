import { Select, Form, Divider } from "antd";
import { getDefaultType, setDefaultType } from "./lib";
import { useState } from "react";
import { typeList } from "./data";

const GPSConvertSetting = () => {
  const [ type, setType ] = useState(getDefaultType()); // 默认坐标类型

  // // 应用列表
  // const getAppList = () => {
  //   const result = [{ value: 'AppStore', label: '应用中心' }];
  //   appList.forEach((v) => {
  //     result.push({ value: v.key, label:  v.label });
  //   });
  //   return result;
  // };

  return (
    <>
      <Divider orientation="left" plain>GPS坐标转换</Divider>
      <Form.Item label="默认坐标类型">
        <Select
          value={ type }
          style={{ width: 240 }}
          onChange={ (value: string) => { setType(value); setDefaultType(value); } }
          options={ typeList }
        />
      </Form.Item>
    </>
  );
}

export default GPSConvertSetting;