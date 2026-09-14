import { Divider, Form, Select, Slider, Switch } from 'antd';
import { useState } from 'react';
import { PERCENT_DEFAULT, PERCENT_MAX, PERCENT_MIN, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN } from './data';
import {
  OUTPUT_FORMATS, getDefaultFormat, getDefaultPercent, getDefaultQuality, getLockRatio,
  setDefaultFormat, setDefaultPercent, setDefaultQuality, setLockRatio, type OutputFormat,
} from './lib';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 图片尺寸调整默认设置 (挂载到 设置 → 图片) */
export const ImageResizeSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ percent, setPercent ] = useState<number>(() => getDefaultPercent());
  const [ format, setFormat ] = useState<OutputFormat>(() => getDefaultFormat());
  const [ quality, setQuality ] = useState<number>(() => getDefaultQuality());
  const [ lock, setLock ] = useState<boolean>(() => getLockRatio());

  return (
    <>
      <Divider orientation="left" plain>{ st('图片尺寸调整') }</Divider>
      <Form.Item
        label={ st('默认缩放比例') }
        extra={ rowT(locale, '按比例模式打开「图片尺寸调整」时默认的缩放比例, 默认 ${d}%', { d: PERCENT_DEFAULT }) }
      >
        <Slider
          style={ { width: 280 } }
          min={ PERCENT_MIN }
          max={ PERCENT_MAX }
          step={ 1 }
          value={ percent }
          onChange={ (v: number) => { setPercent(v); setDefaultPercent(v); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认输出格式') }
        extra={ rowT(locale, '打开「图片尺寸调整」工具时默认的输出格式, 默认 ${d}', { d: 'PNG' }) }
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
      <Form.Item
        label={ st('默认锁定宽高比') }
        extra={ rowT(locale, '按像素模式下默认是否锁定宽高比, 默认 ${d}', { d: '开启' }) }
      >
        <Switch
          checked={ lock }
          onChange={ (v: boolean) => { setLock(v); setLockRatio(v); } }
        />
      </Form.Item>
    </>
  );
};

export default ImageResizeSetting;
