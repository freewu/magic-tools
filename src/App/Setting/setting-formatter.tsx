import { Form, Typography } from "antd";

const { Text } = Typography;

// 格式化分类: JSON 格式化 / JSON5 格式化 / SQL 格式化
// 目前这些工具暂无可独立配置项; 后续新增设置时在下方 <XXXSetting /> 挂载
export const SettingFormatter = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <Text type="secondary">JSON 格式化 / JSON5 格式化 / SQL 格式化 暂无独立设置项</Text>
    </Form>
  )
}
