// 番茄时钟: 背景图片处理 —— 把用户选择的图片等比压缩成可持久化的 dataURL
//
// 背景图会随「默认设置」一起存进 localStorage, 原图动辄几 MB 会直接撑爆配额,
// 因此统一压到 BG_IMAGE_MAX_SIDE 以内并用 JPEG 有损编码; canvas 不可用时退回原图。
import { dataUrlBytes, drawToCanvas, exportDataUrl, fitWithin, loadImageFile } from '../../lib/image';

/** 压缩后最长边 (px); 时钟大屏实际显示尺寸有限, 再大只会拖慢与占空间 */
export const BG_IMAGE_MAX_SIDE = 1920;
/** 输出 JPEG 质量 */
export const BG_IMAGE_QUALITY = 0.82;
/** dataURL 字符数上限 (约 1.5MB 二进制); 超过直接拒绝, 避免写坏 localStorage */
export const BG_IMAGE_MAX_CHARS = 2_000_000;

/** 压缩后仍超限的错误标识 (页面据此提示「图片过大」) */
export const TOO_LARGE = 'too-large';

/** 处理结果: url 可直接用作 CSS background-image */
export interface PreparedBackground {
  /** dataURL (或 canvas 不可用时退回的原始 dataURL) */
  url: string;
  /** 大致字节数 */
  bytes: number;
}

/**
 * 把图片文件处理成可持久化的背景图 dataURL
 * - 非图片 / 读取失败 / 解码失败: 抛 `ImageError` (见 lib/image)
 * - 处理结果仍超过 BG_IMAGE_MAX_CHARS: 抛 `Error(TOO_LARGE)`
 */
export const prepareBackgroundImage = async (file: File): Promise<PreparedBackground> => {
  const { img, size, url } = await loadImageFile(file);
  const target = fitWithin(size, BG_IMAGE_MAX_SIDE, BG_IMAGE_MAX_SIDE);
  // 铺白底: JPEG 无透明通道, 避免 PNG 透明区导出后变黑
  const canvas = drawToCanvas(img, target, true);
  const out = canvas ? exportDataUrl(canvas, 'JPEG', BG_IMAGE_QUALITY) : url;
  if (out.length > BG_IMAGE_MAX_CHARS) throw new Error(TOO_LARGE);
  return { url: out, bytes: dataUrlBytes(out) };
};
