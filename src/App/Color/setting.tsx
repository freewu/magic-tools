import { Select, Form, Divider, Switch, Space, Slider } from "antd";
import { getDefaultColorPad, setDefaultColorPad } from "./lib";
import { getDefaultBatchSwitch, setDefaultBatchSwitch } from "./lib";
import { getDefaultOpacity, setDefaultOpacity } from "./lib";
import { getDefaultPickMax, setDefaultPickMax } from "./lib";
import { colorDataList } from "./data";
import { useState } from "react";

export const ColorSetting = () => {
  const [ colorPad, setColorPad ] = useState(getDefaultColorPad()); // 默认展示的 颜色板
  const [ batchSwitch, setBatchSwitch ] = useState(getDefaultBatchSwitch()); // 默认是否开启批量取色
  const [ opacity, setOpacity ] = useState(getDefaultOpacity()); // 默认 opacity
  const [ pickMax, setPickMax ] = useState(getDefaultPickMax()); // 默认最大批量取色个数

  // 颜色板列表
  const getColorPadList = () => {
    const result:Array<any> = [];
    colorDataList.forEach((v) => {
      result.push({ value: v.key, label:  v.label });
    });
    return result;
  };

  return (
    <>
      <Divider orientation="left" plain>CSS 配色</Divider>
      <Form.Item label="默认展示配色板">
        <Select
          value={ colorPad }
          style={{ width: 240 }}
          onChange={ (value: string) => { setColorPad(value); setDefaultColorPad(value); } }
          options={ getColorPadList() }
        />
      </Form.Item>
      <Form.Item label="默认 Opacity">
        <Space>
          <div style={ {width: "520px"} }>
            <Slider
              tooltip={{ formatter: (value? :number) => { return (value)? (value / 10) : null; } }} 
              value={ opacity }
              min = { 0 }
              max = { 10 }
              onChange={ (value) => { setOpacity(value); setDefaultOpacity(value); }}
            />
          </div>
          { opacity / 10 }
        </Space>
      </Form.Item>
      <Form.Item label="默认开启批量取色">
        <Switch 
          onChange={ (value: boolean) => { setBatchSwitch(value); setDefaultBatchSwitch(value); } }
          checkedChildren="开启" unCheckedChildren="关闭" 
          checked={ batchSwitch } />
      </Form.Item>
      <Form.Item label="默认最大批量取色个数">
        <Space>
          <div style={ {width: "520px"} }>
            <Slider
              tooltip={{ formatter: (value? :number) => { return (value)? (value) : null; } }} 
              value={ pickMax }
              min = { 5 }
              max = { 20 }
              onChange={ (value) => { setPickMax(value); setDefaultPickMax(value); }}
            />
          </div>
          { pickMax }
        </Space>
      </Form.Item>
    </>
  );
}
