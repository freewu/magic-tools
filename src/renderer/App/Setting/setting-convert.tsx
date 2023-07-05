import { Form } from "antd";

import { default as GPSConvertSetting } from "../GPSConvert/setting";
import { default as ByteConvertSetting } from "../ByteConvert/setting";
import { default as TemperatureConvertSetting } from "../TemperatureConvert/setting";
import { default as DistanceConvertSetting } from "../DistanceConvert/setting";

export const SettingConvert = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <GPSConvertSetting />
      <ByteConvertSetting />
      <TemperatureConvertSetting />
      <DistanceConvertSetting />
    </Form>
  )
}