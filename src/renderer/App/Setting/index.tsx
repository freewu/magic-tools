import { Form, Switch, Divider, notification } from "antd";
import { getSiderFlag } from "../../lib/setting";
import { useState } from "react";
import "./setting.css";

import { default as AppStoreSetting } from "../AppStore/setting";
import { default as HashSetting } from "../Hash/setting";
import { default as ColorSetting } from "../Color/setting";
import { default as QRCodeGeneratorSetting } from "../QRCodeGenerator/setting";

const Setting = () => {
  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());

  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag',checked + "");
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
      <HashSetting />
      <ColorSetting />
      <QRCodeGeneratorSetting />
    </Form>
  );
}

export default Setting;