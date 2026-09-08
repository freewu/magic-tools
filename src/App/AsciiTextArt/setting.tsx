import { Divider, Form, Select } from 'antd';
import { useState } from 'react';
import { FONT_NAMES, getDefaultFont, setDefaultFont } from './lib';

/** ASCII 文字默认值设置 (挂载到 设置 → 其它) */
export const AsciiTextArtSetting: React.FC = () => {
  const [font, setFont] = useState<string>(() => getDefaultFont());

  return (
    <>
      <Divider orientation="left" plain>ASCII 文字</Divider>
      <Form.Item
        label="默认字体"
        extra={`共收录 ${FONT_NAMES.length} 款 figlet 字体`}
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
