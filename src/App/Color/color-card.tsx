import type { ColorCardProps } from "./interface"
import { calcReadableTextColor, getColorString } from "./lib"

// 颜色卡: 第一行 = 颜色名称/色号, 第二行 = 当前颜色类型对应的编码
// 颜色类型选「颜色名称」时不展示编码 (编码与名称重复)
const ColorCard = ({ color, label, title, colorType, opacity, colorClickEvent } :ColorCardProps ) => {
  const showCode = colorType !== 'TEXT';
  const code = getColorString(color, label, colorType, opacity);

  return (
    <div 
      onClick={ () => { colorClickEvent(color,label) } }
      className='color-card' 
      title={ title? title : label } 
      // 文字颜色使用背景色的反色, 反色看不清时回退到黑/白
      style={ { backgroundColor: color, color: calcReadableTextColor(color) } }
    >
      <span className="color-card-name">
        { (label.length <= 10)? label : label.substring(0,8) + ".."}
      </span>
      { showCode && <span className="color-card-code">{ code }</span> }
    </div>
  );
}
export default ColorCard;
