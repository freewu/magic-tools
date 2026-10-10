import { Divider, Form, InputNumber, Segmented, Select, Slider, Switch } from 'antd';
import { useState } from 'react';
import {
  BEATS_DEFAULT, BEATS_MAX, BEATS_MIN, BPM_DEFAULT, BPM_MAX, BPM_MIN, COUNTDOWN_OPTIONS,
  SUBDIVISION_OPTIONS, TIMBRE_KEYS, VOLUME_DEFAULT, VOLUME_MAX, VOLUME_MIN, type TimbreKey,
} from './data';
import {
  clampBeats, clampBpm, clampCountdown, clampSubdivision, clampVolume, getDefaultOptions,
  normalizeTimbre, patchDefaultOptions,
} from './lib';
import { u, uT } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

const TIMBRE_TEXT: Record<TimbreKey, string> = {
  click: '电子嘀嗒',
  beep: '正弦蜂鸣',
  wood: '木鱼',
};

/** 节拍器默认设置 (挂载到 设置 → 其它) */
export const MetronomeSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);

  const [ opts, setOpts ] = useState(() => getDefaultOptions());
  const patch = (p: Parameters<typeof patchDefaultOptions>[0]) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('节拍器') }</Divider>
      <Form.Item
        label={ st('默认速度 (BPM)') }
        extra={ rowT(locale, '打开「节拍器」时使用的初始速度, 默认 ${n}; 工具页可随时调整', { n: BPM_DEFAULT }) }
      >
        <Slider
          min={ BPM_MIN }
          max={ BPM_MAX }
          value={ opts.bpm }
          onChange={ (v) => patch({ bpm: clampBpm(v) }) }
          style={ { width: 260, marginTop: 6 } }
        />
        <InputNumber
          size="small"
          min={ BPM_MIN }
          max={ BPM_MAX }
          value={ opts.bpm }
          onChange={ (v) => patch({ bpm: clampBpm(v) }) }
          style={ { width: 78, marginLeft: 12 } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认拍号') }
        extra={ rowT(locale, '每小节的拍数, 默认 ${n} 拍', { n: BEATS_DEFAULT }) }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.beats }
          onChange={ (v) => patch({ beats: clampBeats(v) }) }
          options={ Array.from({ length: BEATS_MAX - BEATS_MIN + 1 }, (_, i) => BEATS_MIN + i)
            .map((n) => ({ value: n, label: uT(locale, '{n} 拍 / 小节', { n }) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认细分') }
        extra={ st('每拍再打几下, 默认不细分') }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.subdivision }
          onChange={ (v) => patch({ subdivision: clampSubdivision(v) }) }
          options={ SUBDIVISION_OPTIONS.map((n) => ({
            value: n,
            label: n === 1 ? t('不细分') : uT(locale, '{n} 连音', { n }),
          })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认倒计时秒数') }
        extra={ st('开始前按秒倒计时 (0 = 关闭); 每秒一个预备拍, 圆点上跳动剩余秒数, 数完进入正拍') }
      >
        <Segmented
          value={ opts.countdown }
          onChange={ (v) => patch({ countdown: clampCountdown(v) }) }
          options={ COUNTDOWN_OPTIONS.map((n) => ({
            value: n,
            label: n === 0 ? st('关闭') : uT(locale, '{n} 秒', { n }),
          })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认音量') }
        extra={ rowT(locale, '打点音量 (0 即静音), 默认 ${n}', { n: VOLUME_DEFAULT }) }
      >
        <Slider
          min={ VOLUME_MIN }
          max={ VOLUME_MAX }
          value={ opts.volume }
          onChange={ (v) => patch({ volume: clampVolume(v) }) }
          style={ { width: 260, marginTop: 6 } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认音色') }
        extra={ st('三种本地合成音, 不加载任何音频文件') }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.timbre }
          onChange={ (v) => patch({ timbre: normalizeTimbre(v) }) }
          options={ TIMBRE_KEYS.map((k) => ({ value: k, label: t(TIMBRE_TEXT[k]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认首拍重音') }
        extra={ st('开启后每小节第一拍更响, 便于听出小节线') }
      >
        <Switch checked={ opts.accent } onChange={ (v) => patch({ accent: v }) } />
      </Form.Item>
    </>
  );
};

export default MetronomeSetting;
