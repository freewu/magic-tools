import { Form } from "antd";
import { BCDCodecSetting } from "../BCDCodec/setting";
import { BaseXCodecSetting } from "../BaseXCodec/setting";
import { MorseCodecSetting } from "../MorseCodec/setting";
import { GzipCodecSetting } from "../GzipCodec/setting";

// 编解码分类设置 (对应首页「编解码」分类下带设置项的工具)
export const SettingCodec = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <BCDCodecSetting />
      <BaseXCodecSetting />
      <MorseCodecSetting />
      <GzipCodecSetting />
    </Form>
  )
}
