import { Form, Switch, Divider, notification } from "antd";
import { getSiderFlag } from "../../lib/setting";
import { useState } from "react";
import "./setting.css";
import { debounce } from "../../lib";

import { default as AppStoreSetting } from "../AppStore/setting";
import { default as HashSetting } from "../Hash/setting";
import { default as ColorSetting } from "../Color/setting";
import { default as QRCodeGeneratorSetting } from "../QRCodeGenerator/setting";
import { default as AESCryptoSetting } from "../AESCrypto/setting";
import { default as DESCryptoSetting } from "../DESCrypto/setting";
import { default as TripleDESCryptoSetting } from "../TripleDESCrypto/setting";
import { default as RabbitCryptoSetting } from "../RabbitCrypto/setting";
import { default as RC4CryptoSetting } from "../RC4Crypto/setting";
import { default as PBKDF2CalcSetting } from "../PBKDF2Calc/setting";
import { default as BaseXCodecSetting } from "../BaseXCodec/setting";
import { default as GPSConvertSetting } from "../GPSConvert/setting";
import { default as ByteConvertSetting } from "../ByteConvert/setting";
import { default as TemperatureConvertSetting } from "../TemperatureConvert/setting";

const Setting = () => {
  const genSettingFormHeight = () => {
    return (window.innerHeight - 70) + "px";
  };

  const [ siderFlag, setSiderFlag ] = useState(getSiderFlag());
  const [ height, setHeight ] = useState(genSettingFormHeight()); // 窗口大小高度

  const onChangeSiderFlag = (checked: boolean) => {
    setSiderFlag(checked);
    localStorage.setItem('sider-flag',checked + "");
  };

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genSettingFormHeight()) },100) );

  return (
    <div style={ { height: height, overflowY: "auto" } }>
      <Form
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 18 }}
        layout="horizontal"
        style={{ maxWidth: 800 }}
      >
        <Form.Item label="默认展开右边栏">
          <Switch checked={ siderFlag } onChange={ onChangeSiderFlag } />
        </Form.Item>
        <AppStoreSetting />
        <HashSetting />
        <ColorSetting />
        <QRCodeGeneratorSetting />
        <AESCryptoSetting />
        <DESCryptoSetting />
        <TripleDESCryptoSetting />
        <RabbitCryptoSetting />
        <RC4CryptoSetting />
        <PBKDF2CalcSetting />
        {/* <BaseXCodecSetting /> */}
        <GPSConvertSetting />
        <ByteConvertSetting />
        <TemperatureConvertSetting />
      </Form>
    </div>
  );
}

export default Setting;