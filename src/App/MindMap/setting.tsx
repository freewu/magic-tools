import { Divider, Form, Select } from 'antd';
import { useState } from 'react';
import { COLOR_DEFAULT, COLOR_SCHEMES, COLOR_SCHEME_KEYS, DEPTH_ALL, DEPTH_DEFAULT, DEPTH_OPTIONS, SAMPLES } from './data';
import { getDefaultColorScheme, getDefaultDepth, getDefaultSample, setDefaultColorScheme, setDefaultDepth, setDefaultSample } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 思维导图默认设置 (挂载到 设置 → 格式化) */
export const MindMapSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const depthText = (n: number) => (n === DEPTH_ALL ? st('全部展开') : rowT(locale, '仅展开 ${n} 层', { n }));

  const [ scheme, setScheme ] = useState(() => getDefaultColorScheme());
  const [ depth, setDepth ] = useState(() => getDefaultDepth());
  const [ sample, setSample ] = useState(() => getDefaultSample());

  return (
    <>
      <Divider orientation="left" plain>{ st('思维导图') }</Divider>
      <Form.Item
        label={ st('默认配色') }
        extra={ rowT(locale, '打开「思维导图」工具时默认使用的配色方案, 默认 ${d}', { d: u(locale, COLOR_SCHEMES[COLOR_DEFAULT].label) }) }
      >
        <Select
          style={ { width: 240 } }
          value={ scheme }
          onChange={ (v) => { setScheme(v); setDefaultColorScheme(v); } }
          options={ COLOR_SCHEME_KEYS.map((k) => ({ value: k, label: u(locale, COLOR_SCHEMES[k].label) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认展开层级') }
        extra={ rowT(locale, '打开「思维导图」工具时默认展开的层级, 默认 ${d}; 工具页可随时切换', { d: depthText(DEPTH_DEFAULT) }) }
      >
        <Select
          style={ { width: 240 } }
          value={ depth }
          onChange={ (v) => { setDepth(v); setDefaultDepth(v); } }
          options={ DEPTH_OPTIONS.map((n) => ({ value: n, label: depthText(n) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认示例') }
        extra={ st('打开「思维导图」工具时载入的大纲内容; 选「空白大纲」则从零开始写') }
      >
        <Select
          style={ { width: 240 } }
          value={ sample }
          onChange={ (v) => { setSample(v); setDefaultSample(v); } }
          options={ [
            { value: '', label: st('空白大纲 (不载入示例)') },
            ...SAMPLES.map((s) => ({ value: s.id, label: u(locale, s.label) })),
          ] }
        />
      </Form.Item>
    </>
  );
};

export default MindMapSetting;
