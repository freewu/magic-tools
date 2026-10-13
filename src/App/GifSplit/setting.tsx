import { Divider, Form, InputNumber } from 'antd';
import { useState } from 'react';
import {
  COLS_DEFAULT, COLS_MAX, COLS_MIN, GAP_DEFAULT, GAP_MAX, GAP_MIN, getDefaultCols, getDefaultGap,
  setDefaultCols, setDefaultGap,
} from './lib';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';

/** GIF 拆解默认设置 (挂载到 设置 → 图片): 精灵图列数与间隔 */
export const GifSplitSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ cols, setCols ] = useState<number>(() => getDefaultCols());
  const [ gap, setGap ] = useState<number>(() => getDefaultGap());

  return (
    <>
      <Divider orientation="left" plain>{ st('GIF 拆解') }</Divider>
      <Form.Item
        label={ st('默认精灵图列数') }
        extra={ rowT(locale, '打开「GIF 拆解」导出精灵图时默认的列数, 默认 ${d} 列', { d: COLS_DEFAULT }) }
      >
        <InputNumber
          style={ { width: 260 } }
          min={ COLS_MIN }
          max={ COLS_MAX }
          value={ cols }
          onChange={ (v) => { const n = v ?? COLS_DEFAULT; setCols(n); setDefaultCols(n); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认精灵图间隔') }
        extra={ rowT(locale, '精灵图里帧与帧之间留出的像素间隔 (0 表示紧贴), 默认 ${d}', { d: GAP_DEFAULT }) }
      >
        <InputNumber
          style={ { width: 260 } }
          min={ GAP_MIN }
          max={ GAP_MAX }
          value={ gap }
          onChange={ (v) => { const n = v ?? GAP_DEFAULT; setGap(n); setDefaultGap(n); } }
        />
      </Form.Item>
    </>
  );
};

export default GifSplitSetting;
