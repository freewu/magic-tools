import { Divider, Form, Input, Select } from 'antd';
import { useState } from 'react';
import {
  AUDIO_OPTIONS, BITRATE_OPTIONS, FILE_PREFIX_DEFAULT, FPS_OPTIONS, SIZE_OPTIONS,
  type AudioMode, type SizeKey,
} from './data';
import {
  clampBitrate, clampFps, getDefaultOptions, normalizePrefix, patchDefaultOptions,
} from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

const BITRATE_TEXT: Record<number, string> = {
  2_000_000: '2 Mbps · 省空间',
  4_000_000: '4 Mbps · 均衡',
  8_000_000: '8 Mbps · 清晰',
  16_000_000: '16 Mbps · 极清 (文件大)',
};

const AUDIO_TEXT: Record<AudioMode, string> = {
  none: '不录声音',
  system: '系统声音 (屏幕 / 标签页)',
  both: '系统声音 + 麦克风',
};

const SIZE_TEXT: Record<SizeKey, string> = {
  source: '原始分辨率',
  '1080p': '最高 1080p',
  '720p': '最高 720p',
};

/** 屏幕录制默认设置 (挂载到 设置 → 其它) */
export const ScreenRecorderSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);

  const [ opts, setOpts ] = useState(() => getDefaultOptions());
  const patch = (p: Parameters<typeof patchDefaultOptions>[0]) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('屏幕录制') }</Divider>
      <Form.Item
        label={ st('默认帧率') }
        extra={ st('30 fps 通用; 文字演示可用 15, 游戏 / 动画用 60') }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.fps }
          onChange={ (v) => patch({ fps: clampFps(v) }) }
          options={ FPS_OPTIONS.map((n) => ({ value: n, label: `${n} fps` })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认画质') }
        extra={ st('码率越高越清晰, 文件也越大; 每分钟体积 = 码率 ÷ 8 × 60') }
      >
        <Select
          style={ { width: 240 } }
          value={ opts.bitrate }
          onChange={ (v) => patch({ bitrate: clampBitrate(v) }) }
          options={ BITRATE_OPTIONS.map((v) => ({ value: v, label: t(BITRATE_TEXT[v]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认声音') }
        extra={ st('系统声音需在共享选择器里勾选「分享音频」; 麦克风会额外申请权限') }
      >
        <Select
          style={ { width: 240 } }
          value={ opts.audio }
          onChange={ (v) => patch({ audio: v }) }
          options={ AUDIO_OPTIONS.map((a) => ({ value: a, label: t(AUDIO_TEXT[a]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认分辨率上限') }
        extra={ st('「原始分辨率」不缩放; 其余只限制上限, 不会放大画面') }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.size }
          onChange={ (v) => patch({ size: v }) }
          options={ SIZE_OPTIONS.map((s) => ({ value: s.value, label: t(SIZE_TEXT[s.value]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认文件名前缀') }
        extra={ rowT(locale, '保存时的文件名前缀, 默认 ${p}; 实际文件名会追加时间戳 (非法字符会被去掉)', { p: FILE_PREFIX_DEFAULT }) }
      >
        <Input
          style={ { width: 240 } }
          value={ opts.prefix }
          maxLength={ 40 }
          placeholder={ FILE_PREFIX_DEFAULT }
          onChange={ (e) => patch({ prefix: normalizePrefix(e.target.value) }) }
        />
      </Form.Item>
    </>
  );
};

export default ScreenRecorderSetting;
