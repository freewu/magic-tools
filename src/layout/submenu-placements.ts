// 侧栏折叠时, 分类子菜单以浮层 (flyout) 形式飞出到侧栏右侧。
//
// rc-menu 内置的 placements 只带 adjustX / adjustY: 当浮层比视口剩余空间更高时,
// 它只能在「保持向下展开」和「翻转到触发器上方」之间二选一, 两者都会被窗口边缘裁掉一部分。
// 「其它」这类子项较多的分类 (17 项) 位于侧栏最底部, 向下展开时底部子项就落到视口外,
// 表现为「看不到 / 点不到底部的子应用」。
//
// 补上 shiftY 后, rc-trigger 在翻转之后会再做一次平移, 让整块浮层 (含顶部/底部溢出)
// 始终落在视口内; 浮层列表本身由 antd 限制高度并自带滚动条, 因此全部子项都可滚动到达。
type SubMenuPlacement = {
  points: [string, string];
  overflow: { adjustX: number; adjustY: number; shiftY: number };
};

// shiftY / adjustX / adjustY 均为 1 表示开启 (rc-trigger 中 >= 0 即视为支持)
const overflow = { adjustX: 1, adjustY: 1, shiftY: 1 };

// 只需覆盖需要修正的四个方向, 其余方向会与 rc-menu 默认值合并
export const SIDER_SUBMENU_PLACEMENTS: Record<string, SubMenuPlacement> = {
  rightTop: { points: ['tl', 'tr'], overflow },
  rightBottom: { points: ['bl', 'br'], overflow },
  leftTop: { points: ['tr', 'tl'], overflow },
  leftBottom: { points: ['br', 'bl'], overflow },
};
