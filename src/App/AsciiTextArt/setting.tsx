import { Divider, Form, Input, Select } from 'antd';
import { useState } from 'react';
import { FONT_NAMES, getDefaultFont, getDefaultText, setDefaultFont, setDefaultText, DEFAULT_TEXT } from './lib';
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

/** ASCII 文字默认值设置 (挂载到 设置 → 其它) */
export const AsciiTextArtSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [font, setFont] = useState<string>(() => getDefaultFont());
  const [text, setText] = useState<string>(() => getDefaultText());

  return (
    <>
      <Divider orientation="left" plain>{ st('ASCII 文字') }</Divider>
      <Form.Item
        label={ st('默认文字') }
        extra={ rowT(locale, '打开页面时的初始内容, 默认值 ${d}, 留空则回退该值', { d: DEFAULT_TEXT }) }
      >
        <Input
          style={{ width: 320 }}
          value={text}
          placeholder={ DEFAULT_TEXT }
          allowClear
          onChange={(e) => { setText(e.target.value); setDefaultText(e.target.value); }}
        />
      </Form.Item>
      <Form.Item
        label={ st('默认字体') }
        extra={ rowT(locale, '共收录 ${FONT_NAMES.length} 款 figlet 字体', { 'FONT_NAMES.length': FONT_NAMES.length }) }
      >
        <Select
          style={{ width: 320 }}
          value={font}
          showSearch
          onChange={(v) => { setFont(v); setDefaultFont(v); }}
          filterOption={(kw, opt) => String(opt?.label ?? '').toLowerCase().includes(kw.toLowerCase())}
          options={FONT_NAMES.map((v) => ({ value: v, label: v }))}
        />
      </Form.Item>
    </>
  );
};

export default AsciiTextArtSetting;
