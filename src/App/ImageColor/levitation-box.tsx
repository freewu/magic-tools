import { rgb2Hex } from "./lib"

// 悬浮框
const LevitationBox = ({ colorList, colorMap } :LevitationBoxProps ) => {

  return (
    <div className="levitation-box">
      <div className="levitation-box-content">
        <ul>
          {
            colorList.map((item,index) => {
              return (
              <li 
                key={ item.toString() + index }
                style={ { backgroundColor: rgb2Hex(item.toString()) } } 
                title = { rgb2Hex(item.toString()) }  
              >
                { rgb2Hex(item.toString()) }
              </li>)
            })
          }
        </ul>
      </div>
    </div>
  )
}
export default LevitationBox;

export type LevitationBoxProps = {
  colorList :Array<String>
  colorMap :Map<string,number>
}