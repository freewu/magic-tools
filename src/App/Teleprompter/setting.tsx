import { Divider, Form, Slider, Switch, Typography } from 'antd';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';
import {
  FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN,
  LINE_HEIGHT_DEFAULT, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN,
  SPEED_DEFAULT, SPEED_MAX, SPEED_MIN, SPEED_STEP,
} from './data';
import { getDefaultOptions, patchDefaultOptions, type PrompterOptions } from './lib';

/** 提词器默认设置 (挂载到 设置 → 其它) */
export const TeleprompterSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ opts, setOpts ] = useState<PrompterOptions>(() => getDefaultOptions());

  /** 逐项修改: 立即落盘, 工具页下次打开时生效 */
  const change = (next: Partial<PrompterOptions>) => setOpts(patchDefaultOptions(next));

  return (
    <>
      <Divider orientation="left" plain>{ st('提词器') }</Divider>
      <Form.Item
        label={ st('默认滚动速度') }
        extra={ rowT(locale, '打开「提词器」时默认的滚动速度 (px/s), 范围 ${min} - ${max}, 默认 ${d}', { min: SPEED_MIN, max: SPEED_MAX, d: SPEED_DEFAULT }) }
      >
        <Slider
          min={ SPEED_MIN }
          max={ SPEED_MAX }
          step={ SPEED_STEP }
          value={ opts.speed }
          onChange={ (v: number) => change({ speed: v }) }
          style={ { width: 260 } }
        />
        <Typography.Text type="secondary" style={ { marginLeft: 8, fontSize: 12 } }>{ `${opts.speed} px/s` }</Typography.Text>
      </Form.Item>
      <Form.Item
        label={ st('默认字号') }
        extra={ rowT(locale, '打开「提词器」时默认的字号 (px), 范围 ${min} - ${max}, 默认 ${d}', { min: FONT_SIZE_MIN, max: FONT_SIZE_MAX, d: FONT_SIZE_DEFAULT }) }
      >
        <Slider
          min={ FONT_SIZE_MIN }
          max={ FONT_SIZE_MAX }
          value={ opts.fontSize }
          onChange={ (v: number) => change({ fontSize: v }) }
          style={ { width: 260 } }
        />
        <Typography.Text type="secondary" style={ { marginLeft: 8, fontSize: 12 } }>{ `${opts.fontSize} px` }</Typography.Text>
      </Form.Item>
      <Form.Item
        label={ st('默认行距') }
        extra={ rowT(locale, '打开「提词器」时默认的行距倍率, 范围 ${min} - ${max}, 默认 ${d}', { min: LINE_HEIGHT_MIN, max: LINE_HEIGHT_MAX, d: LINE_HEIGHT_DEFAULT }) }
      >
        <Slider
          min={ LINE_HEIGHT_MIN }
          max={ LINE_HEIGHT_MAX }
          step={ 0.1 }
          value={ opts.lineHeight }
          onChange={ (v: number) => change({ lineHeight: v }) }
          style={ { width: 260 } }
        />
        <Typography.Text type="secondary" style={ { marginLeft: 8, fontSize: 12 } }>{ `${opts.lineHeight.toFixed(1)} x` }</Typography.Text>
      </Form.Item>
      <Form.Item
        label={ st('默认淡入淡出') }
        extra={ st('打开「提词器」时是否默认开启边缘淡入淡出 (文字在上下边缘渐隐, 更接近真实提词器)') }
      >
        <Switch
          checked={ opts.fade }
          checkedChildren={ st('开启') }
          unCheckedChildren={ st('关闭') }
          onChange={ (v: boolean) => change({ fade: v }) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认逐行高亮') }
        extra={ st('打开「提词器」时是否默认开启逐行高亮 (只高亮当前阅读行, 离它越远的行越透明、颜色越淡)') }
      >
        <Switch
          checked={ opts.focus }
          checkedChildren={ st('开启') }
          unCheckedChildren={ st('关闭') }
          onChange={ (v: boolean) => change({ focus: v }) }
        />
      </Form.Item>
      <Typography.Paragraph type="secondary" style={ { fontSize: 12, marginBottom: 0 } }>
        { st('工具页的「保存为默认设置」按钮可把当前页面的参数一键存为这里的默认值; 默认值在打开工具页时生效, 不影响已打开的页面') }
      </Typography.Paragraph>
    </>
  );
};

export default TeleprompterSetting;
