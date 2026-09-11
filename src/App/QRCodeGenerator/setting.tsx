import { Select, Form, Divider, Slider, Typography } from "antd";
import { getDefaultErrorLevel, setDefaultErrorLevel, getDefaultSize, setDefaultSize } from "./lib";
import { useState } from "react";
import { errorCorrectionLevelList } from "./data";
import { useLocale } from "../../hook/locale-context";
import { row as _r } from "../Setting/rows-lang";

const { Text } = Typography;

export const QRCodeGeneratorSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ level, setLevel ] = useState(getDefaultErrorLevel()); // 默认容错级别
  const [ size, setSize ] = useState(getDefaultSize()); // 默认尺寸

  return (
    <>
      <Divider orientation="left" plain>{ st('二维码生成') }</Divider>
      <Form.Item label={ st('默认容错等级') }>
        <Select
          value={ level }
          style={{ width: 240 }}
          onChange={ (value) => { setLevel(value); setDefaultErrorLevel(value); } }
          options={ errorCorrectionLevelList }
        />
      </Form.Item>
      <Form.Item label={ st('默认尺寸') }>
        {/* 滑块行: 滑块占满可用宽度, 数值固定宽度右对齐 (不用 Space, 避免 Space 容器下宽度不生效) */}
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520 } }>
          <Slider
            style={ { flex: 1, minWidth: 0 } }
            min = { 160 }
            max = { 360 }
            value={ size }
            onChange={ (value) => { setSize(value); setDefaultSize(value); } }
            tooltip={ { formatter: (v) => `${v}px` } }
          />
          <Text code style={ { fontSize: 12, minWidth: 56, textAlign: 'center' } }>{ size }px</Text>
        </div>
      </Form.Item>
    </>
  );
}
