
import { Form } from "antd";
import { ColorSetting } from "../Color/setting";
import { RegexTesterSetting } from "../RegexTester/setting";
import { AsciiTextArtSetting } from "../AsciiTextArt/setting";
import { TeleprompterSetting } from "../Teleprompter/setting";
import { BOMCheckSetting } from "../BOMCheck/setting";
import { MetronomeSetting } from "../Metronome/setting";
import { ScreenRecorderSetting } from "../ScreenRecorder/setting";

export const SettingMisc = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <ColorSetting />
      <RegexTesterSetting />
      <AsciiTextArtSetting />
      <TeleprompterSetting />
      <BOMCheckSetting />
      <MetronomeSetting />
      <ScreenRecorderSetting />
    </Form>
  )
}