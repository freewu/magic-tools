import { Checkbox, ColorPicker, Divider, Form, InputNumber, Select } from 'antd';
import { useState } from 'react';
import {
  COLORS_MAX, COLORS_MIN, DELAY_MAX, DELAY_MIN, DITHER_TEXT, FIT_MODES, FIT_TEXT, LOOP_MAX, LOOP_MIN,
  getGenDefaults, normalizeColor, normalizeDelay, normalizeColors, normalizeDither, normalizeFit, normalizeLoop,
  setGenDefault, type FitMode,
} from './lib';
import { GIF_DITHERS, type GifDither } from '../../lib/gif';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** GIF 生成默认设置 (挂载到 设置 → 图片): 帧延时 / 循环 / 颜色数 / 抖动 / 尺寸模式 / 背景色 */
export const GifGeneratorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const gt = (zh: string, vars?: Record<string, string | number>) => rowT(locale, zh, vars);
  const [ state, setState ] = useState(() => getGenDefaults());
  const [ transparent, setTransparent ] = useState(state.bg === '');

  const patch = <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setGenDefault(key, value);
  };

  return (
    <>
      <Divider orientation="left" plain>{ st('GIF 生成') }</Divider>
      <Form.Item
        label={ st('默认帧延时') }
        extra={ gt('打开「GIF 生成」时每帧的默认延时时长 (ms), 默认 ${d}', { d: 100 }) }
      >
        <InputNumber
          style={ { width: 260 } }
          min={ DELAY_MIN }
          max={ DELAY_MAX }
          step={ 10 }
          value={ state.delay }
          onChange={ (v) => patch('delay', normalizeDelay(v)) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认循环次数 (0 为无限)') }
        extra={ gt('默认循环次数 (0 = 无限循环), 默认 ${d}', { d: 0 }) }
      >
        <InputNumber
          style={ { width: 260 } }
          min={ LOOP_MIN }
          max={ LOOP_MAX }
          value={ state.loop }
          onChange={ (v) => patch('loop', normalizeLoop(v)) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认最大颜色数') }
        extra={ gt('调色板的最大颜色数 (2-255), 越少文件越小, 默认 ${d}', { d: COLORS_MAX }) }
      >
        <InputNumber
          style={ { width: 260 } }
          min={ COLORS_MIN }
          max={ COLORS_MAX }
          value={ state.colors }
          onChange={ (v) => patch('colors', normalizeColors(v)) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认抖动') }
        extra={ gt('减色时使用的抖动算法, 渐变色更细腻但文件略大') }
      >
        <Select<GifDither>
          style={ { width: 260 } }
          value={ state.dither }
          onChange={ (v) => patch('dither', normalizeDither(v)) }
          options={ GIF_DITHERS.map((d) => ({ value: d, label: _r(locale, DITHER_TEXT[d]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认尺寸模式') }
        extra={ gt('多张图片尺寸不一致时如何放入画布, 默认 ${d}', { d: _r(locale, FIT_TEXT.contain) }) }
      >
        <Select<FitMode>
          style={ { width: 260 } }
          value={ state.fit }
          onChange={ (v) => patch('fit', normalizeFit(v)) }
          options={ FIT_MODES.map((m) => ({ value: m, label: _r(locale, FIT_TEXT[m]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认背景色') }
        extra={ gt('画布留白处填充的颜色, 留空表示透明') }
      >
        <Checkbox
          checked={ transparent }
          onChange={ (e) => { setTransparent(e.target.checked); patch('bg', e.target.checked ? '' : '#ffffff'); } }
        >{ st('透明') }</Checkbox>
        <ColorPicker
          style={ { marginLeft: 12 } }
          disabled={ transparent }
          value={ state.bg === '' ? '#ffffff' : state.bg }
          onChangeComplete={ (c) => patch('bg', normalizeColor(c.toHexString(), state.bg === '' ? '#ffffff' : state.bg)) }
        />
      </Form.Item>
    </>
  );
};

export default GifGeneratorSetting;
