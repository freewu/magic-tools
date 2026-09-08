import { Form } from "antd";
import { QRCodeGeneratorSetting } from "../QRCodeGenerator/setting";
import { BarcodeGeneratorSetting } from "../BarcodeGenerator/setting";
import { CodeShotSetting } from "../CodeShot/setting";

// 图片分类设置: 二维码 / 条形码 / 代码截图 (Base64 图片、ASCII 图片暂无设置项)
export const SettingImage = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <QRCodeGeneratorSetting />
      <BarcodeGeneratorSetting />
      <CodeShotSetting />
    </Form>
  )
}
