import { Divider, Form, Slider, Switch } from 'antd';
import { useState } from 'react';
import { PAD_OPACITY_DEFAULT, PAD_OPACITY_MAX, PAD_OPACITY_MIN, VOLUME_MAX, VOLUME_MIN } from './data';
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
      <Form.Item
        label={ st('显示游戏层虚拟按键') }
        extra={ st('在画面上浮出半透明按键, 触屏可直接当手柄用; 键盘 / 手柄按下会同步高亮') }
      >
        <Switch
          checked={ opts.showPad }
          onChange={ (v) => patch({ showPad: v }) }
          data-testid="sega-show-pad"
        />
      </Form.Item>
      <Form.Item
        label={ st('按键透明度') }
        extra={ st('调低可减少按键对画面的遮挡 (20% 几乎全透)') }
      >
        { /* antd 的 Slider 不转发 data-testid, 这里套一层容器作为定位 / 测试用的锚点 */ }
        <div data-testid="sega-pad-opacity" style={ { maxWidth: 320 } }>
          <Slider
            min={ PAD_OPACITY_MIN }
            max={ PAD_OPACITY_MAX }
            value={ opts.padOpacity }
            disabled={ !opts.showPad }
            tooltip={ { formatter: (v) => `${v ?? PAD_OPACITY_DEFAULT}%` } }
            onChange={ (v) => patch({ padOpacity: Number(v) }) }
          />
        </div>
      </Form.Item>
    </>
  );
};

export default SegaEmulatorSetting;
