import { Select, Form, Divider, notification } from "antd";
import { getDefaultApp,setDefaultApp } from "./lib";
import { useState } from "react";
import { appList } from "../index";

export const AppStoreSetting = () => {
  const [ app, setApp ] = useState(getDefaultApp()); // 默认展示的 app

  const onChangeDefaultApp = (value: string) => {
    setApp(value);
    setDefaultApp(value);
  };

  const findAppList = (type :string) => {
    return appList
      .filter((item) => { return item.type === type })
      .map((item) => { return { value: item.key, label: item.label } });
  }

  // 应用列表
  const getAppList = () => {
    return [
      {
        label: '系统',
        options: [
          { value: 'AppStore', label: '应用中心' },
          { value: 'Help', label: '帮助' },
          { value: 'Setting', label: '设置' },
        ],
      },
      { label: '类型转换', options: findAppList('convert') },
      { label: '编解码', options: findAppList('codec') },
      { label: '加解密', options: findAppList('crypto') },
      { label: '值计算', options: findAppList('value-calc') },
      { label: '图片颜色', options: findAppList('img-color') },
      { label: '其它', options: findAppList('misc') },
    ];
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