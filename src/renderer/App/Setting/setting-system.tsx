import { getSiderFlag } from "../../lib/setting";
import { useState } from "react";
import { Form, Radio, Switch } from "antd";
import { AppStoreSetting } from "../AppStore/setting";
import { useTheme } from "../../hook/theme-context";

export const SettingSystem = () => {

  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());
  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag', checked + "");
  };

  // 显示模式 (浅色/深色/系统跟随), 与托盘菜单同步
  const { mode, setMode } = useTheme();

  return (
    <Form
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      style={{ maxWidth: 800 }}
    >
      <Form.Item label="显示模式">
        <Radio.Group
          value={ mode }
          onChange={ (e) => setMode(e.target.value as 'light' | 'dark' | 'system') }
        >
          <Radio value="light">浅色</Radio>
          <Radio value="dark">深色</Radio>
          <Radio value="system">系统跟随</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="默认展开右边栏">
        <Switch checked={ siderFlag } onChange={ onChangeSiderFlag } />
      </Form.Item>
      <AppStoreSetting />
    </Form>
  )
}