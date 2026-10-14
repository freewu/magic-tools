import { Select, Form, Divider, Switch, Slider } from "antd";
import { getDefaultColorPad, setDefaultColorPad } from "./lib";
import { getDefaultBatchSwitch, setDefaultBatchSwitch } from "./lib";
import { getDefaultOpacity, setDefaultOpacity } from "./lib";
import { getDefaultPickMax, setDefaultPickMax } from "./lib";
import { getDefaultColorType, setDefaultColorType } from "./lib";
import { colorDataList, colorTypeList } from "./data";
import { useState } from "react";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import colorLang from "./lang";
import { row as _r, rowT } from "../Setting/rows-lang";

export const ColorSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const t = (key: string, fallback: string) => tr(colorLang, locale, key, fallback);
  const [ colorPad, setColorPad ] = useState(getDefaultColorPad()); // 默认展示的 颜色板
  const [ colorType, setColorType ] = useState(getDefaultColorType()); // 默认颜色类型 (色块上展示的编码)
  const [ batchSwitch, setBatchSwitch ] = useState(getDefaultBatchSwitch()); // 默认是否开启批量取色
  const [ opacity, setOpacity ] = useState(getDefaultOpacity()); // 默认 opacity
  const [ pickMax, setPickMax ] = useState(getDefaultPickMax()); // 默认最大批量取色个数

  // 颜色类型列表 (标签走语言包, 与工具页顶部一致)
  const getColorTypeList = () => {
    return colorTypeList.map((v) => ({ value: v.value, label: t('t_' + v.value, v.label) }));
  };

  // 颜色板列表
  const getColorPadList = () => {
    const result:Array<any> = [];
    colorDataList.forEach((v) => {
      result.push({ value: v.key, label: t('c_' + v.key.replace(/-/g, '_'), v.label) });
    });
    return result;
  };

  return (
    <>
      <Divider orientation="left" plain>{ st('CSS 配色') }</Divider>
      <Form.Item label={ st('默认颜色类型') }>
        <Select
          value={ colorType }
          style={{ width: 240 }}
          onChange={ (value: string) => { setColorType(value); setDefaultColorType(value); } }
          options={ getColorTypeList() }
        />
      </Form.Item>
      <Form.Item label={ st('默认展示配色板') }>
        <Select
          value={ colorPad }
          style={{ width: 240 }}
          onChange={ (value: string) => { setColorPad(value); setDefaultColorPad(value); } }
          options={ getColorPadList() }
        />
      </Form.Item>
      <Form.Item label={ st('默认透明度') }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520 } }>
          <Slider
            style={ { flex: 1, minWidth: 0 } }
            tooltip={{ formatter: (value? :number) => { return (value)? (value / 10) : null; } }} 
            value={ opacity }
            min = { 0 }
            max = { 10 }
            onChange={ (value) => { setOpacity(value); setDefaultOpacity(value); }}
          />
          <span>{ opacity / 10 }</span>
        </div>
      </Form.Item>
      <Form.Item label={ st('默认开启批量取色') }>
        <Switch 
          onChange={ (value: boolean) => { setBatchSwitch(value); setDefaultBatchSwitch(value); } }
          checkedChildren={ st('开启') } unCheckedChildren={ st('关闭') } 
          checked={ batchSwitch } />
      </Form.Item>
      <Form.Item label={ st('默认最大批量取色个数') }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520 } }>
          <Slider
            style={ { flex: 1, minWidth: 0 } }
            tooltip={{ formatter: (value? :number) => { return (value)? (value) : null; } }} 
            value={ pickMax }
            min = { 5 }
            max = { 20 }
            step = { 1 }
            onChange={ (value) => { setPickMax(value); setDefaultPickMax(value); }}
          />
          <span>{ pickMax }</span>
        </div>
      </Form.Item>
    </>
  );
}
