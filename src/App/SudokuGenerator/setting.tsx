import { Divider, Form, InputNumber, Segmented, Select } from 'antd';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';
import {
  DIFFICULTIES, GRID_SIZES, PAGES_DEFAULT, PAGES_MAX, PAGES_MIN, PRINT_MODES, TITLE_DEFAULT,
  difficultyLabel, sizeLabel, type Difficulty, type GridSize, type PrintMode,
} from './data';
import {
  getDefaultDifficulty, getDefaultMode, getDefaultPages, getDefaultSize,
  setDefaultDifficulty, setDefaultMode, setDefaultPages, setDefaultSize,
} from './lib';

/** 数独生成器默认设置 (挂载到 设置 → 生成器) */
export const SudokuGeneratorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ size, setSize ] = useState<GridSize>(() => getDefaultSize());
  const [ difficulty, setDifficulty ] = useState<Difficulty>(() => getDefaultDifficulty());
  const [ pages, setPages ] = useState<number>(() => getDefaultPages());
  const [ mode, setMode ] = useState<PrintMode>(() => getDefaultMode());

  const modeLabel = (m: PrintMode) => (m === 'puzzle' ? '仅题目' : m === 'answer' ? '仅答案 (红色)' : '题目 + 答案');

  return (
    <>
      <Divider orientation="left" plain>{ st('数独生成器') }</Divider>
      <Form.Item
        label={ st('默认宫格') }
        extra={ rowT(locale, '打开「数独生成器」时默认的宫格规格, 默认 ${d}', { d: sizeLabel(9) }) }
      >
        <Segmented
          value={ size }
          onChange={ (v) => { const s = Number(v) as GridSize; setSize(s); setDefaultSize(s); } }
          options={ GRID_SIZES.map((s) => ({ value: s, label: sizeLabel(s) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认难度') }
        extra={ rowT(locale, '打开「数独生成器」时默认的难度, 默认 ${d}', { d: difficultyLabel('medium') }) }
      >
        <Segmented
          value={ difficulty }
          onChange={ (v) => { const d = v as Difficulty; setDifficulty(d); setDefaultDifficulty(d); } }
          options={ DIFFICULTIES.map((d) => ({ value: d, label: difficultyLabel(d) })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认页数') }
        extra={ rowT(locale, '打开「数独生成器」时默认生成的页数 (每页题数由宫格决定), 默认 ${d}', { d: PAGES_DEFAULT }) }
      >
        <InputNumber
          min={ PAGES_MIN }
          max={ PAGES_MAX }
          value={ pages }
          onChange={ (v) => { const n = Number(v ?? PAGES_DEFAULT); setPages(n); setDefaultPages(n); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认打印内容') }
        extra={ rowT(locale, '打开「数独生成器」时默认的打印内容 (标题默认 ${d}), 默认 ${m}', { d: TITLE_DEFAULT, m: '仅题目' }) }
      >
        <Select
          style={ { width: 220 } }
          value={ mode }
          onChange={ (v: PrintMode) => { setMode(v); setDefaultMode(v); } }
          options={ PRINT_MODES.map((m) => ({ value: m, label: modeLabel(m) })) }
        />
      </Form.Item>
    </>
  );
};

export default SudokuGeneratorSetting;
