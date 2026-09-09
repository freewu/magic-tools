import { Checkbox, Tooltip, Badge } from "antd";
import type { BatchPickColorProps } from "./interface"
import colorLang from "./lang";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";

// 悬浮框
const LevitationBox = ({ colorList, flag, flagChangeEvent, colorListChange } :BatchPickColorProps ) => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(colorLang, locale, key, fallback);

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
          <Tooltip placement="left" title={ t('removeTip','双击剔除不需要的颜色') }>
            <Checkbox defaultChecked= { flag } onChange={ switchBatchPick }>
            { t('batchPick','批量取色') }
          </Checkbox>
          </Tooltip>
        <ul>
          {
            colorList.map((item) => {
              return (
              <li 
                key={ item.color }
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