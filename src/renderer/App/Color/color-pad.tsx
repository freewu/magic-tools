import { Divider } from "antd";
import { default as ColorCard } from "./color-card"
import type { MessageInstance } from  "antd/es/message/interface"


const ColorPad = ({ colorList, notice, height, colorType, opacity } :ColorPadProps ) => {

  return (
    <div className="color-pad" style={ { height: height} }>
    {
      colorList?.map( (item ) => {
        // 如果代码为空 说明需要插入一个分割行
        if(item.code == "") {
          return (
            <Divider />
          );
        } else {
          return (
            <ColorCard color={ item.code } label={ item.label } notice={ notice } colorType={ colorType } opacity={ opacity } />
          );
        }
      })
    }
    </div>
  );
}
export default ColorPad;

// ColorPad 接收参数
export interface ColorPadProps {
  colorList?: Array<any> // 颜色列表 [{label:"黑",code:"#000000"}]
  notice: MessageInstance, // 提醒方法
  height: string, // 颜色盘高度 窗口缩放需要调整 "800px"
  colorType: string, // 需要转换的颜色类型  hex / rgb / rgba / hsl / hsla
  opacity: number, // 不透明度 0.0 - 1.0  颜色类型为 rgba / hsla 时使用
}