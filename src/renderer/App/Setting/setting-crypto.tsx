
import { Form } from "antd";
import { AESCryptoSetting } from "../AESCrypto/setting";
import { DESCryptoSetting } from "../DESCrypto/setting";
import { TripleDESCryptoSetting } from "../TripleDESCrypto/setting";
import { RabbitCryptoSetting } from "../RabbitCrypto/setting";
import { RC4CryptoSetting } from "../RC4Crypto/setting";

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