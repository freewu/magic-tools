// ICO 生成核心
// ICO 容器格式: ICONDIR(6) + ICONDIRENTRY(16) + 图像数据
// 现代实现内嵌单张 32bpp PNG (Windows Vista+ 全兼容), 保留透明通道
import { ICO_SIZES, type IcoSize } from './data';

const ICO_DEFAULT: IcoSize = 32;

/** 读取设置里的默认生成尺寸 (localStorage), 缺省 32 */
export const getDefaultSize = (): IcoSize => {
  try {
    const v = localStorage.getItem('ico:default-size');
    if (v && (ICO_SIZES as readonly number[]).includes(Number(v))) return Number(v) as IcoSize;
  } catch (e) { /* ignore */ }
  return ICO_DEFAULT;
};

/** 保存默认生成尺寸 */
export const setDefaultSize = (size: IcoSize) => {
  try {
    localStorage.setItem('ico:default-size', String(size));
  } catch (e) { /* ignore */ }
};

/** data URL (base64) -> Uint8Array */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/**
 * 将单张 PNG 字节封装为单尺寸 ICO 文件字节
 * @param png PNG 图像字节 (透明通道会被保留)
 * @param size 目标尺寸 (16/24/32/48/64)
 */
export const pngToIco = (png: Uint8Array, size: number): Uint8Array => {
  if (!(ICO_SIZES as readonly number[]).includes(size)) {
    throw new Error('不支持的 ICO 尺寸: ' + size);
  }
  // PNG magic 校验 (\x89PNG\r\n\x1a\n)
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.length < 8 || magic.some((b, i) => png[i] !== b)) {
    throw new Error('图片数据不是有效的 PNG');
  }

  const out = new Uint8Array(22 + png.length);
  const v = new DataView(out.buffer);

  // ICONDIR
  v.setUint16(0, 0, true);        // reserved
  v.setUint16(2, 1, true);        // type = 1 (icon)
  v.setUint16(4, 1, true);        // count = 1
  // ICONDIRENTRY
  v.setUint8(6, size);            // width
  v.setUint8(7, size);            // height
  v.setUint8(8, 0);               // color count (0 = 不指定)
  v.setUint8(9, 0);               // reserved
  v.setUint16(10, 1, true);       // planes
  v.setUint16(12, 32, true);      // bit count (32bpp)
  v.setUint32(14, png.length, true); // bytes in resource
  v.setUint32(18, 22, true);      // image offset (6 + 16)

  out.set(png, 22);
  return out;
};
