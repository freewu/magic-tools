
import { Form } from "antd";
import { ColorSetting } from "../Color/setting";
import { QRCodeGeneratorSetting } from "../QRCodeGenerator/setting";
import { BarcodeGeneratorSetting } from "../BarcodeGenerator/setting";
import { HtpasswdGeneratorSetting } from "../HtpasswdGenerator/setting";

export const SettingMisc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <ColorSetting />
      <QRCodeGeneratorSetting />
      <BarcodeGeneratorSetting />
      <HtpasswdGeneratorSetting />
    </Form>
  )
}