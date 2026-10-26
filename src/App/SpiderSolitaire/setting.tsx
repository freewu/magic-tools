import { Button, Divider, Form, Select, Switch, message } from 'antd';
import { useState } from 'react';
import { clearRecords, getDefaultOptions, patchDefaultOptions, type SpiderOptions } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** 蜘蛛纸牌默认设置 (挂载到 设置 → 游戏) */
export const SpiderSolitaireSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<SpiderOptions>(() => getDefaultOptions());

  const patch = (p: Partial<SpiderOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('蜘蛛纸牌') }</Divider>
      <Form.Item
        label={ st('默认难度') }
        extra={ st('花色越少越好过: 一花色只有黑桃, 四花色则是两副完整的牌') }
      >
        <Select
          size="small"
          style={ { width: 160 } }
          value={ opts.suits }
          onChange={ (v) => patch({ suits: v }) }
          options={ [
            { value: 1, label: st('一花色 (简单)') },
            { value: 2, label: st('两花色 (中等)') },
            { value: 4, label: st('四花色 (困难)') },
          ] }
        />
      </Form.Item>
      <Form.Item
        label={ st('有空列时禁止发牌') }
        extra={ st('经典规则: 牌桌上有空列时不能从牌堆发牌, 先把空列填上') }
      >
        <Switch checked={ opts.strictDeal } onChange={ (v) => patch({ strictDeal: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('双击自动移到可接的列') }
        extra={ st('双击一张牌时自动移到能接住它的牌桌列') }
      >
        <Switch checked={ opts.doubleClick } onChange={ (v) => patch({ doubleClick: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('自动收走同花顺') }
        extra={ st('凑齐 K 到 A 的同花顺时自动收走; 关闭后需手动点「收牌 (C)」') }
      >
        <Switch checked={ opts.autoCollect } onChange={ (v) => patch({ autoCollect: v }) } />
      </Form.Item>
      <Form.Item label={ st('清空战绩记录') } extra={ t('最快用时 / 最少步数清空后无法恢复') }>
        <Button size="small" danger onClick={ () => { clearRecords(); message.success(t('已清空战绩记录')); } }>
          { st('清空战绩记录') }
        </Button>
      </Form.Item>
    </>
  );
};

export default SpiderSolitaireSetting;
