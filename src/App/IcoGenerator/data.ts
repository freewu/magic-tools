// ICO 支持的生成尺寸
export const ICO_SIZES = [16, 24, 32, 48, 64, 128] as const;
export type IcoSize = (typeof ICO_SIZES)[number];

export const DEFAULT_ICO_SIZE: IcoSize = 32;
