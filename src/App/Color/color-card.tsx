import type { ColorCardProps } from "./interface"
import { calcReadableTextColor } from "./lib"

// 颜色卡
const ColorCard = ({ color, label, title, colorClickEvent } :ColorCardProps ) => {
  
  return (
    <div 
      onClick={ () => { colorClickEvent(color,label) } }
      className='color-card' 
      title={ title? title : label } 
      // 文字颜色使用背景色的反色, 反色看不清时回退到黑/白
      style={ { backgroundColor: color, color: calcReadableTextColor(color) } }
    >
      { (label.length <= 10)? label : label.substring(0,8) + ".."} 
      ( {color} )
    </div>
  );
}
export default ColorCard;