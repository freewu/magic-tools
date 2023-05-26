import { copyTextToClipboard } from "./../../lib"
import type { MessageInstance } from  "antd/es/message/interface"
import { hex } from "color-convert"

// 颜色卡
const ColorCard = ({ color, label, title, notice, colorType, opacity } :ColorCardProps ) => {

  // 获取要写入到粘贴板的数据
  const getCopyData = () => {
    switch(colorType) {
      case 'TEXT': return label;
      case 'HEX': return color.replace("#","");
      case 'RGB': 
        const rgb = hex.rgb(color.replace("#",""));
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      case 'RGBA': 
        const rgba = hex.rgb(color.replace("#",""));
        return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${ opacity / 10 })`;
      case 'HSL': 
        const hsl = hex.hsl(color.replace("#",""));
        return `hsl(${hsl[0]}, ${hsl[1]}, ${hsl[2]})`;
      case 'HSLA': 
        const hsla = hex.hsl(color.replace("#",""));
        return `hsla(${hsla[0]}, ${hsla[1]}, ${hsla[2]}, ${ opacity / 10 })`;
      case 'HSV': 
        const hsv = hex.hsv(color.replace("#",""));
        return `hsv(${hsv[0]}, ${hsv[1]}, ${hsv[2]})`;
      case 'CMYK': 
        const cmyk = hex.cmyk(color.replace("#",""));
        return `cmyk(${cmyk[0]}, ${cmyk[1]}, ${cmyk[2]}, ${cmyk[3]})`;
      case 'LAB': 
        const lab = hex.lab(color.replace("#",""));
        return `lab(${lab[0]}, ${lab[1]}, ${lab[2]})`;
      case 'LCH': 
        const lch = hex.lch(color.replace("#",""));
        return `lch(${lch[0]}, ${lch[1]}, ${lch[2]})`;
      case 'XYZ': 
        const xyz = hex.xyz(color.replace("#",""));
        return `xyz(${xyz[0]}, ${xyz[1]}, ${xyz[2]})`;
    }
    return color;
  };

  /**
   *   { label: 'LAB', value: 'LAB' },
  { label: 'LCH', value: 'LCH' },
  { label: 'XYZ', value: 'XYZ' },
   */
  
  const cardClick = () => {
      copyTextToClipboard(getCopyData());
      notice.success("复制到粘贴板成功！！！");
  };

  return (
    <div 
      onClick={ cardClick }
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
  notice: MessageInstance, // 
  colorType: string, // 需要转换的颜色类型  hex / rgb / rgba / hsl / hsla
  opacity: number, // 不透明度 0.0 - 1.0  颜色类型为 rgba / hsla 时使用
}