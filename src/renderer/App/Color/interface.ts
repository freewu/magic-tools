// 选择的颜色
export interface PickColorEntity {
  color: string,
  label: string,
  title?: string,
}

// ColorPad 接收参数
export interface ColorPadProps {
  colorList?: Array<any> // 颜色列表 [{label:"黑",code:"#000000"}]
  height: string, // 颜色盘高度 窗口缩放需要调整 "800px"
  colorClickEvent: Function, // 单击颜色的事件
}

// ColorCard 接收参数
export interface ColorCardProps {
  color: string, // 颜色编码 #ffffff
  label: string, // 颜色名称 黑
  title?: string, // 颜色名称提示
  colorClickEvent: Function, // 单击颜色的事件
}

// 批量取色绩组件接收参数
export interface BatchPickColorProps {
  colorList: Array<PickColorEntity> // 颜色列表 [{label:"黑",code:"#000000"}]
  flag: boolean, // 是否选中
  flagChangeEvent: Function, // 批量取色事件
  colorListChange: Function, // 批量颜色变更调用
}