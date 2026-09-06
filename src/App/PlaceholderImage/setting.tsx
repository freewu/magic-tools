import { Form, Select, Divider, InputNumber, Space, ColorPicker, Button, message } from "antd";
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from "react";
import {
  getDefaultBg, setDefaultBg,
  getDefaultFg, setDefaultFg,
  getDefaultSize, setDefaultSize,
  getCustomPresets, setCustomPresets, dimKey, notifyPresetsChanged,
  PH_DEFAULTS, PH_MAX, PH_MIN,
} from "./lib";

export const PlaceholderImageSetting = () => {
  const [ bg, setBg ] = useState(getDefaultBg());
  const [ fg, setFg ] = useState(getDefaultFg());
  const [ wh, setWh ] = useState(getDefaultSize());
  const [ custom, setCustom ] = useState(getCustomPresets());
  const [ cw, setCw ] = useState<number | null>(300);
  const [ ch, setCh ] = useState<number | null>(250);

  const onColorChange = (key: 'bg' | 'fg', hex: string) => {
    if (key === 'bg') { setBg(hex); setDefaultBg(hex); }
    else { setFg(hex); setDefaultFg(hex); }
  };

  // 添加自定义预设
  const addCustom = () => {
    if (custom.length >= 10) { message.warning('自定义预设最多 10 个'); return; }
    if (cw == null || ch == null) { message.warning('请填写宽和高'); return; }
    const key = dimKey(cw, ch);
    if (custom.some((d) => dimKey(d.w, d.h) === key)) { message.warning('该尺寸已在自定义列表中'); return; }
    const next = [ ...custom, { w: cw, h: ch } ];
    setCustomPresets(next);
    setCustom(next);
    notifyPresetsChanged();
    message.success(`已添加 ${cw}×${ch}`);
  };
  const removeCustom = (key: string) => {
    const next = custom.filter((d) => dimKey(d.w, d.h) !== key);
    setCustomPresets(next);
    setCustom(next);
    notifyPresetsChanged();
  };

  return (
    <>
      <Divider orientation="left" plain>占位图片</Divider>
      <Form.Item label="默认背景颜色">
        <ColorPicker
          format="hex"
          value={ bg }
          onChange={ (c) => onColorChange('bg', c.toHexString()) }
        />
      </Form.Item>
      <Form.Item label="默认文字颜色">
        <ColorPicker
          format="hex"
          value={ fg }
          onChange={ (c) => onColorChange('fg', c.toHexString()) }
        />
      </Form.Item>
      <Form.Item label="默认宽高">
        <Space>
          <InputNumber
            min={ PH_MIN }
            max={ PH_MAX }
            value={ wh.w }
            onChange={ (v) => setWh((s) => ({ ...s, w: v ?? PH_DEFAULTS.w })) }
            onBlur={ () => setDefaultSize(wh.w, wh.h) }
            addonBefore="宽"
            style={ { width: 110 } }
          />
          <span style={ { color: '#999' } }>×</span>
          <InputNumber
            min={ PH_MIN }
            max={ PH_MAX }
            value={ wh.h }
            onChange={ (v) => setWh((s) => ({ ...s, h: v ?? PH_DEFAULTS.h })) }
            onBlur={ () => setDefaultSize(wh.w, wh.h) }
            addonBefore="高"
            style={ { width: 110 } }
          />
        </Space>
        <div style={ { color: '#999', fontSize: 12, marginTop: 4 } }>
          打开「占位图片」工具时默认填入的宽高 (默认 { PH_DEFAULTS.w }×{ PH_DEFAULTS.h })
        </div>
      </Form.Item>
      <Form.Item label="自定义预设尺寸">
        <Space direction="vertical" style={ { width: '100%' } }>
          { custom.length > 0 && (
            <Space wrap>
              { custom.map((d) => (
                <span key={ dimKey(d.w, d.h) } style={ { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #d9d9d9', borderRadius: 6, padding: '2px 6px 2px 10px', background: '#fafafa' } }>
                  { d.w } × { d.h }
                  <Button size="small" type="text" icon={ <DeleteOutlined /> } style={ { color: '#999' } } onClick={ () => removeCustom(dimKey(d.w, d.h)) } />
                </span>
              )) }
            </Space>
          ) }
          <Space>
            <InputNumber min={ PH_MIN } max={ PH_MAX } value={ cw } onChange={ setCw } addonBefore="宽" style={ { width: 110 } } />
            <span style={ { color: '#999' } }>×</span>
            <InputNumber min={ PH_MIN } max={ PH_MAX } value={ ch } onChange={ setCh } addonBefore="高" style={ { width: 110 } } />
            <Button icon={ <PlusOutlined /> } onClick={ addCustom }>添加</Button>
          </Space>
          <div style={ { color: '#999', fontSize: 12 } }>
            自定义尺寸会出现在「占位图片」工具页的预设下拉中, 便于一键填充 (上限 10 个)
          </div>
        </Space>
      </Form.Item>
    </>
  );
}
