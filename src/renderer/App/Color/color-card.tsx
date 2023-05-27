import type { ColorCardProps } from "./interface"

// 颜色卡
const ColorCard = ({ color, label, title, colorClickEvent } :ColorCardProps ) => {
  
  return (
    <div 
      onClick={ () => { colorClickEvent(color,label) } }
      className='color-card' 
      title={ title } 
      style={ { backgroundColor: color } }
    >
      {label} ( {color} )
    </div>
  );
}
export default ColorCard;