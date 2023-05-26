import { Divider } from "antd";
import { default as ColorCard } from "./color-card"

const ColorPad = ({ colorList, height, colorClickEvent } :ColorPadProps ) => {

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
            <ColorCard color={ item.code } label={ item.label } colorClickEvent={ colorClickEvent } />
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
  height: string, // 颜色盘高度 窗口缩放需要调整 "800px"
  colorClickEvent: Function, // 单击颜色的事件
}