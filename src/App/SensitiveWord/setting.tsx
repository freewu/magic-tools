import { Divider, Form, Select, Switch } from 'antd';
import { useState } from 'react';
import { BANK_KEYS, BANK_LABELS, MASK_CHAR_OPTIONS } from './data';
import { getSettings, patchSettings } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** 敏感词检测默认设置 (挂载到 设置 → 其它) */
export const SensitiveWordSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);

  const [ opts, setOpts ] = useState(() => getSettings());
  const patch = (p: Parameters<typeof patchSettings>[0]) => setOpts(patchSettings(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('敏感词检测') }</Divider>
      <Form.Item
        label={ st('默认检测词库') }
        extra={ st('打开工具页时默认选中的词库, 通用 = 小红书 + 微信公众号的并集') }
      >
        <Select
          style={ { width: 240 } }
          value={ opts.bank }
          onChange={ (v) => patch({ bank: v }) }
          options={ BANK_KEYS.map((k) => ({ value: k, label: t(BANK_LABELS[k]) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('宽松匹配') }
        extra={ st('忽略间隔符 / 零宽字符并按全角折半角, 可检出「微 信」「ｖｘ」这类绕过写法') }
      >
        <Switch checked={ opts.loose } onChange={ (v) => patch({ loose: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('拉丁词边界') }
        extra={ st('纯字母数字词要求左右不是字母, 避免「v」命中 version / VIP 这类英文单词') }
      >
        <Switch checked={ opts.latinBoundary } onChange={ (v) => patch({ latinBoundary: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('默认打码字符') }
        extra={ st('「复制打码文本 / 保存打码文本」使用的字符') }
      >
        <Select
          style={ { width: 120 } }
          value={ opts.maskChar }
          onChange={ (v) => patch({ maskChar: v }) }
          options={ MASK_CHAR_OPTIONS.map((c) => ({ value: c, label: c })) }
        />
      </Form.Item>
    </>
  );
};

export default SensitiveWordSetting;
