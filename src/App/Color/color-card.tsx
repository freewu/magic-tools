import type { ColorCardProps } from "./interface"
import { calcReadableTextColor } from "./lib"
import { containsChinese, getCharPinyin } from "./pinyin"

// 汉字上方的拼音注音 (ruby 布局: 汉字为基字, 拼音为注音)
const PinyinText = ({ text } :{ text: string }) => {
  return (
    <>
    {
      Array.from(text).map((char,index) => {
        const pinyin = getCharPinyin(char);
        // 非汉字 / 未收录的字符不加注音
        if(pinyin === "") return <span key={ index }>{ char }</span>;
        return <ruby key={ index }>{ char }<rt>{ pinyin }</rt></ruby>;
      })
    }
    </>
  );
}

// 颜色卡
const ColorCard = ({ color, label, title, pinyin, colorClickEvent } :ColorCardProps ) => {
  const text = (label.length <= 10)? label : label.substring(0,8) + "..";
  // 开启了拼音注音 且 名称包含汉字时才需要注音排版
  const showPinyin = (pinyin === true) && containsChinese(text);

  return (
    <div 
      onClick={ () => { colorClickEvent(color,label) } }
      className={ showPinyin? 'color-card color-card-pinyin' : 'color-card' } 
      title={ title? title : label } 
      // 文字颜色使用背景色的反色, 反色看不清时回退到黑/白
      style={ { backgroundColor: color, color: calcReadableTextColor(color) } }
    >
      { (showPinyin)? <PinyinText text={ text } /> : text } 
      ( {color} )
    </div>
  );
}
export default ColorCard;
