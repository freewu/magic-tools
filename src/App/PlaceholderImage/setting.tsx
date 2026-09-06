import { Form, Select, Divider, InputNumber, Space, ColorPicker, message } from "antd";
import { useState } from "react";
import {
  getDefaultBg, setDefaultBg,
  getDefaultFg, setDefaultFg,
  getDefaultSize, setDefaultSize,
  PH_DEFAULTS, PH_MAX, PH_MIN,
} from "./lib";

export const PlaceholderImageSetting = () => {
  const [ bg, setBg ] = useState(getDefaultBg());
  const [ fg, setFg ] = useState(getDefaultFg());
  const [ wh, setWh ] = useState(getDefaultSize());

  const onColorChange = (key: 'bg' | 'fg', hex: string) => {
    if (key === 'bg') { setBg(hex); setDefaultBg(hex); }
    else { setFg(hex); setDefaultFg(hex); }
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
      <Form.Item label="预设宽高">
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
    </>
  );
}
