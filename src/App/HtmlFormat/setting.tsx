import { Divider, Form, Radio } from 'antd';
import { useState } from 'react';
import { getHtmlIndent, setHtmlIndent } from './lib';

const HtmlFormatSetting: React.FC = () => {
  const [indent, setIndent] = useState<number>(() => getHtmlIndent());
  return (
    <>
      <Divider orientation="left" plain>HTML 格式化</Divider>
      <Form.Item label="默认缩进">
        <Radio.Group
          value={indent}
          onChange={(e) => { setIndent(e.target.value); setHtmlIndent(e.target.value); }}
          optionType="button"
          buttonStyle="solid"
          options={[{ label: '2 空格', value: 2 }, { label: '4 空格', value: 4 }]}
        />
      </Form.Item>
    </>
  );
};

export default HtmlFormatSetting;
