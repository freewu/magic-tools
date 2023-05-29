import { Select, Form, Divider, notification } from "antd";
import { getDefaultApp,setDefaultApp } from "./lib";
import { useState } from "react";
import { appList } from "../index";

const AppStoreSetting = () => {
  const [ app, setApp ] = useState(getDefaultApp()); // 默认展示的 app

  const onChangeDefaultApp = (value: string) => {
    setApp(value);
    setDefaultApp(value);
  };

  // 应用列表
  const getAppList = () => {
    const result = [{ value: 'AppStore', label: '应用中心' }];
    appList.forEach((v) => {
      result.push({ value: v.key, label:  v.label });
    });
    return result;
  };

  return (
    <>
      <Divider orientation="left" plain>应用中心</Divider>
      <Form.Item label="默认展示应用">
        <Select
          value={ app }
          style={{ width: 240 }}
          onChange={ onChangeDefaultApp }
          options={ getAppList() }
        />
      </Form.Item>
    </>
  );
}

export default AppStoreSetting;