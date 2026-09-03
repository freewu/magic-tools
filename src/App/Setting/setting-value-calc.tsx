import { Form } from "antd";
import { HashSetting } from "../Hash/setting";
import { PBKDF2CalcSetting } from "../PBKDF2Calc/setting";
import { HmacHashSetting } from "../HmacHash/setting";
import { BCCCheckSetting } from "../BCCCheck/setting";
import { LRCCheckSetting } from "../LRCCheck/setting";
import { CRCCheckSetting } from "../CRCCheck/setting";


export const SettingValueCalc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <HashSetting />
      <PBKDF2CalcSetting />
      <HmacHashSetting />
      <BCCCheckSetting />
      <LRCCheckSetting />
      <CRCCheckSetting />
    </Form>
  )
}