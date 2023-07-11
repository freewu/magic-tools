
import { Form } from "antd";
import { HashSetting } from "../Hash/setting";
import { PBKDF2CalcSetting } from "../PBKDF2Calc/setting";
import { HmacHashSetting } from "../HmacHash/setting";


export const SettingValueCalc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <HashSetting />
      <PBKDF2CalcSetting />
      <HmacHashSetting />
    </Form>
  )
}