import { Divider, Form, Select } from 'antd';
import { useState } from 'react';
import { PRESET_DEFAULT, PRESET_DEFS, type FixedPreset } from './data';
import { getDefaultPreset, setDefaultPreset } from './lib';
import { PRESET_HINTS, PRESET_TEXT, pa } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 像素图默认设置 (挂载到 设置 → 图片) */
export const PixelArtSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ preset, setPreset ] = useState<FixedPreset>(() => getDefaultPreset());

  return (
    <>
      <Divider orientation="left" plain>{ st('像素图') }</Divider>
      <Form.Item
        label={ st('默认快捷配置') }
        extra={ rowT(locale, '打开「像素图」工具时默认应用的快捷配置, 默认 ${d}', { d: pa(locale, PRESET_TEXT[PRESET_DEFAULT]) }) }
      >
        <Select<FixedPreset>
          style={ { width: 260 } }
          value={ preset }
          onChange={ (v) => { setPreset(v); setDefaultPreset(v); } }
          options={ (Object.keys(PRESET_DEFS) as FixedPreset[]).map((k) => ({
            value: k,
            label: `${pa(locale, PRESET_TEXT[k])} · ${pa(locale, PRESET_HINTS[k])}`,
          })) }
        />
      </Form.Item>
    </>
  );
};

export default PixelArtSetting;
