
import { Form } from "antd";
import { default as ColorSetting } from "../Color/setting";
import { default as QRCodeGeneratorSetting } from "../QRCodeGenerator/setting";

export const SettingMisc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <ColorSetting />
      <QRCodeGeneratorSetting />
    </Form>
  )
}