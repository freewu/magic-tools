import { Form, Switch, Divider, notification } from "antd";
import { getSiderFlag } from "../../lib/setting";
import { useState } from "react";

import { default as AppStoreSetting } from "../AppStore/setting";

const Setting = () => {
  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());

  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag',checked + "");
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
      <AppStoreSetting />
    </Form>
  );
}

export default Setting;