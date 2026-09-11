import { Divider, Form, Select, Slider, Switch } from 'antd';
import { useState } from 'react';
import {
  APPEARANCES, COMMON_LANGS, EDITORS, MIN_WIDTH_MAX, MIN_WIDTH_MIN, PADDING_MAX, PADDING_MIN,
  getDefaultAppearance, getDefaultEditor, getDefaultLang, getDefaultMinWidth, getDefaultPadding,
  getDefaultShowLines, setDefaultShowLines,
  setDefaultAppearance, setDefaultEditor, setDefaultLang, setDefaultMinWidth, setDefaultPadding,
} from './lib';
import type { Appearance, EditorId } from './lib';
import { useLocale } from "../../hook/locale-context";
import { im } from './lang';
import { row as _r, rowT } from "../Setting/rows-lang";

/** 代码截图默认值设置 (挂载到 设置 → 图片) */
export const CodeShotSetting: React.FC = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [lang, setLang] = useState<string>(() => getDefaultLang());
  const [editor, setEditor] = useState<EditorId>(() => getDefaultEditor());
  const [appearance, setAppearance] = useState<Appearance>(() => getDefaultAppearance());
  const [padding, setPadding] = useState<number>(() => getDefaultPadding());
  const [minWidth, setMinWidth] = useState<number>(() => getDefaultMinWidth());
  const [showLines, setShowLines] = useState<boolean>(() => getDefaultShowLines());

  return (
    <>
      <Divider orientation="left" plain>{ st('代码截图') }</Divider>
      <Form.Item label={ st('默认语言') }>
        <Select
          style={{ width: 280 }}
          value={lang}
          showSearch
          onChange={(v) => { setLang(v); setDefaultLang(v); }}
          filterOption={(kw, opt) => String(opt?.label ?? '').toLowerCase().includes(kw.toLowerCase()) || String(opt?.value ?? '').includes(kw)}
          options={COMMON_LANGS.map((l) => ({ value: l.id, label: l.label }))}
        />
      </Form.Item>
      <Form.Item label={ st('默认编辑器风格') }>
        <Select style={{ width: 280 }} value={editor} onChange={(v) => { setEditor(v as EditorId); setDefaultEditor(v as EditorId); }} options={EDITORS} />
      </Form.Item>
      <Form.Item label={ st('默认外观') }>
        <Select style={{ width: 280 }} value={appearance} onChange={(v) => { setAppearance(v as Appearance); setDefaultAppearance(v as Appearance); }} options={APPEARANCES.map((a) => ({ ...a, label: im(locale, a.label) }))} />
      </Form.Item>
      <Form.Item label={ st('默认内边距') } extra={ rowT(locale, '当前 ${padding}px', { padding: padding }) }>
        <Slider
          style={{ width: 280 }}
          min={PADDING_MIN}
          max={PADDING_MAX}
          value={padding}
          onChange={(v) => { setPadding(v); setDefaultPadding(v); }}
          tooltip={{ formatter: (val) => `${val}px` }}
        />
      </Form.Item>
      <Form.Item
        label={ st('默认最小宽度') }
        extra={ rowT(locale, minWidth > 0 ? '当前 ${w}px' : '当前 0 (按代码宽度自适应)', { w: minWidth }) }
      >
        <Slider
          style={{ width: 280 }}
          min={MIN_WIDTH_MIN}
          max={MIN_WIDTH_MAX}
          value={minWidth}
          onChange={(v) => { setMinWidth(v); setDefaultMinWidth(v); }}
          tooltip={{ formatter: (val) => (val ? `${val}px` : rowT(locale, '自适应')) }}
        />
      </Form.Item>
      <Form.Item label={ st('默认显示行号') }>
        <Switch
          checked={showLines}
          onChange={(v) => { setShowLines(v); setDefaultShowLines(v); }}
        />
      </Form.Item>
    </>
  );
};

export default CodeShotSetting;
