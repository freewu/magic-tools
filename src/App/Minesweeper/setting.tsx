import { Button, Divider, Form, Segmented, Switch, message } from 'antd';
import { useState } from 'react';
import { CELL_SIZES, PRESETS } from './data';
import {
  clearBestTimes, getDefaultOptions, patchDefaultOptions, type MinesweeperOptions,
} from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** 难度标签 (默认设置只允许三个预设难度) */
const LEVEL_LABEL: Record<'beginner' | 'intermediate' | 'expert', string> = {
  beginner: '初级',
  intermediate: '中级',
  expert: '高级',
};

const CELL_LABEL: Record<number, string> = { 22: '小', 26: '中', 30: '大' };

/** 扫雷默认设置 (挂载到 设置 → 游戏) */
export const MinesweeperSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<MinesweeperOptions>(() => getDefaultOptions());

  const patch = (p: Partial<MinesweeperOptions>) => setOpts(patchDefaultOptions(p));

  return (
    <>
      <Divider orientation="left" plain>{ st('扫雷') }</Divider>
      <Form.Item label={ st('默认难度') } extra={ st('打开「扫雷」时使用的难度, 页面里随时可切换') }>
        <Segmented
          value={ opts.level }
          onChange={ (v) => patch({ level: v as MinesweeperOptions['level'] }) }
          options={ (Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((k) => ({
            value: k,
            label: st(LEVEL_LABEL[k]),
          })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认格子大小') } extra={ st('棋盘格子越大越好点, 高级棋盘可适当调小') }>
        <Segmented
          value={ opts.cell }
          onChange={ (v) => patch({ cell: Number(v) }) }
          options={ CELL_SIZES.map((n) => ({ value: n, label: st(CELL_LABEL[n]) })) }
        />
      </Form.Item>
      <Form.Item label={ st('插旗经过问号') } extra={ st('开启后右键在 旗 / 问号 / 空 之间循环, 关闭后只在 旗 / 空 之间切换') }>
        <Switch checked={ opts.question } onChange={ (v) => patch({ question: v }) } />
      </Form.Item>
      <Form.Item label={ st('清空最高纪录') } extra={ t('最高纪录清空后无法恢复') }>
        <Button size="small" danger onClick={ () => { clearBestTimes(); message.success(t('已清空最高纪录')); } }>
          { st('清空最高纪录') }
        </Button>
      </Form.Item>
    </>
  );
};

export default MinesweeperSetting;
