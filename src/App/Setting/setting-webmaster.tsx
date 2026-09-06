import { Form } from "antd";
import { IcoGeneratorSetting } from "../IcoGenerator/setting";
import { PlaceholderImageSetting } from "../PlaceholderImage/setting";

// 站长工具分类设置: ICO 生成 / 占位图片 (AppIcon 生成无设置项, WebTDK 等暂无设置)
export const SettingWebmaster = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <IcoGeneratorSetting />
      <PlaceholderImageSetting />
    </Form>
  )
}
