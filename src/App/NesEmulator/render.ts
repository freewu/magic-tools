// NES 模拟器: 画面渲染 (256×240 帧缓冲 -> canvas)
// jsnes 的 onFrame 每帧给一个 Uint32Array (每像素 0xAABBGGRR), 直接塞进 ImageData 再 putImageData 即可
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './data';

export interface NesRenderer {
  /** 用一帧像素数据刷新画面 */
  draw(frame: Uint32Array): void;
  /** 导出当前画面为 PNG data URL (截屏); 失败返回 null */
  snapshot(): string | null;
  /** 清空画面 (未加载 ROM / 停止时) */
  clear(): void;
}

/**
 * 创建渲染器
 * canvas 取不到 2D 上下文 (如测试环境的 jsdom) 时返回 null, 调用方需容忍无画面
 */
export const createRenderer = (
  canvas: HTMLCanvasElement | null,
  width: number = SCREEN_WIDTH,
  height: number = SCREEN_HEIGHT,
): NesRenderer | null => {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    return null;
  }
  if (!ctx) return null;
  canvas.width = width;
  canvas.height = height;
  const image = ctx.createImageData(width, height);
  const view = new Uint32Array(image.data.buffer as ArrayBuffer);
  const size = view.length;
  return {
    draw(frame: Uint32Array): void {
      if (!frame || frame.length < size) return;
      // 浏览器均按小端存放 RGBA, 与 jsnes 的 0xAABBGGRR 布局一致, 直接整块拷贝最快
      view.set(frame.subarray(0, size));
      ctx.putImageData(image, 0, 0);
    },
    snapshot(): string | null {
      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
    clear(): void {
      ctx.clearRect(0, 0, width, height);
    },
  };
};

export default createRenderer;
