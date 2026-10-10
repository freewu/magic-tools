import { colorDataList } from './data';
import MardColor from './data/mard';
import CocoColor from './data/coco';
import ArtkalColor from './data/artkal';
import PerlerColor from './data/perler';
import HamaColor from './data/hama';
import DmcColor from './data/dmc';

// 分割行 (color-pad 里 code 为空时渲染成分隔标题)
const isDivider = (code: string) => code === '';

describe('Color 配色板数据', () => {
  test('每个配色板都有数据, key 唯一', () => {
    expect(colorDataList.length).toBeGreaterThan(0);
    const keys = colorDataList.map((pad) => pad.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const pad of colorDataList) {
      expect(pad.label.length).toBeGreaterThan(0);
      expect(pad.data.length).toBeGreaterThan(0);
    }
  });

  test('色值均为 #RRGGBB, 非分割行必须有名称', () => {
    for (const pad of colorDataList) {
      for (const item of pad.data) {
        if (isDivider(item.code)) continue;
        expect(item.code).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
  });

  test('拼豆色卡颜色数量与来源一致 (bitbead.app)', () => {
    expect(MardColor.length).toBe(221); // MARD 221
    expect(CocoColor.length).toBe(291); // COCO 291
    expect(ArtkalColor.length).toBe(176); // Artkal
    expect(PerlerColor.length).toBe(117); // Perler
    expect(HamaColor.length).toBe(89); // Hama
    expect(DmcColor.length).toBe(489); // DMC 绣线
  });

  test('拼豆色卡已注册到配色板列表 (key 与语言包一一对应)', () => {
    const keys = colorDataList.map((pad) => pad.key);
    for (const key of ['mard', 'coco', 'artkal', 'perler', 'hama', 'dmc']) {
      expect(keys).toContain(key);
    }
  });

  test('拼豆色卡色号唯一 (同名色号不做重复展示)', () => {
    for (const list of [MardColor, CocoColor, ArtkalColor, PerlerColor, HamaColor, DmcColor]) {
      const labels = list.map((item) => item.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });
});
