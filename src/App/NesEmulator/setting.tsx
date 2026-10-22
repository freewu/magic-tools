import { Button, Divider, Form, Segmented, Slider, Switch, message } from 'antd';
import { useState } from 'react';
import { DEFAULT_KEYS, SPEED_OPTIONS, VOLUME_MAX, VOLUME_MIN } from './data';
import { getDefaultOptions, normalizeKeys, patchDefaultOptions, type NesOptions } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** NES 模拟器默认设置 (挂载到 设置 → 游戏) */
export const NesEmulatorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<NesOptions>(() => getDefaultOptions());

  const patch = (p: Partial<NesOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('NES 模拟器') }</Divider>
      <Form.Item label={ st('默认音量') } extra={ st('进入模拟器时的音量, 页面里随时可调') }>
        <Slider
          min={ VOLUME_MIN }
          max={ VOLUME_MAX }
          value={ opts.volume }
          style={ { maxWidth: 320 } }
          tooltip={ { formatter: (v) => `${v ?? 0}%` } }
          onChange={ (v) => patch({ volume: Number(v) }) }
        />
      </Form.Item>
      <Form.Item label={ st('默认倍速') } extra={ st('默认以几倍速运行, 页面里随时可切换') }>
        <Segmented
          value={ opts.speed }
          onChange={ (v) => patch({ speed: Number(v) }) }
          options={ SPEED_OPTIONS.map((s) => ({ value: s, label: `${s}×` })) }
        />
      </Form.Item>
      <Form.Item label={ st('显示 FPS') } extra={ st('右上角显示实时帧率, 用于确认模拟速度是否正常') }>
        <Switch checked={ opts.showFps } onChange={ (v) => patch({ showFps: v }) } />
      </Form.Item>
      <Form.Item label={ st('像素平滑') } extra={ st('关闭时像素风锐利 (推荐), 打开后画面更柔和') }>
        <Switch checked={ opts.smooth } onChange={ (v) => patch({ smooth: v }) } />
      </Form.Item>
      <Form.Item label={ st('恢复默认键位') } extra={ st('键位可在模拟器页面里逐个重新绑定') }>
        <Button
          size="small"
          onClick={ () => {
            patch({ keys: normalizeKeys(DEFAULT_KEYS) });
            message.success(t('已恢复默认键位'));
          } }
        >
          { st('恢复默认键位') }
        </Button>
      </Form.Item>
    </>
  );
};

export default NesEmulatorSetting;
