import type { ColorCardProps } from "./interface"
import { calcComplementaryColor } from "./lib"

// 颜色卡
const ColorCard = ({ color, label, title, colorClickEvent } :ColorCardProps ) => {
  
  return (
    <div 
      onClick={ () => { colorClickEvent(color,label) } }
      className='color-card' 
      title={ title? title : label } 
      style={ { backgroundColor: color } }
      //style={ { backgroundColor: color, color: calcComplementaryColor(color) } }
    >
      { (label.length <= 10)? label : label.substring(0,8) + ".."} 
      ( {color} )
    </div>
  );
}
export default ColorCard;