import { Button, Divider, Form, Segmented, Slider, Switch, message } from 'antd';
import { useState } from 'react';
import { DEFAULT_KEYS, PAD_OPACITY_MAX, PAD_OPACITY_MIN, SPEED_OPTIONS, VOLUME_MAX, VOLUME_MIN } from './data';
import { clearSram, getDefaultOptions, getSramEntries, normalizeKeys, patchDefaultOptions, type GbOptions } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** GameBoy 模拟器默认设置 (挂载到 设置 → 游戏) */
export const GameBoySetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<GbOptions>(() => getDefaultOptions());
  const [ sramCount, setSramCount ] = useState(() => getSramEntries().length);

  const patch = (p: Partial<GbOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('GameBoy 模拟器') }</Divider>
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
      <Form.Item
        label={ st('全屏虚拟按键') }
        extra={ st('全屏时在画面下方浮出触摸按键, 键盘 / 手柄按下也会同步高亮') }
      >
        <Switch checked={ opts.showPad } onChange={ (v) => patch({ showPad: v }) } data-testid="gb-show-pad" />
      </Form.Item>
      <Form.Item label={ st('按键透明度') } extra={ st('调低可减少按键对画面的遮挡 (20% 几乎全透)') }>
        <Slider
          min={ PAD_OPACITY_MIN }
          max={ PAD_OPACITY_MAX }
          step={ 5 }
          value={ opts.padOpacity }
          disabled={ !opts.showPad }
          style={ { maxWidth: 320 } }
          tooltip={ { formatter: (v) => `${v ?? 0}%` } }
          onChange={ (v) => patch({ padOpacity: Number(v) }) }
        />
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
      <Form.Item label={ st('清空电池存档') } extra={ st('电池存档按 ROM 名称保存在本机浏览器, 清空后 RPG 进度会丢失') }>
        <Button
          size="small"
          danger
          disabled={ sramCount === 0 }
          onClick={ () => {
            clearSram();
            setSramCount(0);
            message.success(st('已清空电池存档'));
          } }
        >
          { `${st('清空电池存档')} (${sramCount})` }
        </Button>
      </Form.Item>
    </>
  );
};

export default GameBoySetting;
