import { Divider, Form, Select, Slider } from 'antd';
import { useState } from 'react';
import { PART_OPTIONS, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN, type PartCount } from './data';
import {
  OUTPUT_FORMATS, getDefaultFormat, getDefaultParts, getDefaultQuality,
  setDefaultFormat, setDefaultParts, setDefaultQuality, type OutputFormat,
} from './lib';
import { isT } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 图片分割默认设置 (挂载到 设置 → 图片) */
export const ImageSplitSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ parts, setParts ] = useState<PartCount>(() => getDefaultParts());
  const [ format, setFormat ] = useState<OutputFormat>(() => getDefaultFormat());
  const [ quality, setQuality ] = useState<number>(() => getDefaultQuality());

  return (
    <>
      <Divider orientation="left" plain>{ st('图片分割') }</Divider>
      <Form.Item
        label={ st('默认分割份数') }
        extra={ rowT(locale, '打开「图片分割」工具时默认选中的份数, 默认 ${d} 份', { d: 4 }) }
      >
        <Select
          style={ { width: 280 } }
          value={ parts }
          onChange={ (v: PartCount) => { setParts(v); setDefaultParts(v); } }
          options={ PART_OPTIONS.map((v) => ({ value: v, label: isT(locale, '{n} 份', { n: v }) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认输出格式') }
        extra={ rowT(locale, '打开「图片分割」工具时默认的输出格式, 默认 ${d}', { d: 'PNG' }) }
      >
        <Select
          style={ { width: 280 } }
          value={ format }
          onChange={ (v: OutputFormat) => { setFormat(v); setDefaultFormat(v); } }
          options={ OUTPUT_FORMATS.map((v) => ({ value: v, label: v })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认 JPEG 质量') }
        extra={ rowT(locale, '仅输出 JPEG 时生效, 默认 ${d}', { d: QUALITY_DEFAULT }) }
      >
        <Slider
          style={ { width: 280 } }
          min={ QUALITY_MIN }
          max={ QUALITY_MAX }
          step={ 0.01 }
          value={ quality }
          onChange={ (v: number) => { setQuality(v); setDefaultQuality(v); } }
        />
      </Form.Item>
    </>
  );
};

export default ImageSplitSetting;
