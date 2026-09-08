import { Form } from "antd";
import { IcoGeneratorSetting } from "../IcoGenerator/setting";

// 站长工具分类设置: ICO 生成 (AppIcon 生成无设置项, WebTDK 等暂无设置; 占位图片设置已随工具移至图片分类)
export const SettingWebmaster = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <IcoGeneratorSetting />
    </Form>
  )
}
