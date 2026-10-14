import { Checkbox, Tooltip, Badge } from "antd";
import { useEffect, useRef, useState } from "react";
import type { BatchPickColorProps } from "./interface"
import { calcReadableTextColor, getColorString, getLevitationPos, setLevitationPos } from "./lib";
import colorLang from "./lang";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";

// 悬浮框
const LevitationBox = ({ colorList, flag, colorType, opacity, flagChangeEvent, colorListChange } :BatchPickColorProps ) => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(colorLang, locale, key, fallback);
  const boxRef = useRef<HTMLDivElement>(null); // 浮层根节点 (拖动定位用)
  const dragOffset = useRef({ dx: 0, dy: 0 }); // 按下位置距离浮层左上角的偏移
  const [ pos, setPos ] = useState(getLevitationPos()); // 拖动后的位置, null = 默认位置 (右上角)
  const posRef = useRef(pos);
  const [ dragging, setDragging ] = useState(false); // 是否正在拖动

  // 拖动时把浮层限制在窗口内 (避免拖出窗口后再也点不到)
  const clampPos = (x :number, y :number) => {
    const box = boxRef.current;
    const maxX = Math.max(0, window.innerWidth - (box?.offsetWidth ?? 0));
    const maxY = Math.max(0, window.innerHeight - (box?.offsetHeight ?? 0));
    return {
      x: Math.min(Math.max(x, 0), maxX),
      y: Math.min(Math.max(y, 0), maxY),
    };
  };

  const startDrag = (clientX :number, clientY :number) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    dragOffset.current = { dx: clientX - rect.left, dy: clientY - rect.top };
    setDragging(true);
  };

  // 复选框区域不参与拖动 (保留点击开关批量取色)
  const isSwitchArea = (target: EventTarget | null) => !!((target as HTMLElement)?.closest?.('.ant-checkbox-wrapper'));

  const onMouseDown = (e :React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isSwitchArea(e.target)) return;
    e.preventDefault(); // 拖动时不选中文字
    startDrag(e.clientX, e.clientY);
  };

  const onTouchStart = (e :React.TouchEvent) => {
    if (isSwitchArea(e.target)) return;
    const touch = e.touches[0];
    if (touch) startDrag(touch.clientX, touch.clientY);
  };

  // 拖动中: 跟随鼠标 / 手指移动, 结束时记住位置
  useEffect(() => {
    if (!dragging) return;
    const moveTo = (clientX :number, clientY :number) => {
      const next = clampPos(clientX - dragOffset.current.dx, clientY - dragOffset.current.dy);
      posRef.current = next;
      setPos(next);
    };
    const onMouseMove = (e :MouseEvent) => { moveTo(e.clientX, e.clientY); };
    const onTouchMove = (e :TouchEvent) => { const touch = e.touches[0]; if (touch) moveTo(touch.clientX, touch.clientY); };
    const onEnd = () => {
      setDragging(false);
      if (posRef.current) setLevitationPos(posRef.current);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [dragging]);

  // 窗口尺寸变化时把浮层拉回可视区域
  const hasPos = pos !== null;
  useEffect(() => {
    if (!hasPos) return;
    const onResize = () => {
      setPos((old) => (old ? clampPos(old.x, old.y) : old));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [hasPos]);

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
    <div
      ref={ boxRef }
      className={ 'levitation-box' + (dragging ? ' levitation-box-dragging' : '') + (pos? ' levitation-box-moved' : '') }
      style={ pos? { left: pos.x, top: pos.y } : undefined }
      onMouseDown={ onMouseDown }
      onTouchStart={ onTouchStart }
    >
      <Badge count={ colorList?.length }>
        <div className="levitation-box-content">
          <Tooltip
            placement="left"
            title={ <>{ t('removeTip','双击剔除不需要的颜色') }<br/>{ t('dragTip','按住浮层拖动可调整位置') }</> }
          >
            <Checkbox defaultChecked= { flag } onChange={ switchBatchPick }>
            { t('batchPick','批量取色') }
          </Checkbox>
          </Tooltip>
        <ul>
          {
            colorList.map((item) => {
              // 与粘贴板一致: 只展示当前颜色类型对应的值
              // (颜色名称类型时该值就是颜色名称, 其它类型展示编码)
              const text = getColorString(item.color, item.label, colorType, opacity);
              return (
              <li 
                key={ item.color }
                onDoubleClick={ () => { removeColor(item.color) } }
                style={ { backgroundColor: item.color, color: calcReadableTextColor(item.color) } } 
                title = { text }  
              >
                <span className="levitation-li-text">{ text }</span>
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
