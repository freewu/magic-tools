
import { Form } from "antd";
import { default as AESCryptoSetting } from "../AESCrypto/setting";
import { default as DESCryptoSetting } from "../DESCrypto/setting";
import { default as TripleDESCryptoSetting } from "../TripleDESCrypto/setting";
import { default as RabbitCryptoSetting } from "../RabbitCrypto/setting";
import { default as RC4CryptoSetting } from "../RC4Crypto/setting";

export const SettingCrypto = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <AESCryptoSetting />
      <DESCryptoSetting />
      <TripleDESCryptoSetting />
      <RabbitCryptoSetting />
      <RC4CryptoSetting />
    </Form>
  )
}