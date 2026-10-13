// 拼豆图纸: 拼豆品牌色卡
//
// 色值直接复用「CSS 配色」工具抓取好的拼豆色卡数据 (src/App/Color/data),
// 避免重复维护; 每张色卡的 label 形如 "A1" / "P01 White" / "S01 White",
// 取空格前的部分作为图纸上的色号 (code), 其余作为颜色名 (name)。
import {
  MardColor,
  CocoColor,
  ArtkalColor,
  ArtkalMiniColor,
  PerlerColor,
  HamaColor,
} from '../Color/data/index';

export interface BeadColor {
  /** 色号 (图纸格子里显示的编号, 如 A1 / P01 / S01) */
  code: string;
  /** 颜色名 (可能为空) */
  name: string;
  /** 色值 #RRGGBB (大写) */
  hex: string;
}

/** 豆子尺寸档: mini = 小豆 2.6mm, big = 大豆 5.0mm */
export type BeadSize = 'mini' | 'big';

export interface BeadBrand {
  key: string;
  /** 品牌名 (通用名词, 不做翻译) */
  name: string;
  /** 单颗豆直径 (mm) */
  mm: number;
  size: BeadSize;
  /** 颜色数量 (色卡色数) */
  colors: BeadColor[];
}

interface ColorRow { label: string; code: string; info: string; }

/** 色卡行 -> 拼豆色 (过滤掉分组用的空 code 行) */
const toColors = (rows: Array<ColorRow>): BeadColor[] => rows
  .filter((r) => /^#[0-9A-Fa-f]{6}$/.test(r.code))
  .map((r) => {
    const label = String(r.label ?? '').trim();
    const sp = label.indexOf(' ');
    const code = sp > 0 ? label.slice(0, sp) : label;
    const name = sp > 0 ? label.slice(sp + 1).trim() : '';
    return { code, name, hex: r.code.toUpperCase() };
  });

export const BEAD_BRANDS: BeadBrand[] = [
  { key: 'mard', name: 'MARD 221', mm: 2.6, size: 'mini', colors: toColors(MardColor) },
  { key: 'coco', name: 'COCO 291', mm: 2.6, size: 'mini', colors: toColors(CocoColor) },
  { key: 'artkal-mini', name: 'Artkal Mini', mm: 2.6, size: 'mini', colors: toColors(ArtkalMiniColor) },
  { key: 'artkal', name: 'Artkal', mm: 5, size: 'big', colors: toColors(ArtkalColor) },
  { key: 'perler', name: 'Perler', mm: 5, size: 'big', colors: toColors(PerlerColor) },
  { key: 'hama', name: 'Hama', mm: 5, size: 'big', colors: toColors(HamaColor) },
];

export const DEFAULT_BRAND = 'mard';

export const getBrand = (key: string): BeadBrand =>
  BEAD_BRANDS.find((b) => b.key === key) ?? BEAD_BRANDS[0];
