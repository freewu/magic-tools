import { Button, Divider, Form, Segmented, Switch, message } from 'antd';
import { useState } from 'react';
import { SPEED_ORDER, type SpeedKey } from './data';
import { clearBestScores, getDefaultOptions, patchDefaultOptions, type SnakeOptions } from './lib';
import { u } from './lang';
import { useLocale } from '../../hook/locale-context';
import { row as _r } from '../Setting/rows-lang';

/** 贪吃蛇默认设置 (挂载到 设置 → 游戏) */
export const SnakeSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (zh: string) => u(locale, zh);
  const [ opts, setOpts ] = useState<SnakeOptions>(() => getDefaultOptions());

  const patch = (p: Partial<SnakeOptions>) => setOpts(patchDefaultOptions(p));
  const speedLabel = (k: SpeedKey) => t({ slow: '慢', mid: '标准', fast: '快', insane: '极速' }[k]);

  return (
    <>
      <Divider orientation="left" plain>{ st('贪吃蛇') }</Divider>
      <Form.Item
        label={ st('默认速度') }
        extra={ st('默认速度与开关, 开局后也能在页面上随时改') }
      >
        <Segmented
          value={ opts.speed }
          onChange={ (v) => patch({ speed: v as SpeedKey }) }
          options={ SPEED_ORDER.map((k) => ({ value: k, label: speedLabel(k) })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认穿墙模式') } extra={ st('穿墙: 从一边出去, 从对边进来') }>
        <Switch checked={ opts.wrap } onChange={ (v) => patch({ wrap: v }) } />
      </Form.Item>
      <Form.Item label={ st('默认显示障碍物') } extra={ st('障碍物: 棋盘上固定出现 12 格障碍') }>
        <Switch checked={ opts.walls } onChange={ (v) => patch({ walls: v }) } />
      </Form.Item>
      <Form.Item
        label={ st('默认播放音效') }
        extra={ st('吃到食物 / 撞到障碍时会发出提示音, 用 Web Audio 合成, 不加载任何音频文件') }
      >
        <Switch checked={ opts.sound } onChange={ (v) => patch({ sound: v }) } />
      </Form.Item>
      <Form.Item label={ st('清空最高分记录') } extra={ t('最高分清空后无法恢复') }>
        <Button size="small" danger onClick={ () => { clearBestScores(); message.success(t('已清空最高分记录')); } }>
          { st('清空最高分记录') }
        </Button>
      </Form.Item>
    </>
  );
};

export default SnakeSetting;
