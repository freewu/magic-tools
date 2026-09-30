import { Button, ColorPicker, Divider, Form, InputNumber, Select, Slider, Space, Switch, Typography } from 'antd';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';
import {
  BACKGROUND_DEFAULT, BACKGROUND_PRESETS, BG_BLUR_DEFAULT, BG_DIM_DEFAULT,
  BREAK_COLOR_DEFAULT, LONG_MIN_DEFAULT, REPEAT_DEFAULT, ROUNDS_BEFORE_LONG_DEFAULT,
  SHORT_MIN_DEFAULT, SOUND_KEYS, VOLUME_DEFAULT, WORK_COLOR_DEFAULT, WORK_MIN_DEFAULT,
  type SoundKey,
} from './data';
import { clampBlur, clampDim, clampMinutes, clampRounds, clampRepeat, clampVolume, getDefaultOptions, normalizeHex, patchDefaultOptions } from './lib';
import { u } from './lang';

const SOUND_TEXT: Record<SoundKey, string> = {
  ding: '叮 — 清脆',
  bell: '钟声 — 悠长',
  beep: '哔哔哔 — 三连',
  wood: '木鱼 — 短促',
  chime: '风铃 — 清脆高音',
  custom: '自定义音频',
};

/** 颜色选择控件 (预置色板 + 自定义) */
const ColorItem: React.FC<{ value: string; onChange: (hex: string) => void }> = ({ value, onChange }) => (
  <ColorPicker
    value={ value }
    presets={ BACKGROUND_PRESETS.map((g) => ({ label: g.label, colors: g.colors })) }
    onChange={ (v) => onChange(v.toHexString()) }
    showText
  />
);

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
        label={ st('默认时钟背景') }
        extra={ st('时钟舞台与全屏模式的背景色, 默认黑色') }
      >
        <ColorItem value={ opts.background } onChange={ (hex) => patch({ background: normalizeHex(hex, BACKGROUND_DEFAULT) }) } />
        { normalizeHex(opts.background, BACKGROUND_DEFAULT) !== opts.background && (
          <Typography.Text type="warning" style={ { fontSize: 12, marginLeft: 8 } }>{ st('非法颜色已回退默认') }</Typography.Text>
        ) }
      </Form.Item>
      <Form.Item
        label={ st('默认专注颜色') }
        extra={ st('专注阶段时间数字的颜色, 默认白色') }
      >
        <ColorItem value={ opts.workColor } onChange={ (hex) => patch({ workColor: normalizeHex(hex, WORK_COLOR_DEFAULT) }) } />
      </Form.Item>
      <Form.Item
        label={ st('默认休息颜色') }
        extra={ st('短休息 / 长休息阶段时间数字的颜色, 默认薄荷绿') }
      >
        <ColorItem value={ opts.breakColor } onChange={ (hex) => patch({ breakColor: normalizeHex(hex, BREAK_COLOR_DEFAULT) }) } />
      </Form.Item>
      <Form.Item
        label={ st('默认背景模式') }
        extra={ st('时钟背景使用纯色还是图片; 背景图片在工具页选择后「保存为默认设置」即可记住') }
      >
        <Select
          style={ { width: 160 } }
          value={ opts.bgMode }
          onChange={ (v) => patch({ bgMode: v }) }
          options={ [
            { value: 'color', label: st('纯色') },
            { value: 'image', label: st('图片') },
          ] }
        />
      </Form.Item>
      { opts.bgMode === 'image' && (
        <>
          <Form.Item
            label={ st('默认图片共用') }
            extra={ st('专注与休息共用同一张背景图; 关闭后可在工具页分别为专注与休息选图') }
          >
            <Switch checked={ opts.bgSameImage } onChange={ (v) => patch({ bgSameImage: v })} />
          </Form.Item>
          <Form.Item
            label={ st('默认遮罩') }
            extra={ rowT(locale, '图片上的黑色遮罩浓度, 越高时钟数字越清晰, 默认 ${n}%', { n: BG_DIM_DEFAULT }) }
          >
            <Slider min={ 0 } max={ 90 } value={ opts.bgDim } onChange={ (v) => patch({ bgDim: clampDim(v) }) } style={ { width: 260 } } />
          </Form.Item>
          <Form.Item
            label={ st('默认模糊') }
            extra={ rowT(locale, '背景图的模糊像素, 默认 ${n}px', { n: BG_BLUR_DEFAULT }) }
          >
            <Slider min={ 0 } max={ 20 } value={ opts.bgBlur } onChange={ (v) => patch({ bgBlur: clampBlur(v) }) } style={ { width: 260 } } />
          </Form.Item>
          <Form.Item
            label={ st('默认背景图') }
            extra={ st('这里仅能清除已保存的背景图; 更换图片请在工具页选择后「保存为默认设置」') }
          >
            <Space wrap size={ 8 }>
              <Typography.Text type="secondary" style={ { fontSize: 12 } }>
                { st(opts.bgSameImage ? '共用一张' : '专注') }: { opts.bgSameImage ? (opts.bgImage ? st('已设置') : st('未设置')) : (opts.bgFocusImage ? st('已设置') : st('未设置')) }
              </Typography.Text>
              { (opts.bgSameImage ? opts.bgImage : opts.bgFocusImage) !== '' && (
                <Button size="small" onClick={ () => patch(opts.bgSameImage ? { bgImage: '' } : { bgFocusImage: '' }) }>{ st('清除背景图') }</Button>
              ) }
              { !opts.bgSameImage && (
                <>
                  <Typography.Text type="secondary" style={ { fontSize: 12 } }>
                    { st('休息') }: { opts.bgBreakImage ? st('已设置') : st('未设置') }
                  </Typography.Text>
                  { opts.bgBreakImage !== '' && (
                    <Button size="small" onClick={ () => patch({ bgBreakImage: '' }) }>{ st('清除休息图') }</Button>
                  ) }
                </>
              ) }
            </Space>
          </Form.Item>
        </>
      ) }
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