import { Button, Divider, Form, Switch, message } from 'antd';
import { useState } from 'react';
import { clearRecords, getDefaultOptions, patchDefaultOptions, type FreeCellOptions } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** 空档接龙默认设置 (挂载到 设置 → 游戏) */
export const FreeCellSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<FreeCellOptions>(() => getDefaultOptions());

  const patch = (p: Partial<FreeCellOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('空档接龙') }</Divider>
      <Form.Item
        label={ st('自动收牌 (安全牌)') }
        extra={ st('每次移动后自动把可以安全上收的牌送上收集区, 省得逐张点击') }
      >
        <Switch checked={ opts.autoCollect } onChange={ (v) => patch({ autoCollect: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('允许多张连续移动') }
        extra={ st('开启后一次可搬 (空自由格 + 1) × 2^空列 张牌; 关闭则只能一张一张搬') }
      >
        <Switch checked={ opts.superMove } onChange={ (v) => patch({ superMove: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('双击自动移牌') }
        extra={ st('双击一张牌时自动送到收集区或能接住它的牌桌列') }
      >
        <Switch checked={ opts.doubleClick } onChange={ (v) => patch({ doubleClick: v }) } />
      </Form.Item>
      <Form.Item label={ st('清空战绩记录') } extra={ t('最快用时 / 最少步数清空后无法恢复') }>
        <Button size="small" danger onClick={ () => { clearRecords(); message.success(t('已清空战绩记录')); } }>
          { st('清空战绩记录') }
        </Button>
      </Form.Item>
    </>
  );
};

export default FreeCellSetting;
