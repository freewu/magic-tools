// 图片转 SVG: 参数范围 / 默认值 / 预设组合
//
// 取值范围与默认值对齐 visioncortex VTracer 的命令行工具 (vtracer --help):
// 本文件只定义"界面层"的枚举 / 区间与默认值, 归一化与参数映射逻辑在 lib.ts。

/** 颜色模式: color = 彩色分层聚类 (照片 / 插画), binary = 黑白二值 (线稿 / 印章) */
export const COLOR_MODES = [ 'color', 'binary' ] as const;
export type ColorMode = typeof COLOR_MODES[number];
export const COLOR_MODE_DEFAULT: ColorMode = 'color';

/** 曲线拟合方式: spline = 平滑曲线, polygon = 直线多边形, pixel = 保留像素方块 */
export const MODES = [ 'spline', 'polygon', 'pixel' ] as const;
export type Mode = typeof MODES[number];
export const MODE_DEFAULT: Mode = 'spline';

/** 层叠策略: stacked = 层层叠加 (文件更小), cutout = 镂空 (每块互不重叠) */
export const HIERARCHICALS = [ 'stacked', 'cutout' ] as const;
export type Hierarchical = typeof HIERARCHICALS[number];
export const HIERARCHICAL_DEFAULT: Hierarchical = 'stacked';

/** 数值参数定义 (范围 / 步长 / 默认值) */
export interface NumParam { min: number; max: number; step: number; def: number; }

export const PARAMS = {
  /** 忽略小于该面积的碎块 (噪声斑点), 越大越干净 */
  filterSpeckle: { min: 0, max: 128, step: 1, def: 4 },
  /** 颜色精度 (1~8), 越大保留的相近色越多、色块越细 */
  colorPrecision: { min: 1, max: 8, step: 1, def: 6 },
  /** 层间色差阈值 (0~255), 越大越容易合并成同一层 (层数更少、色带更明显) */
  layerDifference: { min: 0, max: 255, step: 1, def: 16 },
  /** 视为"角"的最小夹角 (度), 越大保留的棱角越多 */
  cornerThreshold: { min: 0, max: 180, step: 1, def: 60 },
  /** 曲线细分的线段长度阈值, 越大曲线越平滑 (细节越少) */
  lengthThreshold: { min: 0.5, max: 10, step: 0.5, def: 4 },
  /** 样条逼近最大迭代次数, 越大曲线越平滑 */
  maxIterations: { min: 1, max: 100, step: 1, def: 10 },
  /** 拼接样条的最小角度位移 (度), 越大越平滑 (转折处越圆) */
  spliceThreshold: { min: 0, max: 180, step: 1, def: 45 },
  /** 坐标小数位数 (0~8), 越小文件越小 */
  pathPrecision: { min: 0, max: 8, step: 1, def: 2 },
} as const;

export type ParamKey = keyof typeof PARAMS;

/** 页面上的完整参数集合 (colorMode 为界面概念: binary 对应 VTracer 的 binary 开关) */
export interface TraceConfig {
  colorMode: ColorMode;
  mode: Mode;
  hierarchical: Hierarchical;
  filterSpeckle: number;
  colorPrecision: number;
  layerDifference: number;
  cornerThreshold: number;
  lengthThreshold: number;
  maxIterations: number;
  spliceThreshold: number;
  pathPrecision: number;
}

/** 默认参数 (与 VTracer 命令行默认值一致, pathPrecision 取 2 让文件更紧凑) */
export const DEFAULT_CONFIG: TraceConfig = {
  colorMode: COLOR_MODE_DEFAULT,
  mode: MODE_DEFAULT,
  hierarchical: HIERARCHICAL_DEFAULT,
  filterSpeckle: PARAMS.filterSpeckle.def,
  colorPrecision: PARAMS.colorPrecision.def,
  layerDifference: PARAMS.layerDifference.def,
  cornerThreshold: PARAMS.cornerThreshold.def,
  lengthThreshold: PARAMS.lengthThreshold.def,
  maxIterations: PARAMS.maxIterations.def,
  spliceThreshold: PARAMS.spliceThreshold.def,
  pathPrecision: PARAMS.pathPrecision.def,
};

/** 预设: 针对常见素材类型的参数组合 (label / hint 由页面按语言取词) */
export interface Preset { key: string; config: Partial<TraceConfig>; }
export const PRESETS: Preset[] = [
  { key: 'default', config: {} },
  // 照片: 保留更多相近色与细节
  { key: 'photo', config: { mode: 'spline', colorPrecision: 8, layerDifference: 8, filterSpeckle: 2 } },
  // 扁平插画 / 图标: 层间色差放大, 让纯色块归并
  { key: 'flat', config: { mode: 'spline', colorPrecision: 6, layerDifference: 64, filterSpeckle: 8 } },
  // 海报 / 色块画: 更大色差 + 更强斑点过滤, 得到大块纯色
  { key: 'poster', config: { mode: 'spline', colorPrecision: 4, layerDifference: 96, filterSpeckle: 16 } },
  // 线稿 / 手绘: 二值 + 更多棱角 + 更贴合原线
  { key: 'line', config: { colorMode: 'binary', mode: 'spline', filterSpeckle: 4, cornerThreshold: 80, lengthThreshold: 2, maxIterations: 16 } },
  // 印章 / 文字: 二值 + 直线多边形, 边缘更"硬"
  { key: 'stamp', config: { colorMode: 'binary', mode: 'polygon', filterSpeckle: 8, cornerThreshold: 60 } },
  // 像素风 / 复古游戏: 不做曲线拟合, 保留方块
  { key: 'pixel', config: { mode: 'pixel', colorPrecision: 8, layerDifference: 0, filterSpeckle: 0 } },
];
export const PRESET_DEFAULT = PRESETS[0].key;

/**
 * 送入矢量化的最长边上限 (0 = 原尺寸)
 * 矢量化结果与分辨率无关, 先缩小再描线可大幅提速且几乎不影响观感
 */
export const TRACE_SIZES = [ 0, 2048, 1024, 512 ] as const;
export const TRACE_SIZE_DEFAULT = 1024;

/** 矢量化像素总量上限 (原尺寸处理超大图时的兜底, 避免长时间卡住主线程) */
export const TRACE_PIXEL_LIMIT = 12_000_000;

/** 结果预览区尺寸上限 */
export const PREVIEW_MAX_W = 260;
export const PREVIEW_MAX_H = 200;

/** 源码预览区高度上限 (仅显示用, 超出部分不渲染) */
export const SOURCE_MAX_CHARS = 200_000;

/** 导出文件名后缀: 原名_vector.svg */
export const FILE_SUFFIX = 'vector';
