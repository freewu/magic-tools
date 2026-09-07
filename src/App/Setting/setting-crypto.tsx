
import { Form } from "antd";
import { AESCryptoSetting } from "../AESCrypto/setting";
import { RSACryptoSetting } from "../RSACrypto/setting";
import { SM2CryptoSetting } from "../SM2Crypto/setting";
import { SM4CryptoSetting } from "../SM4Crypto/setting";
import { CaesarCryptoSetting } from "../CaesarCrypto/setting";
import { RailFenceCryptoSetting } from "../RailFenceCrypto/setting";
import { VigenereCryptoSetting } from "../VigenereCrypto/setting";
import { HillCryptoSetting } from "../HillCrypto/setting";
import { DESCryptoSetting } from "../DESCrypto/setting";
import { BlowfishCryptoSetting } from "../BlowfishCrypto/setting";
import { TripleDESCryptoSetting } from "../TripleDESCrypto/setting";
import { RabbitCryptoSetting } from "../RabbitCrypto/setting";
import { RC2CryptoSetting } from "../RC2Crypto/setting";
import { RC4CryptoSetting } from "../RC4Crypto/setting";
import { RC5CryptoSetting } from "../RC5Crypto/setting";
import { RC6CryptoSetting } from "../RC6Crypto/setting";
import { ChaCha20CryptoSetting } from "../ChaCha20Crypto/setting";
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
      <CaesarCryptoSetting />
      <RailFenceCryptoSetting />
      <VigenereCryptoSetting />
      <HillCryptoSetting />
      <DESCryptoSetting />
      <BlowfishCryptoSetting />
      <TripleDESCryptoSetting />
      <RabbitCryptoSetting />
      <RC2CryptoSetting />
      <RC4CryptoSetting />
      <RC5CryptoSetting />
      <RC6CryptoSetting />
      <ChaCha20CryptoSetting />
      <TEACryptoSetting />
      <XTEACryptoSetting />
      <XXTEACryptoSetting />
    </Form>
  )
}