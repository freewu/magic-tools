import { Divider, Form, Select, Slider } from 'antd';
import { useState } from 'react';
import {
  APPEARANCES, COMMON_LANGS, EDITORS, PADDING_MAX, PADDING_MIN,
  getDefaultAppearance, getDefaultEditor, getDefaultLang, getDefaultPadding,
  setDefaultAppearance, setDefaultEditor, setDefaultLang, setDefaultPadding,
} from './lib';
import type { Appearance, EditorId } from './lib';

/** 代码截图默认值设置 (挂载到 设置 → 其它) */
export const CodeShotSetting: React.FC = () => {
  const [lang, setLang] = useState<string>(() => getDefaultLang());
  const [editor, setEditor] = useState<EditorId>(() => getDefaultEditor());
  const [appearance, setAppearance] = useState<Appearance>(() => getDefaultAppearance());
  const [padding, setPadding] = useState<number>(() => getDefaultPadding());

  return (
    <>
      <Divider orientation="left" plain>代码截图</Divider>
      <Form.Item label="默认语言">
        <Select
          style={{ width: 280 }}
          value={lang}
          showSearch
          onChange={(v) => { setLang(v); setDefaultLang(v); }}
          filterOption={(kw, opt) => String(opt?.label ?? '').toLowerCase().includes(kw.toLowerCase()) || String(opt?.value ?? '').includes(kw)}
          options={COMMON_LANGS.map((l) => ({ value: l.id, label: l.label }))}
        />
      </Form.Item>
      <Form.Item label="默认编辑器风格">
        <Select style={{ width: 280 }} value={editor} onChange={(v) => { setEditor(v as EditorId); setDefaultEditor(v as EditorId); }} options={EDITORS} />
      </Form.Item>
      <Form.Item label="默认外观">
        <Select style={{ width: 280 }} value={appearance} onChange={(v) => { setAppearance(v as Appearance); setDefaultAppearance(v as Appearance); }} options={APPEARANCES} />
      </Form.Item>
      <Form.Item label="默认内边距" extra={`当前 ${padding}px`}>
        <Slider
          style={{ width: 280 }}
          min={PADDING_MIN}
          max={PADDING_MAX}
          value={padding}
          onChange={(v) => { setPadding(v); setDefaultPadding(v); }}
          tooltip={{ formatter: (val) => `${val}px` }}
        />
      </Form.Item>
    </>
  );
};

export default CodeShotSetting;
