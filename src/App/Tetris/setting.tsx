import { Button, Divider, Form, Segmented, Switch, message } from 'antd';
import { useState } from 'react';
import { LEVEL_MAX, LEVEL_MIN } from './data';
import { clearBestScores, getDefaultOptions, patchDefaultOptions, type TetrisOptions } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 俄罗斯方块默认设置 (挂载到 设置 → 游戏) */
export const TetrisSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<TetrisOptions>(() => getDefaultOptions());

  const patch = (p: Partial<TetrisOptions>) => setOpts(patchDefaultOptions(p));

  const levels = Array.from({ length: LEVEL_MAX - LEVEL_MIN + 1 }, (_, i) => LEVEL_MIN + i);

  return (
    <>
      <Divider orientation="left" plain>{ st('俄罗斯方块') }</Divider>
      <Form.Item
        label={ st('默认起始等级') }
        extra={ rowT(locale, '等级越高方块下落越快, 从第几级开始随时可改, 默认 ${n} 级', { n: opts.level }) }
      >
        <Segmented
          value={ opts.level }
          onChange={ (v) => patch({ level: Number(v) }) }
          options={ levels.map((n) => ({ value: n, label: String(n) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('幽灵方块 (落点预览)') }
        extra={ st('显示当前方块硬降后的落点, 关闭后界面更简洁') }
      >
        <Switch checked={ opts.ghost } onChange={ (v) => patch({ ghost: v }) } />
      </Form.Item>
      <Form.Item label={ st('显示网格线') } extra={ st('关闭后棋盘只留方块, 视觉更干净') }>
        <Switch checked={ opts.grid } onChange={ (v) => patch({ grid: v }) } />
      </Form.Item>
      <Form.Item label={ st('清空最高分记录') } extra={ t('最高分清空后无法恢复') }>
        <Button size="small" danger onClick={ () => { clearBestScores(); message.success(t('已清空最高分记录')); } }>
          { st('清空最高分记录') }
        </Button>
      </Form.Item>
    </>
  );
};

export default TetrisSetting;
