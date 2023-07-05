
import { Form } from "antd";
import { default as HashSetting } from "../Hash/setting";
import { default as PBKDF2CalcSetting } from "../PBKDF2Calc/setting";

export const SettingValueCalc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <HashSetting />
      <PBKDF2CalcSetting />
    </Form>
  )
}