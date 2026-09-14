import { Divider, Form, Select } from 'antd';
import { useState } from 'react';
import { COLOR_FORMATS, FORMAT_DEFAULT, getDefaultFormat, setDefaultFormat, type ColorFormat } from './lib';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 图片主题色默认设置 (挂载到 设置 → 图片) */
export const ImageColorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ format, setFormat ] = useState<ColorFormat>(() => getDefaultFormat());

  return (
    <>
      <Divider orientation="left" plain>{ st('图片主题色') }</Divider>
      <Form.Item
        label={ st('默认颜色格式') }
        extra={ rowT(locale, '打开「图片主题色」工具时默认展示的颜色格式, 默认 ${d}; 工具页可随时切换', { d: FORMAT_DEFAULT }) }
      >
        <Select
          style={ { width: 320 } }
          value={ format }
          onChange={ (v: ColorFormat) => { setFormat(v); setDefaultFormat(v); } }
          options={ COLOR_FORMATS.map((v) => ({ value: v, label: v })) }
        />
      </Form.Item>
    </>
  );
};

export default ImageColorSetting;
