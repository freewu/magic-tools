import { Form } from "antd";
import { HashSetting } from "../Hash/setting";
import { SHA3HashSetting } from "../SHA3Hash/setting";
import { KeccakHashSetting } from "../KeccakHash/setting";
import { PBKDF2CalcSetting } from "../PBKDF2Calc/setting";
import { CMACCalcSetting } from "../CMACCalc/setting";
import { HKDFCalcSetting } from "../HKDFCalc/setting";
import { KMACCalcSetting } from "../KMACCalc/setting";
import { HmacHashSetting } from "../HmacHash/setting";
import { BCCCheckSetting } from "../BCCCheck/setting";
import { LRCCheckSetting } from "../LRCCheck/setting";
import { CRCCheckSetting } from "../CRCCheck/setting";


export const SettingValueCalc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <HashSetting />
      <SHA3HashSetting />
      <KeccakHashSetting />
      <PBKDF2CalcSetting />
      <CMACCalcSetting />
      <HKDFCalcSetting />
      <KMACCalcSetting />
      <HmacHashSetting />
      <BCCCheckSetting />
      <LRCCheckSetting />
      <CRCCheckSetting />
    </Form>
  )
}