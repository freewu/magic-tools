import { colorDataList } from './data';
import MardColor from './data/mard';
import CocoColor from './data/coco';
import ArtkalColor from './data/artkal';
import ArtkalMiniColor from './data/artkal-mini';
import PerlerColor from './data/perler';
import HamaColor from './data/hama';
import DmcColor from './data/dmc';

type ColorRow = { label: string; code: string; info: string };

// 分割行 (color-pad 里 code 为空时渲染成分隔标题)
const isDivider = (code: string) => code === '';

// 按分割行切分出各个系列 (color-pad 的展示顺序)
const sectionsOf = (list: ColorRow[]) => {
  const sections: Array<{ name: string; colors: ColorRow[] }> = [];
  for (const item of list) {
    if (isDivider(item.code)) sections.push({ name: item.label, colors: [] });
    else sections[sections.length - 1]?.colors.push(item);
  }
  return sections;
};

const groupSeries = (list: ColorRow[]) => sectionsOf(list).map((section) => section.name);
const groupCounts = (list: ColorRow[]) => sectionsOf(list).map((section) => section.colors.length);
// 色块数量 (不包含分割行)
const colorCount = (list: ColorRow[]) => list.filter((item) => !isDivider(item.code)).length;

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
    expect(colorCount(MardColor)).toBe(221); // MARD 221
    expect(colorCount(CocoColor)).toBe(291); // COCO 291
    expect(colorCount(ArtkalColor)).toBe(176); // Artkal
    expect(colorCount(ArtkalMiniColor)).toBe(221); // Artkal Mini
    expect(colorCount(PerlerColor)).toBe(117); // Perler
    expect(colorCount(HamaColor)).toBe(89); // Hama
    expect(colorCount(DmcColor)).toBe(489); // DMC 绣线
  });

  test('拼豆色卡已注册到配色板列表 (key 与语言包一一对应)', () => {
    const keys = colorDataList.map((pad) => pad.key);
    for (const key of ['mard', 'coco', 'artkal', 'artkal-mini', 'perler', 'hama', 'dmc']) {
      expect(keys).toContain(key);
    }
  });

  test('拼豆色卡色号唯一 (同名色号不做重复展示)', () => {
    for (const list of [MardColor, CocoColor, ArtkalColor, ArtkalMiniColor, PerlerColor, HamaColor, DmcColor]) {
      const labels = list.filter((item) => !isDivider(item.code)).map((item) => item.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  test('MARD / COCO / Artkal / Artkal Mini 按系列分组, 系列名与色数与来源一致', () => {
    expect(groupSeries(MardColor)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'M']);
    expect(groupCounts(MardColor)).toEqual([26, 32, 29, 26, 24, 25, 21, 23, 15]);
    expect(groupSeries(CocoColor)).toEqual([
      'E', 'D', 'K', 'C', 'F', 'G', 'H', 'J', 'Z', 'A', 'B', 'Y', 'M', 'W', 'L', 'S', 'N', 'GB',
    ]);
    expect(groupCounts(CocoColor)).toEqual([15, 8, 39, 10, 25, 8, 32, 22, 24, 12, 11, 15, 23, 5, 14, 15, 5, 8]);
    expect(groupSeries(ArtkalColor)).toEqual(['S', 'SE']);
    expect(groupSeries(ArtkalMiniColor)).toEqual(['MA', 'MB', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MM']);
    expect(groupCounts(ArtkalMiniColor)).toEqual([26, 32, 29, 26, 24, 25, 21, 23, 15]);
  });

  test('分组后的每个系列都落在自己的分割行下, 且系列内按色号序号升序', () => {
    for (const list of [MardColor, CocoColor, ArtkalColor, ArtkalMiniColor]) {
      const sections = sectionsOf(list);
      // 每个分割行后面必须跟着该系列的色号, 最后一行不能是分割行
      expect(sections.length).toBeGreaterThan(1);
      expect(isDivider(list[list.length - 1].code)).toBe(false);
      for (const section of sections) {
        expect(section.colors.length).toBeGreaterThan(0);
        for (const color of section.colors) {
          expect(color.label.startsWith(section.name)).toBe(true);
        }
        const numbers = section.colors.map((color) => Number(/\d+/.exec(color.label)?.[0] ?? 0));
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      }
    }
  });
});
