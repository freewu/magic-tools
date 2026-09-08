import { Form } from 'antd';
import { UrlExtractSetting } from '../UrlExtract/setting';

// 设置 - 站长工具: 各站长工具的可选项集中在此
export const SettingWebmaster = () => {
  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} layout="horizontal" style={{ maxWidth: 800 }}>
      <UrlExtractSetting />
    </Form>
  );
};
