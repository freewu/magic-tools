import { SIDER_SUBMENU_PLACEMENTS } from '../layout/submenu-placements';

// 回归保护: 侧栏折叠时二级菜单飞出浮层必须带 shiftY。
// 缺少 shiftY 时, 「其它」这类子项较多的分类在侧栏底部展开, 浮层底部会被视口裁掉。
describe('SIDER_SUBMENU_PLACEMENTS', () => {
  it('覆盖左右两侧的四个方向, 保证浮层默认在侧栏右侧展开', () => {
    expect(Object.keys(SIDER_SUBMENU_PLACEMENTS).sort()).toEqual(
      ['leftBottom', 'leftTop', 'rightBottom', 'rightTop']
    );

    // 右侧展开: 浮层左边(左/上)贴触发器右侧
    expect(SIDER_SUBMENU_PLACEMENTS.rightTop.points).toEqual(['tl', 'tr']);
    expect(SIDER_SUBMENU_PLACEMENTS.rightBottom.points).toEqual(['bl', 'br']);
  });

  it('所有方向都开启 shiftY, 浮层超出视口时整体平移回视口内', () => {
    for (const [name, placement] of Object.entries(SIDER_SUBMENU_PLACEMENTS)) {
      expect(`${name}:${placement.overflow.adjustX}`).toBe(`${name}:1`);
      expect(`${name}:${placement.overflow.adjustY}`).toBe(`${name}:1`);
      expect(`${name}:${placement.overflow.shiftY}`).toBe(`${name}:1`);
    }
  });
});
