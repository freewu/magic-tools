import { Divider, Form, Radio } from 'antd';
import { useState } from 'react';
import { getHtmlIndent, setHtmlIndent } from './lib';
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

const HtmlFormatSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [indent, setIndent] = useState<number>(() => getHtmlIndent());
  return (
    <>
      <Divider orientation="left" plain>{ st('HTML 格式化') }</Divider>
      <Form.Item label={ st('默认缩进') }>
        <Radio.Group
          value={indent}
          onChange={(e) => { setIndent(e.target.value); setHtmlIndent(e.target.value); }}
          optionType="button"
          buttonStyle="solid"
          options={[{ label: st('2 空格'), value: 2 }, { label: st('4 空格'), value: 4 }]}
        />
      </Form.Item>
    </>
  );
};

export default HtmlFormatSetting;
