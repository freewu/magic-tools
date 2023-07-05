import { getSiderFlag } from "../../lib/setting";
import { useState } from "react";
import { Form, Switch } from "antd";
import { default as AppStoreSetting } from "../AppStore/setting";

export const SettingSystem = () => {

  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());
  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag', checked + "");
  };

  return (
    <Form
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      style={{ maxWidth: 800 }}
    >
      <Form.Item label="默认展开右边栏">
        <Switch checked={ siderFlag } onChange={ onChangeSiderFlag } />
      </Form.Item>
      <AppStoreSetting />
    </Form>
  )
}