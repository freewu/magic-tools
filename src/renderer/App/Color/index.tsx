import { Tabs, message, Radio, Tooltip, Slider, Space } from "antd";
import { default as ColorPad } from "./color-pad"
import { default as LevitationBox } from "./levitation-box"
import { ChinesePainting, ChineseTraditional, JapaneseColor } from "./data/index"
import { colorTypeList } from "./data"
import "./color.css"
import { useState } from "react";
import type { RadioChangeEvent } from 'antd';
import { copyTextToClipboard } from "../../lib";
import { getColorString } from "./lib";

const Color = () => {
  // 颜色板的调度,窗口调整,颜色板高度也需要调整
  const genColorPadHeight = () => {
    return (window.innerHeight - 180) + "px";
  };

  // 选择颜色类型, 为了展示美观 小窗口不展示那么多颜色类型
  const pickColorTypeList = () => {
    //return colorTypeList;
    // 缩放卡顿，先注释
    if (window.innerWidth > 1200) return colorTypeList;
    const a = colorTypeList.filter((v) => {
      if(v.label == 'LAB' || v.label == 'LCH' || v.label == 'XYZ' || v.label == 'HSV') return false
      return true;
    });
    return a;
  }

  const [ notice, contextHolder ] = message.useMessage();
  const [ height, setHeight ] = useState(genColorPadHeight());
  const [ colorType, setColorType ] = useState('HEX1');
  const [ opacityDisabled, setOpacityDisabled ] = useState(true);
  const [ opacity, setOpacity ] = useState(9);
  const [ typeList, setTypeList ] = useState(pickColorTypeList());

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', () => {
    // 改变色板展示高度
    setHeight(genColorPadHeight()) 
    // 改变转换颜色类型 ( 为了美观 小窗口不展示那么多)
    setTypeList(pickColorTypeList())
  });

  const onTabChange = (key: any) => {
    console.log(key);
  };

  const onColorTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setOpacityDisabled( !(value == "RGBA" || value == "HSLA" )); // 需要展示不透明度
    setColorType(value);
  };

  const onOpacityChange = (value :number) => {
    setOpacity(value);
  }

  const cardClick = (color :string , label :string) => {
    copyTextToClipboard(getColorString(color, label, colorType, opacity ));
    notice.success("复制到粘贴板成功！！！");
  };

  const items = [
    {
      key: 'chinese-traditional',
      label: `中国传统色彩`,
      children: <ColorPad colorList={ ChineseTraditional } height = { height } colorClickEvent={ cardClick}  />,
    },
    {
      key: 'chinese-painting',
      label: `国画常用色彩`,
      children: <ColorPad colorList={ ChinesePainting } height = { height } colorClickEvent={ cardClick} />,
    },
    {
      key: 'japanese-color',
      label: `日式配色`,
      children: <ColorPad colorList={ JapaneseColor } height = { height }  colorClickEvent={ cardClick} />,
    },
  ];

  return (
    <>
    { contextHolder }
    <Space>
      <Tooltip placement="top" title={ "单击色块复制到粘贴板的内容" }>
        <Radio.Group 
          optionType = "button" buttonStyle="solid"
          options = { typeList } 
          onChange={ onColorTypeChange } 
          value={ colorType } 
        />
      </Tooltip>
      &nbsp;Opacity:&nbsp;{ ( opacity / 10 ) }
      <div style={ { width: "120px"} }>
      <Slider
        tooltip={{ formatter: null }} 
        disabled = { opacityDisabled }
        min={0}
        max={10}
        value = { opacity }
        onChange={ onOpacityChange }
      />
      </div>
    </Space>
    <Tabs defaultValue={ "chinese-traditional" } items={ items } onChange={ onTabChange } />
    {/* 悬浮框 */}
    <LevitationBox />
    </>
  );
}

export default Color;