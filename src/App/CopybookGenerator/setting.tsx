import { Divider, Form, Input, InputNumber, Select } from 'antd';
import { useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { row as _r, rowT } from '../Setting/rows-lang';
import {
  CONTENT_MODES, CONTENT_MODE_LABEL, COLS_DEFAULT, COLS_MAX, COLS_MIN, FONTS, GAP_DEFAULT, GAP_MAX,
  GAP_MIN, GAP_STEP, GRID_STYLES, GRID_STYLE_LABEL,
  LINE_COLORS, LINE_COLOR_LABEL, PAGES_DEFAULT, PAGES_MAX, PAGES_MIN, ROWS_DEFAULT, ROWS_MAX, ROWS_MIN,
  TEXT_DEFAULT, type ContentMode, type GridStyle, type LineColor,
} from './data';
import {
  getDefaultCols, getDefaultFont, getDefaultGap, getDefaultLine, getDefaultMode, getDefaultPages,
  getDefaultRows, getDefaultStyle, getDefaultText, setDefaultCols, setDefaultFont, setDefaultGap, setDefaultLine,
  setDefaultMode, setDefaultPages, setDefaultRows, setDefaultStyle, setDefaultText,
} from './lib';

/** 字帖生成器默认设置 (挂载到 设置 → 其它) */
export const CopybookGeneratorSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ style, setStyle ] = useState<GridStyle>(() => getDefaultStyle());
  const [ font, setFont ] = useState<string>(() => getDefaultFont());
  const [ line, setLine ] = useState<LineColor>(() => getDefaultLine());
  const [ mode, setMode ] = useState<ContentMode>(() => getDefaultMode());
  const [ cols, setCols ] = useState<number>(() => getDefaultCols());
  const [ rows, setRows ] = useState<number>(() => getDefaultRows());
  const [ pages, setPages ] = useState<number>(() => getDefaultPages());
  const [ gap, setGap ] = useState<number>(() => getDefaultGap());
  const [ text, setText ] = useState<string>(() => getDefaultText());

  return (
    <>
      <Divider orientation="left" plain>{ st('字帖生成器') }</Divider>
      <Form.Item
        label={ st('默认文本') }
        extra={ rowT(locale, '打开「字帖生成器」时填入的默认文本, 留空则用示例「${d}」', { d: TEXT_DEFAULT }) }
      >
        <Input
          value={ text }
          style={ { width: 320 } }
          maxLength={ 200 }
          onChange={ (e) => { setText(e.target.value); setDefaultText(e.target.value); } }
          onBlur={ () => setText(getDefaultText()) }
          placeholder={ TEXT_DEFAULT }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认格子样式') }
        extra={ rowT(locale, '打开「字帖生成器」时默认的格型, 默认 ${d}', { d: GRID_STYLE_LABEL.mi }) }
      >
        <Select
          style={ { width: 180 } }
          value={ style }
          onChange={ (v: GridStyle) => { setStyle(v); setDefaultStyle(v); } }
          options={ GRID_STYLES.map((s) => ({ value: s, label: GRID_STYLE_LABEL[s] })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认字体') }>
        <Select
          style={ { width: 180 } }
          value={ font }
          onChange={ (v: string) => { setFont(v); setDefaultFont(v); } }
          options={ FONTS.map((f) => ({ value: f.label, label: f.label, style: { fontFamily: f.family } })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认内容模式') }
        extra={ rowT(locale, '打开「字帖生成器」时默认的内容模式, 默认 ${d}', { d: CONTENT_MODE_LABEL.trace }) }
      >
        <Select
          style={ { width: 180 }
          }
          value={ mode }
          onChange={ (v: ContentMode) => { setMode(v); setDefaultMode(v); } }
          options={ CONTENT_MODES.map((m) => ({ value: m, label: CONTENT_MODE_LABEL[m] })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认格线颜色') }>
        <Select
          style={ { width: 180 } }
          value={ line }
          onChange={ (v: LineColor) => { setLine(v); setDefaultLine(v); } }
          options={ LINE_COLORS.map((c) => ({ value: c, label: LINE_COLOR_LABEL[c] })) }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认每行格数') }
        extra={ rowT(locale, '打开「字帖生成器」时默认的每行格数, 范围 ${min} - ${max}, 默认 ${d}', { min: COLS_MIN, max: COLS_MAX, d: COLS_DEFAULT }) }
      >
        <InputNumber
          min={ COLS_MIN }
          max={ COLS_MAX }
          value={ cols }
          onChange={ (v) => { const n = Number(v ?? COLS_DEFAULT); setCols(n); setDefaultCols(n); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认每页行数') }
        extra={ rowT(locale, '打开「字帖生成器」时默认的每页行数, 范围 ${min} - ${max}, 默认 ${d}', { min: ROWS_MIN, max: ROWS_MAX, d: ROWS_DEFAULT }) }
      >
        <InputNumber
          min={ ROWS_MIN }
          max={ ROWS_MAX }
          value={ rows }
          onChange={ (v) => { const n = Number(v ?? ROWS_DEFAULT); setRows(n); setDefaultRows(n); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认页数') }
        extra={ rowT(locale, '打开「字帖生成器」时默认生成的页数, 范围 ${min} - ${max}, 默认 ${d}', { min: PAGES_MIN, max: PAGES_MAX, d: PAGES_DEFAULT }) }
      >
        <InputNumber
          min={ PAGES_MIN }
          max={ PAGES_MAX }
          value={ pages }
          onChange={ (v) => { const n = Number(v ?? PAGES_DEFAULT); setPages(n); setDefaultPages(n); } }
        />
      </Form.Item>
      <Form.Item
        label={ st('默认格间距') }
        extra={ rowT(locale, '打开「字帖生成器」时默认的格间距 (mm), 范围 ${min} - ${max}, 默认 ${d}', { min: GAP_MIN, max: GAP_MAX, d: GAP_DEFAULT }) }
      >
        <InputNumber
          min={ GAP_MIN }
          max={ GAP_MAX }
          step={ GAP_STEP }
          addonAfter="mm"
          value={ gap }
          onChange={ (v) => { const n = Number(v ?? GAP_DEFAULT); setGap(n); setDefaultGap(n); } }
        />
      </Form.Item>
    </>
  );
};

export default CopybookGeneratorSetting;
