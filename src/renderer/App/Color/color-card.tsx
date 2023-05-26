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

// ColorCard 接收参数
export interface ColorCardProps {
  color: string, // 颜色编码 #ffffff
  label: string, // 颜色名称 黑
  title?: string, // 颜色名称提示
  colorClickEvent: Function, // 单击颜色的事件
}