import { Select, Form, Switch, Divider, notification } from "antd";
import { getSiderFlag, getDefaultApp } from "../../lib/setting";
import { useState } from "react";
import { appList } from "../index";

const Setting = () => {
  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());
  const [ defaultApp, setDefaultApp ] = useState(getDefaultApp());

  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag',checked + "");
  };

  const onChangeDefaultApp = (value: string) => {
    setDefaultApp(value);
    localStorage.setItem('default-app',value);
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
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      style={{ maxWidth: 800 }}
    >
      <Form.Item label="默认展开右边栏">
        <Switch checked={ siderFlag } onChange={ onChangeSiderFlag } />
      </Form.Item>
      <Divider/>
      <Form.Item label="默认展示应用">
        <Select
          value={ defaultApp }
          style={{ width: 240 }}
          onChange={ onChangeDefaultApp }
          options={ getAppList() }
        />
      </Form.Item>
      <Divider/>
    </Form>
  );
}

export default Setting;