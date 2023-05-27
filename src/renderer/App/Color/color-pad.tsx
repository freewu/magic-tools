import { Divider } from "antd";
import { default as ColorCard } from "./color-card"
import type { ColorPadProps } from "./interface"

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