import { Checkbox, Tooltip, Badge } from "antd";
import type { BatchPickColorProps } from "./interface"

// 悬浮框
const LevitationBox = ({ colorList, flag, flagChangeEvent, colorListChange } :BatchPickColorProps ) => {

  const switchBatchPick = () => {
    flagChangeEvent(!flag);
    if(flag) { // true => false 即关闭时,清空颜色列表
      colorListChange([])
    }
  };

  // 移除选择的元素
  const removeColor = (color :string) => {
    const list = colorList.filter((item) => { return item.color !== color});
    colorListChange(list);
  }

  return (
    <div className="levitation-box">
      <Badge count={ colorList?.length }>
        <div className="levitation-box-content">
          <Tooltip placement="left" title={ "双击剔除不需要的颜色" }>
            <Checkbox defaultChecked= { flag } onChange={ switchBatchPick }>批量取色</Checkbox>
          </Tooltip>
        <ul>
          {
            colorList.map((item) => {
              return (
              <li 
                onDoubleClick={ () => { removeColor(item.color) } }
                style={ { backgroundColor: item.color } } 
                title = { item.label }  
              >
                {/* { item.label } */}
              </li>)
            })
          }
        </ul>
        </div>
      </Badge>
    </div>
  )
}
export default LevitationBox;