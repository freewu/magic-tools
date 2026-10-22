import { Button, Divider, Form, Segmented, Switch, message } from 'antd';
import { useState } from 'react';
import { BOARD_SIZES, WIN_OPTIONS } from './data';
import {
  clearBestScores, getDefaultOptions, patchDefaultOptions, type GameOptions,
} from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** 2048 默认设置 (挂载到 设置 → 游戏) */
export const Game2048Setting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<GameOptions>(() => getDefaultOptions());

  const patch = (p: Partial<GameOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('2048') }</Divider>
      <Form.Item
        label={ st('默认棋盘') }
        extra={ rowT(locale, '打开「2048」时使用的棋盘大小, 默认 ${n}×${n}', { n: opts.size }) }
      >
        <Segmented
          value={ opts.size }
          onChange={ (v) => patch({ size: Number(v) as GameOptions['size'] }) }
          options={ BOARD_SIZES.map((n) => ({ value: n, label: `${n}×${n}` })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认胜利目标') }
        extra={ rowT(locale, '合成出该数字即通关, 达成后可继续挑战, 默认 ${n}', { n: 2048 }) }
      >
        <Segmented
          value={ opts.win }
          onChange={ (v) => patch({ win: Number(v) }) }
          options={ WIN_OPTIONS.map((n) => ({ value: n, label: String(n) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('方块弹出动画') }
        extra={ st('关闭后方块移动 / 合并不再播放弹出动画 (低性能设备更流畅)') }
      >
        <Switch checked={ opts.anim } onChange={ (v) => patch({ anim: v }) } />
      </Form.Item>
      <Form.Item label={ st('清空最高分记录') } extra={ t('最高分按棋盘边长分别记录, 清空后无法恢复') }>
        <Button size="small" danger onClick={ () => { clearBestScores(); message.success(t('已清空最高分记录')); } }>
          { st('清空最高分记录') }
        </Button>
      </Form.Item>
    </>
  );
};

export default Game2048Setting;
