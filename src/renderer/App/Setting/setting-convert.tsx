import { Form } from "antd";

import { GPSConvertSetting } from "../GPSConvert/setting";
import { ByteConvertSetting } from "../ByteConvert/setting";
import { TemperatureConvertSetting } from "../TemperatureConvert/setting";
import { DistanceConvertSetting } from "../DistanceConvert/setting";
import { ConfigConvertSetting } from "../ConfigConvert/setting";


export const SettingConvert = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <GPSConvertSetting />
      <ByteConvertSetting />
      <TemperatureConvertSetting />
      <DistanceConvertSetting />
      <ConfigConvertSetting />
    </Form>
  )
}