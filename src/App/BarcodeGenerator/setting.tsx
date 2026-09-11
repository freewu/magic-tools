import { Divider, Form, Radio, Select, Slider, Typography } from "antd";
import { useState } from "react";
import { barcodeFormatList } from "./data";
import {
  getDefaultFormat, setDefaultFormat,
  getDefaultBarWidth, setDefaultBarWidth,
  getDefaultBarHeight, setDefaultBarHeight,
  getDefaultShowText, setDefaultShowText,
} from "./lib";
import { useLocale } from "../../hook/locale-context";
import { row as _r } from "../Setting/rows-lang";

const { Text } = Typography;

export const BarcodeGeneratorSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ format, setFormat ] = useState(getDefaultFormat()); // 默认格式
  const [ width, setWidth ] = useState(getDefaultBarWidth()); // 默认条宽
  const [ height, setHeight ] = useState(getDefaultBarHeight()); // 默认高度
  const [ showText, setShowText ] = useState(getDefaultShowText() ? '1' : '0'); // 是否显示内容

  return (
    <>
      <Divider orientation="left" plain>{ st('条形码生成') }</Divider>
      <Form.Item label={ st('默认格式') }>
        <Select
          value={ format }
          style={ { width: 240 } }
          onChange={ (value) => { setFormat(value); setDefaultFormat(value); } }
          options={ barcodeFormatList }
        />
      </Form.Item>
      <Form.Item label={ st('默认条宽') }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520 } }>
          <Slider
            style={ { flex: 1, minWidth: 0 } }
            min={ 1 }
            max={ 5 }
            step={ 1 }
            value={ width }
            onChange={ (value) => { setWidth(value); setDefaultBarWidth(value); } }
            tooltip={ { formatter: (v) => `${v}px` } }
          />
          <Text code style={ { fontSize: 12, minWidth: 56, textAlign: 'center' } }>{ width }px</Text>
        </div>
      </Form.Item>
      <Form.Item label={ st('默认高度') }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520 } }>
          <Slider
            style={ { flex: 1, minWidth: 0 } }
            min={ 30 }
            max={ 300 }
            value={ height }
            onChange={ (value) => { setHeight(value); setDefaultBarHeight(value); } }
            tooltip={ { formatter: (v) => `${v}px` } }
          />
          <Text code style={ { fontSize: 12, minWidth: 56, textAlign: 'center' } }>{ height }px</Text>
        </div>
      </Form.Item>
      <Form.Item label={ st('显示内容') }>
        <Radio.Group
          value={ showText }
          options={ [
            { label: st('显示'), value: '1' },
            { label: st('隐藏'), value: '0' },
          ] }
          optionType="button"
          buttonStyle="solid"
          onChange={ (e) => {
            const v = e.target.value;
            setShowText(v);
            setDefaultShowText(v === '1');
          } }
        />
      </Form.Item>
    </>
  );
}
