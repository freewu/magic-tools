import { Divider, Form, InputNumber, Select, Slider, Switch, Typography } from 'antd';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';
import {
  LONG_MIN_DEFAULT, REPEAT_DEFAULT, ROUNDS_BEFORE_LONG_DEFAULT, SHORT_MIN_DEFAULT, SOUND_KEYS,
  VOLUME_DEFAULT, WORK_MIN_DEFAULT, type SoundKey,
} from './data';
import { clampMinutes, clampRounds, clampRepeat, clampVolume, getDefaultOptions, patchDefaultOptions } from './lib';
import { u } from './lang';

const SOUND_TEXT: Record<SoundKey, string> = {
  ding: '叮 — 清脆',
  bell: '钟声 — 悠长',
  beep: '哔哔哔 — 三连',
  wood: '木鱼 — 短促',
  chime: '风铃 — 清脆高音',
  custom: '自定义音频',
};

/** 番茄时钟默认设置 (挂载到 设置 → 其它) */
export const PomodoroSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ opts, setOpts ] = useState(() => getDefaultOptions());
  const patch = (p: Parameters<typeof patchDefaultOptions>[0]) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('番茄时钟') }</Divider>
      <Form.Item
        label={ st('默认专注时长') }
        extra={ rowT(locale, '专注阶段的分钟数, 默认 ${n} 分钟', { n: WORK_MIN_DEFAULT }) }
      >
        <InputNumber
          min={ 1 }
          max={ 180 }
          value={ opts.workMinutes }
          onChange={ (v) => patch({ workMinutes: clampMinutes(v, WORK_MIN_DEFAULT) }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认短休息时长') }
        extra={ rowT(locale, '短休息阶段的分钟数, 默认 ${n} 分钟', { n: SHORT_MIN_DEFAULT }) }
      >
        <InputNumber
          min={ 1 }
          max={ 60 }
          value={ opts.shortMinutes }
          onChange={ (v) => patch({ shortMinutes: clampMinutes(v, SHORT_MIN_DEFAULT) }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认长休息时长') }
        extra={ rowT(locale, '长休息阶段的分钟数, 默认 ${n} 分钟', { n: LONG_MIN_DEFAULT }) }
      >
        <InputNumber
          min={ 1 }
          max={ 120 }
          value={ opts.longMinutes }
          onChange={ (v) => patch({ longMinutes: clampMinutes(v, LONG_MIN_DEFAULT) }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认长休轮次') }
        extra={ rowT(locale, '每完成几个专注后进入长休息, 默认 ${n}', { n: ROUNDS_BEFORE_LONG_DEFAULT }) }
      >
        <InputNumber
          min={ 1 }
          max={ 12 }
          value={ opts.roundsBeforeLong }
          onChange={ (v) => patch({ roundsBeforeLong: clampRounds(v) }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认完成提示音') }
        extra={ st('阶段结束时的提示音; 「自定义音频」需在工具页选择文件') }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.sound }
          onChange={ (v) => patch({ sound: v }) }
          options={ SOUND_KEYS.map((k) => ({ value: k, label: u(locale, SOUND_TEXT[k]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认提示次数') }
        extra={ rowT(locale, '完成时提示音重复播放的次数, 默认 ${n} (1-5)', { n: REPEAT_DEFAULT }) }
      >
        <InputNumber
          min={ 1 }
          max={ 5 }
          value={ opts.repeatCount }
          onChange={ (v) => patch({ repeatCount: clampRepeat(v) }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认音量') }
        extra={ rowT(locale, '提示音音量, 默认 ${n}', { n: VOLUME_DEFAULT }) }
      >
        <Slider
          min={ 0 }
          max={ 100 }
          value={ opts.volume }
          onChange={ (v) => patch({ volume: clampVolume(v) }) }
          style={ { width: 260 } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认弹通知') }
        extra={ st('阶段完成时是否弹出浏览器系统通知') }
      >
        <Switch checked={ opts.notify } onChange={ (v) => patch({ notify: v })} />
      </Form.Item>
      <Form.Item
        label={ st('默认自动开始') }
        extra={ st('阶段结束后是否自动开始下一阶段') }
      >
        <Switch checked={ opts.autoNext } onChange={ (v) => patch({ autoNext: v })} />
      </Form.Item>
      <Typography.Paragraph type="secondary" style={ { fontSize: 12, marginBottom: 0 } }>
        { st('工具页的「保存为默认设置」可一键把当前参数存为这里的默认值; 默认值在打开工具页时生效') }
      </Typography.Paragraph>
    </>
  );
};

export default PomodoroSetting;