
import { Form } from "antd";
import { ColorSetting } from "../Color/setting";
import { HtpasswdGeneratorSetting } from "../HtpasswdGenerator/setting";
import { RegexTesterSetting } from "../RegexTester/setting";
import { AsciiTextArtSetting } from "../AsciiTextArt/setting";

export const SettingMisc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <ColorSetting />
      <HtpasswdGeneratorSetting />
      <RegexTesterSetting />
      <AsciiTextArtSetting />
    </Form>
  )
}