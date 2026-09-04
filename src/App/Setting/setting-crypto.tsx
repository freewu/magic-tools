
import { Form } from "antd";
import { AESCryptoSetting } from "../AESCrypto/setting";
import { RSACryptoSetting } from "../RSACrypto/setting";
import { SM2CryptoSetting } from "../SM2Crypto/setting";
import { SM4CryptoSetting } from "../SM4Crypto/setting";
import { DESCryptoSetting } from "../DESCrypto/setting";
import { TripleDESCryptoSetting } from "../TripleDESCrypto/setting";
import { RabbitCryptoSetting } from "../RabbitCrypto/setting";
import { RC4CryptoSetting } from "../RC4Crypto/setting";
import { TEACryptoSetting } from "../TEACrypto/setting";
import { XTEACryptoSetting } from "../XTEACrypto/setting";
import { XXTEACryptoSetting } from "../XXTEACrypto/setting";

export const SettingCrypto = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <AESCryptoSetting />
      <RSACryptoSetting />
      <SM2CryptoSetting />
      <SM4CryptoSetting />
      <DESCryptoSetting />
      <TripleDESCryptoSetting />
      <RabbitCryptoSetting />
      <RC4CryptoSetting />
      <TEACryptoSetting />
      <XTEACryptoSetting />
      <XXTEACryptoSetting />
    </Form>
  )
}