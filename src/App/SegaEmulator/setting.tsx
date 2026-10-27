import { Divider, Form, Slider, Switch } from 'antd';
import { useState } from 'react';
import { VOLUME_MAX, VOLUME_MIN } from './data';
import { getDefaultOptions, patchDefaultOptions, type SegaOptions } from './lib';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** Sega 模拟器默认设置 (挂载到 设置 → 游戏) */
export const SegaEmulatorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ opts, setOpts ] = useState<SegaOptions>(() => getDefaultOptions());

  const patch = (p: Partial<SegaOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('Sega 模拟器') }</Divider>
      <Form.Item
        label={ st('默认音量') }
        extra={ st('进入模拟器时的音量, 也可在模拟器底部菜单里随时调整') }
      >
        <Slider
          min={ VOLUME_MIN }
          max={ VOLUME_MAX }
          value={ opts.volume }
          style={ { maxWidth: 320 } }
          tooltip={ { formatter: (v) => `${v ?? 0}%` } }
          onChange={ (v) => patch({ volume: Number(v) }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('启动后自动全屏') }
        extra={ st('选好 ROM 后立刻进入全屏 (手机 / 平板建议开启)') }
      >
        <Switch
          checked={ opts.autoFullscreen }
          onChange={ (v) => patch({ autoFullscreen: v }) }
          data-testid="sega-auto-fullscreen"
        />
      </Form.Item>
    </>
  );
};

export default SegaEmulatorSetting;
