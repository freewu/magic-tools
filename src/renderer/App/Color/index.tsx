import { Tabs, message, Radio, Tooltip, Slider, Space } from "antd";
import { default as ColorPad } from "./color-pad"
import { default as LevitationBox } from "./levitation-box"
import { useState } from "react";
import type { RadioChangeEvent } from 'antd';
import { copyTextToClipboard, debounce } from "../../lib";
import { getColorString, pickColorTypeList } from "./lib";
import "./color.css"
import { colorDataList } from "./data"
import type { PickColorEntity } from "./interface"

const Color = () => {
  // 颜色板的调度,窗口调整,颜色板高度也需要调整
  const genColorPadHeight = () => {
    return (window.innerHeight - 180) + "px";
  };

  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒
  const [ height, setHeight ] = useState(genColorPadHeight()); // 颜色板高度
  const [ colorType, setColorType ] = useState('HEX1'); // 选中择颜色类型
  const [ opacityDisabled, setOpacityDisabled ] = useState(true); // 不透明度不可用 开启/关闭透明度选择器 
  const [ opacity, setOpacity ] = useState(9); // // 不透明度
  const [ typeList, setTypeList ] = useState(pickColorTypeList()); // 颜色类型列表
  const [ batchPickFlag, setBatchPickFlag ] = useState(false); // 是否开启批量取色
  const [ pickColorList, setPickColorList ] = useState(Array<PickColorEntity>); // 批量取色列表

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize',
    debounce(() => {
      // 改变色板展示高度
      setHeight(genColorPadHeight()) 
      // 改变转换颜色类型 ( 为了美观 小窗口不展示那么多)
      setTypeList(pickColorTypeList())
    },100));

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
    // 开启了批量取色
    if(batchPickFlag) {
      // 把颜色存入列表中
      addPickColor({color: color,label:label});
    } else {
      copyTextToClipboard(getColorString(color, label, colorType, opacity ));
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const addPickColor = ({color,label} :PickColorEntity) => {
    // 判断颜色是否已存在列表中,存在不做处理
    if( pickColorList.findIndex((item: PickColorEntity) => item.color === color) >= 0) {
      return ;
    }
    // 列表大于 `10` 个时, `shift` 出第一个数据
    if(pickColorList.length >= 10) pickColorList.shift();

    updatePickColorList([...pickColorList,{color,label}]);
  }

  // 更新选中的颜色列表并更新粘贴板
  const updatePickColorList = (list: Array<PickColorEntity>) => {
    // 更新列表
    setPickColorList(list);
    // 更新粘贴板
    const arr :Array<string> = [];
    list.forEach((item: PickColorEntity) => {
      arr.push(getColorString(item.color, item.color, colorType, opacity));
    });
    copyTextToClipboard(arr.toString());
  }

  // 生成颜色板
  const items = colorDataList.map ((item) => {
    return {
      key : item.key,
      label : item.label,
      children: <ColorPad colorList={ item.data } height = { height } colorClickEvent={ cardClick } />,
    }
  });

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
    <LevitationBox colorList={ pickColorList } flag={ batchPickFlag } flagChangeEvent={ setBatchPickFlag } colorListChange={ updatePickColorList } />
    </>
  );
}

export default Color;