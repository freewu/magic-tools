
import { Form } from "antd";
import { QRCodeGeneratorSetting } from "../QRCodeGenerator/setting";
import { BarcodeGeneratorSetting } from "../BarcodeGenerator/setting";
import { HtpasswdGeneratorSetting } from "../HtpasswdGenerator/setting";
import { MockDataSetting } from "../MockData/setting";
import { SudokuGeneratorSetting } from "../SudokuGenerator/setting";
import { CopybookGeneratorSetting } from "../CopybookGenerator/setting";

// 生成器分类设置: 二维码 / 条形码 / htpasswd / 数据生成 / 数独 / 字帖 (密码生成、OTP、点阵字、Cron 暂无设置项)
export const SettingGenerator = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <QRCodeGeneratorSetting />
      <BarcodeGeneratorSetting />
      <HtpasswdGeneratorSetting />
      <MockDataSetting />
      <SudokuGeneratorSetting />
      <CopybookGeneratorSetting />
    </Form>
  )
}
