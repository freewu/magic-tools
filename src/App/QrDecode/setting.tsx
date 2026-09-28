import { Divider, Form, Select, Switch } from 'antd';
import { useState } from 'react';
import { HISTORY_MAX_OPTIONS, INVERSION_OPTIONS, MAX_EDGE_OPTIONS } from './data';
import { getSettings, patchSettings } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 二维码解析默认设置 (挂载到 设置 → 其它) */
export const QrDecodeSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);

  const [ opts, setOpts ] = useState(() => getSettings());
  const patch = (p: Parameters<typeof patchSettings>[0]) => setOpts(patchSettings(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('二维码解析') }</Divider>
      <Form.Item
        label={ st('默认反色策略') }
        extra={ st('「自动尝试反色」可同时处理普通码与深底浅码 (暗色主题截图)') }
      >
        <Select
          style={ { width: 240 } }
          value={ opts.inversion }
          onChange={ (v) => patch({ inversion: v }) }
          options={ INVERSION_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认图片最大边长') }
        extra={ rowT(locale, '超过该边长会等比缩小后再解析, 默认 ${n} px; 手机原图等比缩小后既快又常常更准', { n: 1600 }) }
      >
        <Select
          style={ { width: 200 } }
          value={ opts.maxEdge }
          onChange={ (v) => patch({ maxEdge: v }) }
          options={ MAX_EDGE_OPTIONS.map((n) => ({ value: n, label: n === 0 ? t('不缩放') : `${n} px` })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('历史记录条数') }
        extra={ st('工具页「历史记录」保留的条数上限, 超出后丢弃最旧的记录') }
      >
        <Select
          style={ { width: 160 } }
          value={ opts.historyMax }
          onChange={ (v) => patch({ historyMax: v }) }
          options={ HISTORY_MAX_OPTIONS.map((n) => ({ value: n, label: String(n) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('自动复制解析结果') }
        extra={ st('开启后每次解析成功都会把内容写入剪贴板, 省一次点击') }
      >
        <Switch checked={ opts.autoCopy } onChange={ (v) => patch({ autoCopy: v }) } />
      </Form.Item>
    </>
  );
};

export default QrDecodeSetting;
