import { Divider, Form, Radio, Select, Slider, Space } from "antd";
import { useState } from "react";
import { barcodeFormatList } from "./data";
import {
  getDefaultFormat, setDefaultFormat,
  getDefaultBarWidth, setDefaultBarWidth,
  getDefaultBarHeight, setDefaultBarHeight,
  getDefaultShowText, setDefaultShowText,
} from "./lib";

export const BarcodeGeneratorSetting = () => {
  const [ format, setFormat ] = useState(getDefaultFormat()); // 默认格式
  const [ width, setWidth ] = useState(getDefaultBarWidth()); // 默认条宽
  const [ height, setHeight ] = useState(getDefaultBarHeight()); // 默认高度
  const [ showText, setShowText ] = useState(getDefaultShowText() ? '1' : '0'); // 是否显示内容

  return (
    <>
      <Divider orientation="left" plain>条形码生成</Divider>
      <Form.Item label="默认格式">
        <Select
          value={ format }
          style={ { width: 240 } }
          onChange={ (value) => { setFormat(value); setDefaultFormat(value); } }
          options={ barcodeFormatList }
        />
      </Form.Item>
      <Form.Item label="默认条宽">
        <Space>
          <div style={ { width: 520 } }>
            <Slider
              min={ 1 }
              max={ 5 }
              step={ 1 }
              value={ width }
              onChange={ (value) => { setWidth(value); setDefaultBarWidth(value); } }
            />
          </div>
          { width }px
        </Space>
      </Form.Item>
      <Form.Item label="默认高度">
        <Space>
          <div style={ { width: 520 } }>
            <Slider
              min={ 30 }
              max={ 300 }
              value={ height }
              onChange={ (value) => { setHeight(value); setDefaultBarHeight(value); } }
            />
          </div>
          { height }px
        </Space>
      </Form.Item>
      <Form.Item label="显示内容">
        <Radio.Group
          value={ showText }
          options={ [
            { label: '显示', value: '1' },
            { label: '隐藏', value: '0' },
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
