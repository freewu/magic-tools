// 聊天生成器默认设置 (挂载到 设置 → 生成器)
import { Divider, Form, Input, Select, Switch } from 'antd';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';
import {
  PLATFORMS, SCALES, TITLE_DEFAULT, TITLE_MAX,
  type ChatScale, type PlatformId,
} from './data';
import {
  getDefaultPlatform, getDefaultScale, getDefaultShowInputBar, getDefaultShowNames, getDefaultTitle,
  platformLabel, setDefaultPlatform, setDefaultScale, setDefaultShowInputBar, setDefaultShowNames, setDefaultTitle,
} from './lib';

/** 聊天生成器默认设置 */
export const ChatGeneratorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);

  const [ platform, setPlatform ] = useState<PlatformId>(() => getDefaultPlatform());
  const [ title, setTitle ] = useState<string>(() => getDefaultTitle());
  const [ scale, setScale ] = useState<ChatScale>(() => getDefaultScale());
  const [ showInput, setShowInput ] = useState<boolean>(() => getDefaultShowInputBar());
  const [ showNames, setShowNames ] = useState<boolean>(() => getDefaultShowNames());

  return (
    <>
      <Divider orientation="left" plain>{ st('聊天生成器') }</Divider>
      <Form.Item
        label={ st('默认平台') }
        extra={ rowT(locale, '打开「聊天生成器」时默认选中的平台, 默认 ${d}', { d: platformLabel('wechat') }) }
      >
        <Select
          size="small"
          style={ { width: 220 } }
          value={ platform }
          onChange={ (v :PlatformId) => { setPlatform(v); setDefaultPlatform(v); } }
          options={ PLATFORMS.map((p) => ({ value: p.id, label: p.label })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认聊天标题') }
        extra={ rowT(locale, '打开「聊天生成器」时填入的默认聊天标题, 默认 ${d}', { d: TITLE_DEFAULT }) }
      >
        <Input
          value={ title }
          style={ { width: 320 } }
          maxLength={ TITLE_MAX }
          onChange={ (e) => { setTitle(e.target.value); setDefaultTitle(e.target.value); } }
          onBlur={ () => setTitle(getDefaultTitle()) }
          placeholder={ TITLE_DEFAULT }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认导出倍率') }
        extra={ rowT(locale, '导出 PNG 的像素倍率 (1x / 2x / 3x), 默认 ${d}x', { d: getDefaultScale() }) }
      >
        <Select
          size="small"
          style={ { width: 120 } }
          value={ scale }
          onChange={ (v :ChatScale) => { setScale(v); setDefaultScale(v); } }
          options={ SCALES.map((s) => ({ value: s, label: `${s}x` })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认显示底部输入栏') }
        extra={ rowT(locale, '打开「聊天生成器」时是否默认显示手机底部的输入栏') }
      >
        <Switch
          size="small"
          checked={ showInput }
          onChange={ (v) => { setShowInput(v); setDefaultShowInputBar(v); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认显示昵称') }
        extra={ rowT(locale, '气泡样式的平台是否默认在气泡上方显示昵称 (Slack / Discord 始终显示)') }
      >
        <Switch
          size="small"
          checked={ showNames }
          onChange={ (v) => { setShowNames(v); setDefaultShowNames(v); } }
        />
      </Form.Item>
    </>
  );
};
