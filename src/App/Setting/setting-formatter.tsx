import { Form } from "antd";
import HtmlFormatSetting from "../HtmlFormat/setting";
import MindMapSetting from "../MindMap/setting";

// 格式化分类: JSON 格式化 / JSON5 格式化 / SQL 格式化 / HTML 格式化 / SVG 格式化 / 中英文自动排版 / 思维导图
// JSON/JSON5/SQL/SVG/CnEn 暂无独立配置项; HTML 格式化提供默认缩进设置; 思维导图提供默认配色 / 展开层级 / 示例
export const SettingFormatter = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <HtmlFormatSetting />
      <MindMapSetting />
    </Form>
  )
}
